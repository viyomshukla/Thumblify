import express from 'express';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import protectRoute from '../middleware/auth2.js';
import User from '../model/user.js';
import {
  extractVideoId,
  downloadThumbnailAsBase64,
  getVideoMetadata,
  getYouTubeThumbnail
} from '../config/youtubeUtils.js';
import { analyzeThumbnail, generateImprovedPrompt } from '../config/thumbnailAnalyzer.js';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// --- Constants for Prompt Generation (UNTOUCHED) ---

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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const safeAnalyze = async (url, title) => {
  try {
    return await analyzeThumbnail(url, title);
  } catch (err) {
    if (err.status === 429) {
      await delay(7000);
      return await analyzeThumbnail(url, title);
    }
    throw err;
  }
};

// --- ✨ Visual Composition Prompt Factory (UNTOUCHED) ---

function createVariedPrompts(metadata, userStyle, userColor, additionalDetails, channelName) {
  const title = metadata?.title || 'Amazing Video';
  const channel = channelName || metadata?.channelTitle || 'Creator';
  
  const styleBase = stylePrompts[userStyle] || stylePrompts["Bold & Graphic"];
  const colorBase = colorSchemeDescriptions[userColor] || colorSchemeDescriptions["vibrant"];

  const prompt1 = `
    A professional YouTube thumbnail for "${title}". ${styleBase}. Visuals: ${colorBase}. 
    Foreground features massive, bold 3D metallic text of the title floating in center. 
    By ${channel}. Include a glowing YouTube logo in top-right corner. 
    
    🎨 Engagement Section: Across the VERY BOTTOM, a modern translucent glass-morphism panel spans full width containing three interactive elements: 
    1. (Left) A vibrant red "SUBSCRIBE" button with a glowing white bell icon. 
    2. (Center) A large blue thumbs-up "LIKE" icon. 
    3. (Right) A green "SHARE" arrow icon. 
    All elements are glossy with reflections and look highly polished and satisfying. ${additionalDetails}. 
    High fidelity, masterwork.
  `;

  const prompt2 = `
    A striking graphic YouTube thumbnail: "${title}". ${styleBase}. Atmosphere: ${colorBase}. 
    The background is dynamically split diagonally into two contrasting patterns. 
    Professional portrait of the creator (inspired by ${metadata?.thumbnailUrl || 'content'}) with an intense expression. 
    Include branding for "${channel}". 
    
    🎨 Engagement Section: integrated creatively into the composition. A stylized, slightly diagonal horizontal bar below the main title. 
    It features high-contrast pop-art style buttons: 
    - [SUBSCRIBE] in thick-outlined red.
    - [LIKE] (thumbs up) in deep blue.
    - [SHARE] (arrow) in bright green. 
    The buttons use thick borders and look graphic, bold, and modern. ${additionalDetails}.
  `;

  const prompt3 = `
    A hyper-detailed, photorealistic composite design: "${title}". ${styleBase}. Theme: ${colorBase}. 
    Polished surface reflections, dynamic light streaks, and advanced depth of field focusing on main visual subject. 
    A subtle watermark for "${channel}" integrated naturally on foreground surface. 
    
    🎨 Engagement Section: Arranged like satisfying physical objects resting at the BOTTOM RIGHT. 
    - A textured red leather "SUBSCRIBE" patch. 
    - Below it, small polished metallic pins of a thumbs-up (LIKE) and curved arrow (SHARE). 
    The items cast realistic shadows and look incredibly detailed, tactile, and satisfying. ${additionalDetails}. 
    Trending on ArtStation.
  `;

  return [
    { prompt: prompt1, style: "Floating Glass UI" },
    { prompt: prompt2, style: "Diagonal Graphic" },
    { prompt: prompt3, style: "Detailed Composite" }
  ];
}

// --- Routes ---

