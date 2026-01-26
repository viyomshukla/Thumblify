import WhatsAppUser from '../model/whatsappUser.js';
import User from '../model/user.js';
import Thumbnail from '../model/thumbnail.js';
import { sendWhatsAppMessage, sendWhatsAppImage } from './twilioService.js';
import { 
  extractVideoId, 
  downloadThumbnailAsBase64, 
  getVideoMetadata,
  getYouTubeThumbnail
} from './youtubeUtils.js';
import { analyzeThumbnail, generateImprovedPrompt } from './thumbnailAnalyzer.js';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

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

/**
 * Main conversation handler
 */
export async function handleConversation(whatsappUser, messageBody, from) {
  const state = whatsappUser.conversationState;
  const message = messageBody.trim().toLowerCase();

  try {
    switch (state) {
      case 'main_menu':
        return await handleMainMenu(whatsappUser, message, from);
      case 'waiting_for_title':
        return await handleTitleInput(whatsappUser, messageBody, from);
      case 'waiting_for_credit_choice':
        return await handleCreditChoice(whatsappUser, message, from);
      case 'waiting_for_prompt':
        return await handlePromptInput(whatsappUser, messageBody, from);
      case 'waiting_for_url':
        return await handleUrlInput(whatsappUser, messageBody, from);
      case 'waiting_for_youtube_credit_choice':
        return await handleYouTubeCreditChoice(whatsappUser, message, from);
      case 'showing_result':
        return await handleResultFeedback(whatsappUser, message, from);
      case 'waiting_for_retry':
        return await handleRetryChoice(whatsappUser, message, from);
      default:
        return await sendMainMenu(from, whatsappUser);
    }
  } catch (error) {
    console.error('❌ Conversation handler error:', error);
    await sendWhatsAppMessage(from, "❌ Oops! Something went wrong. Let's start over.");
    whatsappUser.conversationState = 'main_menu';
    await whatsappUser.save();
  }
}

/**
 * Handle main menu choice (1 or 2)
 */
async function handleMainMenu(whatsappUser, message, from) {
  if (message === '1') {
    await sendWhatsAppMessage(from, 
      "🎨 *Create New Thumbnail*\n\nPlease send me the *title* for your thumbnail.\n\nExample: \"10 Amazing Life Hacks\""
    );
    whatsappUser.conversationState = 'waiting_for_title';
    whatsappUser.currentThumbnailData = {}; // Reset data
    await whatsappUser.save();
    return;
  }

  if (message === '2') {
    await sendWhatsAppMessage(from, 
      "🔗 *Improve YouTube Thumbnail*\n\nPlease send me your *YouTube video URL*.\n\nExample: https://youtube.com/watch?v=..."
    );
    whatsappUser.conversationState = 'waiting_for_url';
    whatsappUser.currentThumbnailData = {}; // Reset data
    await whatsappUser.save();
    return;
  }

  // Invalid choice
  await sendWhatsAppMessage(from, 
    "❌ Invalid choice. Please reply with:\n\n1️⃣ Create New Thumbnail\n2️⃣ Improve YouTube Thumbnail"
  );
}

/**
 * Handle title input for new thumbnail
 */
async function handleTitleInput(whatsappUser, title, from) {
  const user = await User.findById(whatsappUser.user);
  
  whatsappUser.currentThumbnailData.title = title;
  whatsappUser.conversationState = 'waiting_for_credit_choice';
  await whatsappUser.save();

  await sendWhatsAppMessage(from, 
    `✅ Title saved: "${title}"\n\n` +
    `💳 *Choose Quality Level*\n\n` +
    `Current Credits: ${user.credits}\n\n` +
    `1️⃣ *Basic* - 5 credits\n` +
    `   • Standard quality\n` +
    `   • Fast generation\n` +
    `   • Good for quick thumbnails\n\n` +
    `2️⃣ *Premium* - 10 credits\n` +
    `   • High quality\n` +
    `   • Advanced AI model\n` +
    `   • Professional results\n\n` +
    `Reply with *1* for Basic or *2* for Premium`
  );
}

