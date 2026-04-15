import Thumbnail from "../model/thumbnail.js";
import User from "../model/user.js";
import { v2 as cloudinary } from "cloudinary";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const stylePrompts = {
  "Bold & Graphic": "professional YouTube thumbnail, shocked facial expression, bold typography, vibrant colors, dramatic lighting, high contrast, attention-grabbing, trending style",
  "Tech/Futuristic": "futuristic tech YouTube thumbnail, holographic UI, neon glow, digital particles, sleek modern design, sci-fi aesthetic, 8K quality",
  "Minimalist": "minimalist YouTube thumbnail, clean layout, simple shapes, limited colors, modern flat design, professional typography",
  "Photorealistic": "photorealistic YouTube thumbnail, DSLR photography, studio lighting, sharp focus, professional portrait, cinematic",
  "Illustrated": "digital illustration YouTube thumbnail, bold outlines, vibrant colors, cartoon style, expressive characters, dynamic composition",
};

const colorSchemeDescriptions = {
  vibrant: "vibrant energetic colors, high saturation, bold",
  sunset: "warm sunset orange pink purple gradient",
  forest: "natural green earthy forest tones",
  neon: "neon glow, electric cyan and magenta",
  purple: "purple magenta violet gradient",
  monochrome: "black and white, high contrast",
  ocean: "cool blue and teal ocean tones",
  pastel: "soft pastel colors, gentle tones",
};

// ===== MODEL CONFIGURATIONS WITH UNIQUE PROMPT STYLES =====
const MODEL_CONFIGS = [
  {
    id: "gemini",
    replicateModel: "google/gemini-2.5-flash-image",
    cloudinaryFolder: "gemini_thumbnails",
    modelLabel: "Gemini Flash",
    promptStyle: "cinematic_artistic", // Modern, clean, flat design
  },
  {
    id: "flux-pro",
    replicateModel: "bytedance/seedream-4",
    cloudinaryFolder: "flux_thumbnails",
    modelLabel: "seedream-4",
    promptStyle: "3d_dramatic", // 3D text, dramatic lighting
  },

  //google/nano-banana-pro
  {
    id: "flux-dev",
    replicateModel: "google/gemini-2.5-flash-image",
    cloudinaryFolder: "flux_dev_thumbnails",
    modelLabel: "Flux Dev",
    promptStyle: "cinematic_artistic", // Cinematic, artistic, creative
  },
];

// ===== BUILD UNIQUE PROMPTS FOR EACH MODEL =====
const buildModelPrompt = (modelConfig, title, stylePrompt, colorDesc, channelName, additionalDetails, userPrompt) => {
  let prompt = "";

  switch (modelConfig.promptStyle) {
    case "modern_flat":
      // Gemini: Modern, flat design, clean layout
      prompt = `Create a modern YouTube thumbnail with FLAT DESIGN style. 
The title "${title}" should be displayed in BOLD, SANS-SERIF font with a slight shadow for depth. 
Use ${colorDesc} as the main color scheme. 
${stylePrompt}. 
Add a SMALL red YouTube logo icon in the top-right corner. 
At the bottom, include a clean row of icons: thumbs up (like), share arrow, comment bubble, and bell (subscribe) - all in white with subtle glow. 
Layout: Clean, organized, professional, suitable for tech/education content.
Background: Gradient or geometric patterns.
${additionalDetails ? additionalDetails : ""}
${userPrompt ? userPrompt : ""}`;
      break;

    case "3d_dramatic":
      // Flux Pro: 3D text, dramatic lighting, eye-catching
      prompt = `Create an eye-catching YouTube thumbnail with 3D EXTRUDED TEXT. 
The title "${title}" should be rendered in BOLD 3D letters with dramatic shadows and highlights, appearing to pop out from the background. 
Use ${colorDesc} with high contrast and vibrant lighting effects. 
${stylePrompt}. 
Add a glossy red YouTube play button icon in the top-right corner with 3D depth. 
Place Like, Share, Subscribe buttons and a glowing bell icon at the bottom-left in a stylized button bar with neon glow effects. 
Lighting: Dramatic spotlights, rim lighting, cinematic feel.
Background: Abstract shapes, light rays, energy effects.
${additionalDetails ? additionalDetails : ""}
${userPrompt ? userPrompt : ""}`;
      break;

    case "cinematic_artistic":
      // Flux Dev: Cinematic, artistic, creative composition
      prompt = `Design a CINEMATIC and ARTISTIC YouTube thumbnail with creative composition. 
Display the title "${title}" in BOLD, EXPRESSIVE typography with artistic flourishes or hand-drawn style elements. 
Incorporate ${colorDesc} in an artistic, painterly way. 
${stylePrompt}. 
Integrate a stylized YouTube logo naturally into the top-right corner as part of the artistic composition. 
At the bottom-left, creatively display social engagement icons (like heart, share arrows, comment speech bubbles, subscribe bell) with artistic styling - NOT generic buttons. 
Style: Cinematic color grading, film grain, creative lighting, artistic effects.
Composition: Rule of thirds, dynamic angles, depth of field.
${additionalDetails ? additionalDetails : ""}
${userPrompt ? userPrompt : ""}`;
      break;

    default:
      prompt = `YouTube thumbnail: "${title}". ${stylePrompt}. ${colorDesc}.`;
  }

  return prompt.trim();
};

