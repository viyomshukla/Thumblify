import User from "../model/user.js";
import Thumbnail from "../model/thumbnail.js";
import Replicate from "replicate";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function uploadFrame(req, res) {
  try {
    const { userId } = req.session;
    const { frameData, videoUrl, videoTitle, model } = req.body;

    // 1. Authentication Check
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!frameData) {
      return res.status(400).json({ error: "Frame data is required" });
    }

    // 2. Get User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 3. Check Credits
    const requiredCredits = model === "premium" ? 10 : 5;
    if (user.credits < requiredCredits) {
      return res.status(402).json({
        error: "Insufficient credits",
        required: requiredCredits,
        current: user.credits,
      });
    }

    console.log("📸 Processing captured video frame...");
    console.log("🎬 Video:", videoTitle);
    console.log("💳 Model:", model, "- Cost:", requiredCredits, "credits");

    // 4. Upload Original Frame to Cloudinary First
    const originalUpload = await cloudinary.uploader.upload(frameData, {
      folder: "Extension_thumbnail/original",
      resource_type: "image",
    });

    console.log("✅ Original frame uploaded:", originalUpload.secure_url);

    // 5. Build Enhanced Prompt with Text Extraction Instructions
    const enhancePrompt = `
A professional YouTube thumbnail based on this video frame. 
Extract ANY text visible in the frame and display it prominently in BOLD, BRIGHT, HIGH-CONTRAST colors (neon yellow, electric blue, or vibrant red with black outline).
Add a small YouTube logo icon in the bottom-right corner.
Add Like, Share, and Subscribe buttons with bell icon at the bottom.
Style: eye-catching, professional, 16:9 aspect ratio, 4K quality.
Video context: ${videoTitle || "captured content"}
`.trim();

    console.log("🎨 Sending to Replicate AI...");
    console.log("📝 Prompt:", enhancePrompt);

    // 6. Generate Enhanced Thumbnail with Replicate
    const input = {
      prompt: enhancePrompt,
      image: originalUpload.secure_url, // Use the uploaded Cloudinary URL
      aspect_ratio: "16:9",
      output_format: "png",
      guidance: 7.5,
      num_inference_steps: model === "premium" ? 50 : 30,
      prompt_strength: 0.7, // Balance between original frame and prompt
    };

    console.log("⚙️ Replicate Input:", JSON.stringify(input, null, 2));

    // Run the nano-banana model (or gemini-2.5-flash-image)
    // const output = await replicate.run("google/nano-banana-pro", { input });
    const output = await replicate.run("google/gemini-2.5-flash-image", { input });

    const generatedImageUrl = Array.isArray(output) 
      ? output[0].toString() 
      : output.toString();

    console.log("✅ AI generated enhanced thumbnail:", generatedImageUrl);

    // 7. Upload Final Enhanced Image to Cloudinary
    const finalUpload = await cloudinary.uploader.upload(generatedImageUrl, {
      folder: "Extension_thumbnail",
      resource_type: "image",
    });

    console.log("✅ Final thumbnail uploaded to Cloudinary:", finalUpload.secure_url);

    // 8. Save to Database
    const thumbnail = new Thumbnail({
      userId: userId,
      title: videoTitle || "Extension Captured Thumbnail",
      image_url: finalUpload.secure_url,
      prompt_used: enhancePrompt,
      reference_image_url: originalUpload.secure_url, // Store original for reference
      color_scheme: "vibrant",
      aspect_ratio: "16:9",
      style: "Bold & Graphic", // Changed from "Extension Capture"
      text_overlay: true,
    });

    await thumbnail.save();
    console.log("💾 Thumbnail saved to database");

    // 9. Deduct Credits
    user.credits -= requiredCredits;
    await user.save();

    console.log("💰 Credits deducted. Remaining:", user.credits);

    // 10. Send Success Response
    res.json({
      success: true,
      thumbnail: {
        _id: thumbnail._id,
        title: thumbnail.title,
        image_url: thumbnail.image_url,
        original_url: originalUpload.secure_url,
      },
      creditsRemaining: user.credits,
    });

  } catch (error) {
    console.error("❌ Upload frame error:", error);
    console.error("❌ Error details:", error.message);
    res.status(500).json({
      error: "Failed to process frame",
      details: error.message,
    });
  }
}