/**
 * Handle credit choice for new thumbnail
 */

/**
 * Handle credit choice for new thumbnail
 */
async function handleCreditChoice(whatsappUser, message, from) {
  const user = await User.findById(whatsappUser.user);

  if (message === '1') {
    if (user.credits < 5) {
      await sendWhatsAppMessage(from, 
        `❌ Insufficient credits. You need 5 credits for Basic.\n\n` +
        `Current balance: ${user.credits} credits.\n\n` +
        `Please purchase more credits on our website.`
      );
      whatsappUser.conversationState = 'main_menu';
      await whatsappUser.save();
      return;
    }

    // ✅ IMPROVED: Set each field individually
    whatsappUser.currentThumbnailData.qualityTier = 'basic';
    whatsappUser.currentThumbnailData.creditsToDeduct = 5;
    whatsappUser.conversationState = 'waiting_for_prompt';
    
    // ✅ Mark as modified
    whatsappUser.markModified('currentThumbnailData');
    await whatsappUser.save();

    console.log('✅ Saved quality tier:', whatsappUser.currentThumbnailData.qualityTier);
    console.log('✅ Saved credits:', whatsappUser.currentThumbnailData.creditsToDeduct);

    await sendWhatsAppMessage(from, 
      `✅ *Basic Quality* selected (5 credits)\n\n` +
      `📝 Now, describe what you want in the thumbnail.\n\n` +
      `Example: "Bold text with vibrant colors, gaming theme, neon effects"`
    );
    return;
  }

  if (message === '2') {
    if (user.credits < 10) {
      await sendWhatsAppMessage(from, 
        `❌ Insufficient credits. You need 10 credits for Premium.\n\n` +
        `Current balance: ${user.credits} credits.\n\n` +
        `Please purchase more credits on our website.`
      );
      whatsappUser.conversationState = 'main_menu';
      await whatsappUser.save();
      return;
    }

    // ✅ IMPROVED: Set each field individually
    whatsappUser.currentThumbnailData.qualityTier = 'premium';
    whatsappUser.currentThumbnailData.creditsToDeduct = 10;
    whatsappUser.conversationState = 'waiting_for_prompt';
    
    // ✅ Mark as modified
    whatsappUser.markModified('currentThumbnailData');
    await whatsappUser.save();

    console.log('✅ Saved quality tier:', whatsappUser.currentThumbnailData.qualityTier);
    console.log('✅ Saved credits:', whatsappUser.currentThumbnailData.creditsToDeduct);

    await sendWhatsAppMessage(from, 
      `✅ *Premium Quality* selected (10 credits)\n\n` +
      `📝 Now, describe what you want in the thumbnail.\n\n` +
      `Example: "Bold text with vibrant colors, gaming theme, neon effects"`
    );
    return;
  }

  await sendWhatsAppMessage(from, 
    "❌ Invalid choice. Please reply with:\n1️⃣ Basic (5 credits)\n2️⃣ Premium (10 credits)"
  );
}

/**
 * Handle prompt input for new thumbnail
 */
async function handlePromptInput(whatsappUser, prompt, from) {
  whatsappUser.currentThumbnailData.prompt = prompt;
  whatsappUser.conversationState = 'generating';
  await whatsappUser.save();

  const qualityTier = whatsappUser.currentThumbnailData.qualityTier;
  const tierText = qualityTier === 'premium' ? 'Premium' : 'Basic';

  await sendWhatsAppMessage(from, 
    `⏳ Creating your *${tierText}* thumbnail... This will take 15-20 seconds. Please wait! 🎨`
  );

  // Generate thumbnail
  await generateNewThumbnail(whatsappUser, from);
}

/**
 * Handle YouTube URL input
 */