router.post('/analyze', protectRoute, async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return res.status(400).json({ error: 'YouTube URL is required' });

    const videoId = extractVideoId(youtubeUrl);
    const metadata = await getVideoMetadata(videoId);
    const thumbnailUrl = getYouTubeThumbnail(videoId);

    const analysis = await safeAnalyze(thumbnailUrl, metadata?.title || 'YouTube Video');

    res.json({ success: true, videoId, metadata, thumbnailUrl, analysis });
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

router.post('/improve', protectRoute, async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendSSE = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const { youtubeUrl, style, colorScheme, additionalDetails, model: modelType } = req.body;
    const { userId } = req.session;
    const user = await User.findById(userId);

    const requiredCredits = modelType === 'premium' ? 10 : 5;
    if (user.credits < requiredCredits) {
      sendSSE({ error: 'Insufficient credits' });
      return res.end();
    }

    const videoId = extractVideoId(youtubeUrl);
    const metadata = await getVideoMetadata(videoId);
    const thumbnailUrl = getYouTubeThumbnail(videoId);

    const promptVariations = createVariedPrompts(metadata, style, colorScheme, additionalDetails);

    const modelConfigs = [
      { id: "gemini-flash", replicateModel: "google/nano-banana-pro", label: "Gemini 2.5 Flash", prompt: promptVariations[0].prompt, folder: "gemini_gen" },
      { id: "seedream-4", replicateModel: "google/gemini-2.5-flash-image", label: "SeeDream 4", prompt: promptVariations[1].prompt, folder: "seedream_gen", requiresFile: true },
      { id: "banana-pro", replicateModel: "google/nano-banana-pro", label: "Nano Banana Pro", prompt: promptVariations[2].prompt, folder: "banana_gen" }
    ];

    let successCount = 0;

    for (const config of modelConfigs) {
      try {
        console.log(`🎨 Requesting ${config.label}...`);
        
        let inputConfig = {
          prompt: config.prompt,
          aspect_ratio: "16:9",
          output_format: "png"
        };

        // SeeDream 4 requires a 'file' parameter with image URL
        if (config.requiresFile) {
          inputConfig.file = thumbnailUrl;
        }
        
        const output = await replicate.run(config.replicateModel, {
          input: inputConfig
        });

        // 🛠️ RELIABLE FILEOUTPUT TO BUFFER CONVERSION
        let imageBuffer;
        
        // Check if output is the Replicate FileOutput object
        if (output && typeof output.blob === 'function') {
            const blob = await output.blob();
            const arrayBuffer = await blob.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
        } 
        // If it's a URL string
        else if (typeof output === 'string') {
            imageBuffer = output;
        }
        // If it's a Stream
        else if (output && typeof output[Symbol.asyncIterator] === 'function') {
            const chunks = [];
            for await (const chunk of output) {
                chunks.push(chunk);
            }
            imageBuffer = Buffer.concat(chunks);
        }

        // ☁️ UPLOAD TO CLOUDINARY
        const upload = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: config.folder },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          if (Buffer.isBuffer(imageBuffer)) {
            uploadStream.end(imageBuffer);
          } else {
            // Case for URL strings
            cloudinary.uploader.upload(imageBuffer, { folder: config.folder })
              .then(resolve).catch(reject);
          }
        });

        sendSSE({ 
          preview: {
            image_url: upload.secure_url,
            model: config.label,
            model_id: config.id,
            prompt_used: config.prompt
          } 
        });

        successCount++;
        await delay(2000);

      } catch (err) {
        console.error(`❌ ${config.label} failed:`, err.message);
        sendSSE({ modelError: { model_id: config.id, message: err.message } });
      }
    }

    if (successCount > 0) {
      user.credits -= requiredCredits;
      await user.save();
    }

    sendSSE({ done: true, creditsRemaining: user.credits });
    res.end();

  } catch (error) {
    console.error('Final Error:', error);
    sendSSE({ error: 'Processing error occurred.' });
    res.end();
  }
});

export default router;