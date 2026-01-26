import Thumbnail from "../model/thumbnail.js";
import User from "../model/user.js";
import { v2 as cloudinary } from "cloudinary";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
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

export const generateThumbnail = async (req, res) => {
  let thumbnail = null;
  let uploadedReferenceImageUrl = null;

  try {
    // 1. Setup Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const { userId } = req.session;
    const {
      title,
      prompt: userPrompt,
      color_scheme,
      aspectRatio,
      style,
      text_overlay,
      additionalDetails,
      model,
    } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const creditCost = model === "premium" ? 10 : 5;
    if (user.credits < creditCost) {
      return res.status(400).json({
        message: "Insufficient credits",
        required: creditCost,
        available: user.credits,
      });
    }

    // 2. Handle Reference Image
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const referenceUpload = await cloudinary.uploader.upload(base64Image, {
        folder: "reference_images",
        resource_type: "image",
      });
      uploadedReferenceImageUrl = referenceUpload.secure_url;
    }

    // 3. Create Record
    thumbnail = await Thumbnail.create({
      userId,
      title,
      user_prompt: userPrompt,
      description: additionalDetails,
      color_scheme: color_scheme || "vibrant",
      aspect_ratio: aspectRatio || "16:9",
      style: style || "Bold & Graphic",
      text_overlay: text_overlay || false,
      reference_image_url: uploadedReferenceImageUrl,
      isGenerating: true,
    });

    // 4. Build Prompt
    const stylePrompt = stylePrompts[style] || stylePrompts["Bold & Graphic"];
    const colorDesc = colorSchemeDescriptions[color_scheme] || colorSchemeDescriptions.vibrant;

    let finalPrompt = `A YouTube thumbnail with large bold text saying "${title}" in the center. ${stylePrompt}. ${colorDesc}. Add Youtube logo in a corner. Like, Share and Subscribe button.`;
    if (uploadedReferenceImageUrl) finalPrompt += ` Use elements from the reference image.`;
    if (additionalDetails) finalPrompt += ` ${additionalDetails}.`;
    if (userPrompt) finalPrompt += ` ${userPrompt}.`;

    // 5. Run Replicate
    console.log("🚀 Calling Replicate API...");
    const input = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio || "16:9",
      output_format: "png",
    };

    const output = await replicate.run("google/gemini-2.5-flash-image", { input });

    // 6. ✅ HANDLE RAW BINARY DATA (The Fix)
    let imageDataForCloudinary;

    if (output instanceof ReadableStream) {
      console.log("📦 Handling ReadableStream from Replicate...");
      const chunks = [];
      const reader = output.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);
      // Convert raw binary to Base64 so Cloudinary can read it
      imageDataForCloudinary = `data:image/png;base64,${buffer.toString("base64")}`;
    } else if (Array.isArray(output)) {
      imageDataForCloudinary = output[0];
    } else {
      imageDataForCloudinary = output.toString();
    }

    // 7. Upload to Cloudinary
    console.log("📤 Uploading generated image to Cloudinary...");
    const cloudinaryResult = await cloudinary.uploader.upload(imageDataForCloudinary, {
      folder: "thumbnails",
      public_id: `thumb_${thumbnail._id}`,
      resource_type: "image",
      overwrite: true,
    });

    // 8. Finalize
    user.credits -= creditCost;
    await user.save();

    thumbnail.image_url = cloudinaryResult.secure_url;
    thumbnail.prompt_used = finalPrompt;
    thumbnail.isGenerating = false;
    await thumbnail.save();

    res.status(201).json({
      message: "Thumbnail generated successfully",
      thumbnail,
      creditsRemaining: user.credits,
    });

  } catch (error) {
    console.error("❌ Generation Error:", error.message);
    if (thumbnail) {
      thumbnail.isGenerating = false;
      await thumbnail.save();
    }
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate", error: error.message });
    }
  }
};

export const deleteThumbnail = async (req, res) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const thumbnail = await Thumbnail.findOneAndDelete({ _id: id, userId });
    if (!thumbnail) return res.status(404).json({ message: "Not found" });

    if (thumbnail.image_url) {
      const publicId = `thumbnails/thumb_${id}`;
      await cloudinary.uploader.destroy(publicId);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};