async function handleUrlInput(whatsappUser, url, from) {
  // Validate YouTube URL
  const videoId = extractVideoId(url);
  if (!videoId) {
    await sendWhatsAppMessage(from, 
      "❌ Invalid YouTube URL. Please send a valid URL.\n\nExample: https://youtube.com/watch?v=dQw4w9WgXcQ"
    );
    return;
  }

  const user = await User.findById(whatsappUser.user);

  whatsappUser.currentThumbnailData.youtubeUrl = url;
  whatsappUser.conversationState = 'waiting_for_youtube_credit_choice';
  await whatsappUser.save();

  await sendWhatsAppMessage(from, 
    `✅ YouTube URL received!\n\n` +
    `💳 *Choose Quality Level*\n\n` +
    `Current Credits: ${user.credits}\n\n` +
    `1️⃣ *Basic* - 5 credits\n` +
    `   • Standard improvement\n` +
    `   • Fast processing\n\n` +
    `2️⃣ *Premium* - 10 credits\n` +
    `   • Advanced improvement\n` +
    `   • Better analysis & enhancement\n\n` +
    `Reply with *1* for Basic or *2* for Premium`
  );
}

/**
 * Handle credit choice for YouTube thumbnail improvement
 */
async function handleYouTubeCreditChoice(whatsappUser, message, from) {
  const user = await User.findById(whatsappUser.user);

  if (message === '1') {
    if (user.credits < 5) {
      await sendWhatsAppMessage(from, 
        `❌ Insufficient credits. You need 5 credits for Basic.\n\n` +
        `Current balance: ${user.credits} credits.`
      );
      whatsappUser.conversationState = 'main_menu';
      await whatsappUser.save();
      return;
    }

    // ✅ IMPROVED: Set each field individually
    whatsappUser.currentThumbnailData.qualityTier = 'basic';
    whatsappUser.currentThumbnailData.creditsToDeduct = 5;
    whatsappUser.conversationState = 'generating';
    
    // ✅ Mark as modified
    whatsappUser.markModified('currentThumbnailData');
    await whatsappUser.save();

    console.log('✅ YouTube - Saved quality:', whatsappUser.currentThumbnailData.qualityTier);
    console.log('✅ YouTube - Saved credits:', whatsappUser.currentThumbnailData.creditsToDeduct);

    await sendWhatsAppMessage(from, 
      "⏳ Analyzing and improving your thumbnail with *Basic* quality... This will take 30-35 seconds. Please wait! 🔍"
    );

    await generateImprovedThumbnail(whatsappUser, from);
    return;
  }

  if (message === '2') {
    if (user.credits < 10) {
      await sendWhatsAppMessage(from, 
        `❌ Insufficient credits. You need 10 credits for Premium.\n\n` +
        `Current balance: ${user.credits} credits.`
      );
      whatsappUser.conversationState = 'main_menu';
      await whatsappUser.save();
      return;
    }

    // ✅ IMPROVED: Set each field individually
    whatsappUser.currentThumbnailData.qualityTier = 'premium';
    whatsappUser.currentThumbnailData.creditsToDeduct = 10;
    whatsappUser.conversationState = 'generating';
    
    // ✅ Mark as modified
    whatsappUser.markModified('currentThumbnailData');
    await whatsappUser.save();

    console.log('✅ YouTube - Saved quality:', whatsappUser.currentThumbnailData.qualityTier);
    console.log('✅ YouTube - Saved credits:', whatsappUser.currentThumbnailData.creditsToDeduct);

    await sendWhatsAppMessage(from, 
      "⏳ Analyzing and improving your thumbnail with *Premium* quality... This will take 30-35 seconds. Please wait! 🔍"
    );

    await generateImprovedThumbnail(whatsappUser, from);
    return;
  }

  await sendWhatsAppMessage(from, 
    "❌ Invalid choice. Please reply with:\n1️⃣ Basic (5 credits)\n2️⃣ Premium (10 credits)"
  );
}


/**


/**
 * Handle result feedback (yes/no)
 */
