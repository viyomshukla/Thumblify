import express from 'express';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary'; // 1. Import Cloudinary
import protectRoute from '../middleware/auth2.js';
import User from '../model/user.js';
import Thumbnail from '../model/thumbnail.js';
import { 
  extractVideoId, 
  downloadThumbnailAsBase64, 
  getVideoMetadata,
  getYouTubeThumbnail
} from '../config/youtubeUtils.js';
import { analyzeThumbnail, generateImprovedPrompt } from '../config/thumbnailAnalyzer.js';
import dotenv from 'dotenv';

dotenv.config();

// 2. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Analyze YouTube thumbnail
router.post('/analyze', protectRoute, async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return res.status(400).json({ error: 'YouTube URL is required' });

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

    console.log('📺 Analyzing YouTube video:', videoId);
    const metadata = await getVideoMetadata(videoId);
    const thumbnailUrl = getYouTubeThumbnail(videoId);

    const analysis = await analyzeThumbnail(thumbnailUrl, metadata?.title || 'YouTube Video');

    res.json({ success: true, videoId, metadata, thumbnailUrl, analysis });
  } catch (error) {
    console.error('YouTube analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze YouTube thumbnail', details: error.message });
  }
});

// Generate improved thumbnail from YouTube
// Generate improved thumbnail from YouTube using Nano Banana Pro
router.post('/improve', protectRoute, async (req, res) => {
  try {
    const { 
      youtubeUrl, 
      customPrompt, 
      aspectRatio, 
      style,
      colorScheme,
      additionalDetails,
      model: modelType 
    } = req.body;

    if (!youtubeUrl) return res.status(400).json({ error: 'YouTube URL is required' });

    const { userId } = req.session;
    const user = await User.findById(userId);

    // Nano Banana Pro usually costs more credits (adjust as needed)
    const requiredCredits = modelType === 'premium' ? 20 : 10;
    if (user.credits < requiredCredits) {
      return res.status(402).json({ error: 'Insufficient credits', required: requiredCredits, current: user.credits });
    }

    const videoId = extractVideoId(youtubeUrl);
    const metadata = await getVideoMetadata(videoId);
    const originalThumbnailUrl = getYouTubeThumbnail(videoId);
    const originalThumbnailBase64 = await downloadThumbnailAsBase64(videoId);

    // Generate prompt logic
    let finalPrompt = customPrompt;
    if (!customPrompt) {
      const analysis = await analyzeThumbnail(originalThumbnailUrl, metadata?.title || 'YouTube Video');
      finalPrompt = generateImprovedPrompt(analysis, metadata?.title, { style, colorScheme, additionalDetails });
    }

    console.log('📝 Using Prompt for Nano Banana Pro:', finalPrompt);

    // 3. Generate with Replicate (NANO BANANA PRO)
    const output = await replicate.run(
      // "google/nano-banana-pro",
      "google/gemini-2.5-flash-image",
      {
        input: {
          prompt: finalPrompt,
          // Nano Banana Pro expects an array for image_input
          image_input: [originalThumbnailBase64], 
          aspect_ratio: aspectRatio || "16:9",
          // Choose 2K or 4K for premium results
          resolution: modelType === 'premium' ? "4K" : "2K",
          output_format: "jpg",
          safety_filter_level: "block_only_high"
        }
      }
    );

    // Extract the URL (Nano Banana Pro returns a FileOutput or array)
    const generatedUrl = Array.isArray(output) ? output[0].toString() : output.toString();

    // 4. UPLOAD TO CLOUDINARY
    console.log('📤 Uploading Pro-quality image to Cloudinary...');
    const cloudinaryUpload = await cloudinary.uploader.upload(generatedUrl, {
      folder: "new_thumnail",
      resource_type: "image"
    });

    const finalImageUrl = cloudinaryUpload.secure_url;

    // 5. Save to database
    const thumbnail = new Thumbnail({
      userId: userId,
      title: metadata?.title || 'Pro YouTube Thumbnail',
      image_url: finalImageUrl,
      prompt: finalPrompt,
      original_youtube_url: youtubeUrl,
      original_thumbnail_url: originalThumbnailUrl,
      aspect_ratio: aspectRatio || "16:9",
      style: style || 'Bold & Graphic',
      model: "nano-banana-pro"
    });
    await thumbnail.save();

    // Deduct credits
    user.credits -= requiredCredits;
    await user.save();

    console.log('✅ Thumbnail saved to Cloudinary and Database');

    res.json({
      success: true,
      thumbnail,
      creditsRemaining: user.credits,
      improvedThumbnailUrl: finalImageUrl
    });

  } catch (error) {
    console.error('Thumbnail improvement error:', error);
    res.status(500).json({ error: 'Failed to improve thumbnail', details: error.message });
  }
});

export default router;