// ===== HELPERS =====
const processReplicateOutput = async (output) => {
  if (output instanceof ReadableStream) {
    const chunks = [];
    const reader = output.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } else if (Array.isArray(output)) {
    return output[0].toString();
  } else {
    return output.toString();
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ===== GENERATE THUMBNAIL (SSE — streams each preview as it's ready) =====
export const generateThumbnail = async (req, res) => {
  let uploadedReferenceImageUrl = null;

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const sendSSE = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { userId } = req.session;
    const {
      title,
      prompt: userPrompt,
      color_scheme,
      aspectRatio,
      style,
      additionalDetails,
      model: modelTier,
      channelName // ✅ NEW: Optional YouTube channel name
    } = req.body;

    if (!userId) {
      sendSSE({ error: "Unauthorized" });
      res.end();
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      sendSSE({ error: "User not found" });
      res.end();
      return;
    }

    const creditCost = modelTier === "premium" ? 20 : 10;
    if (user.credits < creditCost) {
      sendSSE({ error: "Insufficient credits", required: creditCost, available: user.credits });
      res.end();
      return;
    }

    // Upload reference image if provided
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const referenceUpload = await cloudinary.uploader.upload(base64Image, {
        folder: "reference_images"
      });
      uploadedReferenceImageUrl = referenceUpload.secure_url;
    }

    const stylePrompt = stylePrompts[style] || stylePrompts["Bold & Graphic"];
    const colorDesc = colorSchemeDescriptions[color_scheme] || colorSchemeDescriptions.vibrant;

    console.log("🚀 Running 3 AI models with DIFFERENT prompts (SSE)...");
    let successCount = 0;

    for (let i = 0; i < MODEL_CONFIGS.length; i++) {
      const config = MODEL_CONFIGS[i];

      try {
        // Add delay between requests to avoid rate limits
        if (i > 0) {
          console.log(`⏳ Waiting 15s to avoid rate limits...`);
          await delay(5000);
        }

        // ✅ Build UNIQUE prompt for this specific model
        const uniquePrompt = buildModelPrompt(
          config,
          title,
          stylePrompt,
          colorDesc,
          channelName,
          additionalDetails,
          userPrompt
        );

        console.log(`🎨 [${config.id}] Generating with: ${config.replicateModel}`);
        console.log(`📝 [${config.id}] Prompt style: ${config.promptStyle}`);

        const inputData = {
          prompt: uniquePrompt,
          aspect_ratio: aspectRatio || "16:9",
          output_format: "png",
          num_outputs: 1,
        };

        // Add resolution for models that support it
        if (config.id === "gemini" || config.id === "flux-pro") {
          inputData.resolution = modelTier === "premium" ? "4K" : "2K";
        }

        // Add reference image if uploaded (only for compatible models)
        if (uploadedReferenceImageUrl && config.id !== "flux-dev") {
          inputData.image = uploadedReferenceImageUrl;
          inputData.prompt_strength = 0.7; // How much to follow the prompt vs image
        }

        const output = await replicate.run(config.replicateModel, { input: inputData });

        const imageData = await processReplicateOutput(output);
        const cloudinaryResult = await cloudinary.uploader.upload(imageData, {
          folder: config.cloudinaryFolder,
          public_id: `preview_${userId}_${Date.now()}_${config.id}`,
        });

        const preview = {
          image_url: cloudinaryResult.secure_url,
          model: config.modelLabel,
          model_id: config.id,
          prompt_used: uniquePrompt,
          prompt_style: config.promptStyle,
        };

        // Stream this preview to the client immediately
        sendSSE({ preview });
        successCount++;

        console.log(`✅ [${config.id}] Done! (streamed to client)`);
      } catch (err) {
        console.error(`❌ [${config.id}] Failed:`, err.message);
        sendSSE({ modelError: { model_id: config.id, message: err.message } });
      }
    }

    // Deduct credits only if at least one thumbnail was generated
    if (successCount > 0) {
      user.credits -= creditCost;
      await user.save();
      console.log(`💳 Credits deducted: ${creditCost}. Remaining: ${user.credits}`);
    }

    sendSSE({
      done: true,
      creditsRemaining: user.credits,
      generatedCount: successCount,
      creditsCost: creditCost
    });
    res.end();

  } catch (error) {
    console.error("❌ Generation Error:", error.message);
    sendSSE({ error: error.message });
    res.end();
  }
};


// ===== SAVE THUMBNAIL =====
export const saveThumbnail = async (req, res) => {
  try {
    const { userId } = req.session;
    const {
      image_url,
      model,
      prompt_used,
      title,
      color_scheme,
      aspectRatio,
      style,
      additionalDetails,
      model_id,
      prompt_style
    } = req.body;

    if (!userId || !image_url) {
      return res.status(400).json({ message: "Missing data" });
    }

    console.log(`💾 Saving thumbnail to main folder...`);
    console.log(`📸 From model: ${model} (${model_id})`);

    // Copy image from preview folder to main thumbnails folder
    const cloudinaryResult = await cloudinary.uploader.upload(image_url, {
      folder: "thumbnails",
      public_id: `thumb_${userId}_${Date.now()}_${model_id}`,
    });

    const thumbnail = await Thumbnail.create({
      userId,
      title: title || "Untitled",
      image_url: cloudinaryResult.secure_url,
      prompt_used,
      color_scheme,
      aspect_ratio: aspectRatio,
      style,
      description: additionalDetails,
      model_used: model,
      prompt_style: prompt_style,
      is_favorite: true,
    });

    console.log(`✅ Thumbnail saved! ID: ${thumbnail._id}`);

    res.status(201).json({
      message: "Saved successfully",
      thumbnail
    });
  } catch (error) {
    console.error("❌ Save error:", error);
    res.status(500).json({ message: "Failed to save" });
  }
};

// ===== DELETE THUMBNAIL =====
export const deleteThumbnail = async (req, res) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;

    const thumbnail = await Thumbnail.findOneAndDelete({ _id: id, userId });

    if (!thumbnail) {
      return res.status(404).json({ message: "Not found" });
    }

    // Optional: Delete from Cloudinary
    if (thumbnail.image_url) {
      const publicId = thumbnail.image_url.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId).catch(err => {
        console.log("Cloudinary delete warning:", err.message);
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ success: false });
  }
};