async function handleResultFeedback(whatsappUser, message, from) {
  if (message === 'yes' || message === 'y' || message === '✅') {
    await sendWhatsAppMessage(from, 
      "🎉 Awesome! Your thumbnail has been saved.\n\n" +
      "What's next?\n" +
      "1️⃣ Create Another Thumbnail\n" +
      "2️⃣ Improve Another YouTube Thumbnail\n\n" +
      "Reply with *1* or *2*"
    );
    whatsappUser.conversationState = 'main_menu';
    whatsappUser.currentThumbnailData = {};
    await whatsappUser.save();
    return;
  }

  if (message === 'no' || message === 'n' || message === '❌') {
    await sendWhatsAppMessage(from, 
      "No problem! What would you like to do?\n\n" +
      "1️⃣ Try again with new prompt\n" +
      "2️⃣ Go back to main menu\n\n" +
      "Reply with *1* or *2*"
    );
    whatsappUser.conversationState = 'waiting_for_retry';
    await whatsappUser.save();
    return;
  }

  // Invalid response
  await sendWhatsAppMessage(from, 
    "Please reply with:\n*yes* - Keep this thumbnail\n*no* - Create a new one"
  );
}

/**
 * Handle retry choice
 */
async function handleRetryChoice(whatsappUser, message, from) {
  if (message === '1') {
    // Try again
    const data = whatsappUser.currentThumbnailData;
    
    if (data.youtubeUrl) {
      // Was improving YouTube thumbnail
      await sendWhatsAppMessage(from, 
        "🔗 Please send your YouTube URL again:"
      );
      whatsappUser.conversationState = 'waiting_for_url';
    } else {
      // Was creating new thumbnail
      await sendWhatsAppMessage(from, 
        "🎨 Please send the title again:"
      );
      whatsappUser.conversationState = 'waiting_for_title';
    }
    whatsappUser.currentThumbnailData = {};
    await whatsappUser.save();
    return;
  }

  if (message === '2') {
    // Back to main menu
    await sendMainMenu(from, whatsappUser);
    return;
  }

  // Invalid choice
  await sendWhatsAppMessage(from, 
    "❌ Invalid choice. Reply with:\n1️⃣ Try again\n2️⃣ Main menu"
  );
}

/**
 * Generate new thumbnail (Option 1)
 */
async function generateNewThumbnail(whatsappUser, from) {
  try {
    // ✅ FIX: Add fallback for creditsToDeduct
    const { title, prompt, qualityTier = 'basic', creditsToDeduct = 5 } = whatsappUser.currentThumbnailData || {};
    const user = await User.findById(whatsappUser.user);

    // ✅ Additional validation
    if (!title || !prompt) {
      await sendWhatsAppMessage(from, 
        "❌ Missing title or prompt. Let's start over."
      );
      whatsappUser.conversationState = 'main_menu';
      await whatsappUser.save();
      return;
    }

    // ✅ Ensure creditsToDeduct is a valid number
    const credits = parseInt(creditsToDeduct) || 5;

    console.log('💳 Credits to deduct:', credits);
    console.log('💰 User current credits:', user.credits);

    // Double-check credits
    if (user.credits < credits) {
      await sendWhatsAppMessage(from, 
        `❌ Insufficient credits. You need ${credits} credits.\n\nCurrent balance: ${user.credits} credits.`
      );
      whatsappUser.conversationState = 'main_menu';
      await whatsappUser.save();
      return;
    }

    // Generate with Replicate
    const finalPrompt = `${title}. ${prompt}. Professional YouTube thumbnail style, high quality, eye-catching with Youtube logo in a corner. Like,Share and Subscribe button.${title} in bold text place at center.`;

    console.log(`🎨 Generating ${qualityTier} thumbnail with prompt:`, finalPrompt);

    const output = await replicate.run(
      "google/gemini-2.5-flash-image",
      {
        input: {
          prompt: finalPrompt,
          aspect_ratio: "16:9",
          output_format: "jpg",
          num_outputs: 1
        }
      }
    );

    // Convert FileOutput to URL string
    let generatedUrl;
    if (Array.isArray(output)) {
      generatedUrl = output[0].toString();
    } else {
      generatedUrl = output.toString();
    }

    console.log('✅ Generated URL:', generatedUrl);

    // Upload to Cloudinary
    console.log('📤 Uploading to Cloudinary...');
    const cloudinaryUpload = await cloudinary.uploader.upload(generatedUrl, {
      folder: `whatsapp_thumbnails/${qualityTier}`,
      resource_type: "image"
    });

    const finalImageUrl = cloudinaryUpload.secure_url;
    console.log('✅ Uploaded to Cloudinary:', finalImageUrl);

    // Save to database
    const thumbnail = new Thumbnail({
      userId: user._id,
      title: title,
      image_url: finalImageUrl,
      prompt: finalPrompt,
      aspect_ratio: "16:9",
      style: 'Bold & Graphic',
      model: qualityTier === 'premium' ? 'gemini-premium' : 'gemini-basic'
    });
    await thumbnail.save();

    // ✅ FIX: Deduct credits safely
    const newCredits = user.credits - credits;
    console.log('💳 New credit balance:', newCredits);
    
    user.credits = newCredits;
    await user.save();

    // Update state
    whatsappUser.currentThumbnailData.lastGeneratedImageUrl = finalImageUrl;
    whatsappUser.conversationState = 'showing_result';
    whatsappUser.markModified('currentThumbnailData');
    await whatsappUser.save();

    // Send image to user
    const tierEmoji = qualityTier === 'premium' ? '⭐' : '✅';
    await sendWhatsAppImage(from, finalImageUrl, 
      `${tierEmoji} Here's your *${qualityTier.toUpperCase()}* thumbnail!\n\n` +
      `💳 Credits used: ${credits}\n` +
      `📊 Credits remaining: ${newCredits}\n\n` +
      `Do you like it?\nReply *yes* to keep it or *no* to try again.`
    );

    console.log('✅ Thumbnail sent successfully!');

  } catch (error) {
    console.error('❌ Generate thumbnail error:', error);
    console.error('Error details:', error.message);
    await sendWhatsAppMessage(from, 
      "❌ Failed to generate thumbnail. Please try again.\n\nReply with *1* or *2* to start over."
    );
    whatsappUser.conversationState = 'main_menu';
    await whatsappUser.save();
  }
}

/**
 * Generate improved thumbnail from YouTube (Option 2)
 */
async function generateImprovedThumbnail(whatsappUser, from) {
  try {
    // ✅ FIX: Add fallback for creditsToDeduct
    const { youtubeUrl, qualityTier = 'basic', creditsToDeduct = 5 } = whatsappUser.currentThumbnailData || {};
    const user = await User.findById(whatsappUser.user);

    // ✅ Ensure creditsToDeduct is a valid number
    const credits = parseInt(creditsToDeduct) || 5;

    console.log('💳 Credits to deduct:', credits);
    console.log('💰 User current credits:', user.credits);

    // Double-check credits
    if (user.credits < credits) {
      await sendWhatsAppMessage(from, 
        `❌ Insufficient credits. You need ${credits} credits.\n\nCurrent balance: ${user.credits} credits.`
      );
      whatsappUser.conversationState = 'main_menu';
      await whatsappUser.save();
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    const metadata = await getVideoMetadata(videoId);
    const originalThumbnailUrl = getYouTubeThumbnail(videoId);
    const originalThumbnailBase64 = await downloadThumbnailAsBase64(videoId);

    console.log(`📺 Improving thumbnail with ${qualityTier} quality`);
    console.log('📋 Title:', metadata?.title);

    // Enhanced prompt for premium
    const improvedPrompt = qualityTier === 'premium'
      ? `Professional YouTube thumbnail for: ${metadata?.title || 'video'}. Bold text overlay, vibrant colors, high contrast, eye-catching design, 4K quality, modern style, engaging composition with Youtube logo in a corner. Like, Share and Subscribe button. Premium quality with advanced details and effects.`
      : `Professional YouTube thumbnail for: ${metadata?.title || 'video'}. Bold text overlay, vibrant colors, high contrast, eye-catching design, modern style with Youtube logo in a corner. Like, Share and Subscribe button.`;

    console.log('🔍 Improved Prompt:', improvedPrompt);

    // Generate
    const output = await replicate.run(
      "google/gemini-2.5-flash-image",
      {
        input: {
          prompt: improvedPrompt,
          image_input: [originalThumbnailBase64],
          aspect_ratio: "16:9",
          resolution: qualityTier === 'premium' ? "4K" : "2K",
          output_format: "jpg",
          safety_filter_level: "block_only_high"
        }
      }
    );

    // Convert FileOutput to URL string
    let generatedUrl;
    if (Array.isArray(output)) {
      generatedUrl = output[0].toString();
    } else {
      generatedUrl = output.toString();
    }

    console.log('✅ Generated URL:', generatedUrl);

    // Upload to Cloudinary
    console.log('📤 Uploading to Cloudinary...');
    const cloudinaryUpload = await cloudinary.uploader.upload(generatedUrl, {
      folder: `whatsapp_youtube_thumbnails/${qualityTier}`,
      resource_type: "image"
    });

    const finalImageUrl = cloudinaryUpload.secure_url;
    console.log('✅ Uploaded to Cloudinary:', finalImageUrl);

    // Save to database
    const thumbnail = new Thumbnail({
      userId: user._id,
      title: metadata?.title || 'Improved YouTube Thumbnail',
      image_url: finalImageUrl,
      prompt: improvedPrompt,
      original_youtube_url: youtubeUrl,
      original_thumbnail_url: originalThumbnailUrl,
      aspect_ratio: "16:9",
      style: 'Bold & Graphic',
      model: qualityTier === 'premium' ? 'gemini-premium' : 'gemini-basic'
    });
    await thumbnail.save();

    // ✅ FIX: Deduct credits safely
    const newCredits = user.credits - credits;
    console.log('💳 New credit balance:', newCredits);
    
    user.credits = newCredits;
    await user.save();

    // Update state
    whatsappUser.currentThumbnailData.lastGeneratedImageUrl = finalImageUrl;
    whatsappUser.conversationState = 'showing_result';
    whatsappUser.markModified('currentThumbnailData');
    await whatsappUser.save();

    // Send image
    const tierEmoji = qualityTier === 'premium' ? '⭐' : '✅';
    await sendWhatsAppImage(from, finalImageUrl, 
      `${tierEmoji} Here's your *${qualityTier.toUpperCase()}* improved thumbnail!\n\n` +
      `💳 Credits used: ${credits}\n` +
      `📊 Credits remaining: ${newCredits}\n\n` +
      `Do you like it?\nReply *yes* to keep it or *no* to try again.`
    );

    console.log('✅ Improved thumbnail sent successfully!');

  } catch (error) {
    console.error('❌ Improve thumbnail error:', error);
    console.error('Error details:', error.message);
    await sendWhatsAppMessage(from, 
      "❌ Failed to improve thumbnail. Please try again.\n\nReply with *1* or *2* to start over."
    );
    whatsappUser.conversationState = 'main_menu';
    await whatsappUser.save();
  }
}

/**
 * Send main menu
 */
async function sendMainMenu(from, whatsappUser) {
  await sendWhatsAppMessage(from, 
    "🎨 *Thumblify Menu*\n\nWhat would you like to do?\n\n1️⃣ Create New Thumbnail\n2️⃣ Improve YouTube Thumbnail\n\nReply with *1* or *2*"
  );
  whatsappUser.conversationState = 'main_menu';
  whatsappUser.currentThumbnailData = {};
  await whatsappUser.save();
}