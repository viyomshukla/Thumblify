import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../model/user.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define conversation steps
const STEPS = {
  INITIAL: 'initial',
  CHANNEL_NAME: 'channel_name',
  TARGET_AUDIENCE: 'target_audience',
  CONTENT_TYPE: 'content_type',
  VIDEO_TOPIC: 'video_topic',
  EMOTION_GOAL: 'emotion_goal',
  CALL_TO_ACTION: 'call_to_action',
  VISUAL_PREFERENCE: 'visual_preference',
  COMPLETE: 'complete'
};

// Chat endpoint
router.post('/message', async (req, res) => {
  try {
    const { message, conversationHistory, currentStep, thumbnailData } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check authentication
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ message: "Please Login" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Initialize or update thumbnail data
    const data = thumbnailData || {};
    let nextStep = currentStep || STEPS.INITIAL;
    let prompt = '';
    let showOptions = null;
    let aiResponse = '';

    // Handle conversation flow
    switch (currentStep) {
      case STEPS.INITIAL:
        // Welcome message - ask for channel name
        data.channelName = message;
        nextStep = STEPS.TARGET_AUDIENCE;
        showOptions = {
          type: 'target_audience',
          question: 'Who is your target audience?',
          options: [
            { value: 'below_18', label: 'Below 18 (Kids & Teens)' },
            { value: '18_25', label: '18-25 (Young Adults)' },
            { value: '25_50', label: '25-50 (Adults)' },
            { value: 'above_50', label: 'Above 50 (Seniors)' }
          ]
        };
        aiResponse = `Great! "${message}" sounds like an awesome channel! 🎬\n\nNow let's understand your audience better. Who are you creating content for?`;
        break;

      case STEPS.TARGET_AUDIENCE:
        data.targetAudience = message;
        nextStep = STEPS.CONTENT_TYPE;
        showOptions = {
          type: 'content_type',
          question: 'What type of content do you create?',
          options: [
            { value: 'educational', label: '📚 Educational / Tutorial' },
            { value: 'entertainment', label: '🎭 Entertainment / Comedy' },
            { value: 'gaming', label: '🎮 Gaming' },
            { value: 'lifestyle', label: '✨ Lifestyle / Vlog' },
            { value: 'tech', label: '💻 Tech Reviews' },
            { value: 'fitness', label: '💪 Fitness / Health' },
            { value: 'business', label: '💼 Business / Finance' },
            { value: 'cooking', label: '🍳 Cooking / Food' }
          ]
        };

        const audienceMap = {
          'below_18': 'kids and teens',
          '18_25': 'young adults (18-25)',
          '25_50': 'adults (25-50)',
          'above_50': 'seniors (50+)'
        };

        aiResponse = `Perfect! So you're targeting ${audienceMap[message] || message}. 👥\n\nWhat type of content does your channel focus on?`;
        break;

      case STEPS.CONTENT_TYPE:
        data.contentType = message;
        nextStep = STEPS.VIDEO_TOPIC;
        aiResponse = `Awesome! ${message.charAt(0).toUpperCase() + message.slice(1)} content is really popular! 🔥\n\nNow, tell me - what's this specific video about? (e.g., "10 Tips for Better Sleep", "Ultimate Gaming Setup Guide")`;
        break;

      case STEPS.VIDEO_TOPIC:
        data.videoTopic = message;
        nextStep = STEPS.EMOTION_GOAL;
        showOptions = {
          type: 'emotion_goal',
          question: 'What emotion should your thumbnail evoke?',
          options: [
            { value: 'curiosity', label: '🤔 Curiosity / Mystery' },
            { value: 'excitement', label: '🤩 Excitement / Wow Factor' },
            { value: 'urgency', label: '⚡ Urgency / FOMO' },
            { value: 'trust', label: '✅ Trust / Authority' },
            { value: 'happiness', label: '😊 Happiness / Positivity' },
            { value: 'shock', label: '😱 Shock / Surprise' }
          ]
        };
        aiResponse = `Great topic! "${message}" 📹\n\nThumbnails that trigger emotions get more clicks. What feeling should viewers get when they see your thumbnail?`;
        break;

      case STEPS.EMOTION_GOAL:
        data.emotionGoal = message;
        nextStep = STEPS.CALL_TO_ACTION;
        showOptions = {
          type: 'call_to_action',
          question: 'Should your thumbnail include text?',
          options: [
            { value: 'bold_text', label: '💥 Bold Statement (e.g., "MUST WATCH")' },
            { value: 'question', label: '❓ Question (e.g., "Can You Do This?")' },
            { value: 'number', label: '🔢 Number/List (e.g., "Top 5 Secrets")' },
            { value: 'minimal', label: '✨ Minimal Text / Logo Only' },
            { value: 'no_text', label: '🚫 No Text (Pure Visual)' }
          ]
        };
        aiResponse = `Excellent choice! ${message} will really grab attention! 👀\n\nDo you want any text on your thumbnail? If yes, what style?`;
        break;

      case STEPS.CALL_TO_ACTION:
        data.callToAction = message;
        nextStep = STEPS.VISUAL_PREFERENCE;
        showOptions = {
          type: 'visual_preference',
          question: 'What visual style do you prefer?',
          options: [
            { value: 'high_contrast', label: '🎨 High Contrast & Vibrant' },
            { value: 'dark_moody', label: '🌙 Dark & Moody' },
            { value: 'bright_clean', label: '☀️ Bright & Clean' },
            { value: 'dramatic', label: '⚡ Dramatic with Effects' },
            { value: 'professional', label: '💼 Professional & Polished' },
            { value: 'playful', label: '🎉 Playful & Fun' }
          ]
        };
        aiResponse = `Nice! That will make your thumbnail stand out! 💯\n\nWhat visual style matches your brand?`;
        break;

      case STEPS.VISUAL_PREFERENCE:
        data.visualPreference = message;
        nextStep = STEPS.COMPLETE;

        // Generate the final AI-optimized prompt
        const finalPrompt = await generateOptimizedPrompt(model, data);
        data.generatedPrompt = finalPrompt;

        aiResponse = `🎉 Perfect! I've analyzed everything about your channel!\n\n**Channel:** ${data.channelName}\n**Audience:** ${data.targetAudience}\n**Content:** ${data.contentType}\n**Video:** ${data.videoTopic}\n\n✨ **Your AI-Generated Thumbnail Prompt:**\n\n"${finalPrompt}"\n\n🚀 Click "Use This Prompt" to auto-fill your thumbnail settings, or you can edit it manually in the Additional Details field!`;

        break;

      default:
        // General conversation - provide help
        const generalPrompt = `You are a YouTube thumbnail expert AI assistant for Thumbify. 
        Help users understand what makes thumbnails viral, provide design tips, and answer questions about thumbnails.
        
        User question: ${message}
        
        Keep responses concise, helpful, and enthusiastic. Use emojis sparingly.`;

        const result = await model.generateContent(generalPrompt);
        const response = await result.response;
        aiResponse = response.text();
    }

    // If we haven't generated AI response yet (for option-based steps), use the predefined one
    if (!aiResponse && currentStep !== null) {
      // This shouldn't happen with current logic, but kept as safeguard
      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponse = response.text();
    }

    res.json({
      response: aiResponse,
      success: true,
      nextStep: nextStep,
      thumbnailData: data,
      showOptions: showOptions,
      isComplete: nextStep === STEPS.COMPLETE,
      generatedPrompt: data.generatedPrompt || null
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      details: error.message
    });
  }
});

// Helper function to generate optimized thumbnail prompt
async function generateOptimizedPrompt(model, data) {
  const promptGenerationRequest = `You are a professional YouTube thumbnail designer. Based on these channel details, create a CONCISE 3-4 line thumbnail generation prompt that will create the most clickable, viral thumbnail.

Channel Details:
- Channel Name: ${data.channelName}
- Target Audience: ${data.targetAudience}
- Content Type: ${data.contentType}
- Video Topic: ${data.videoTopic}
- Emotion Goal: ${data.emotionGoal}
- Text Style: ${data.callToAction}
- Visual Style: ${data.visualPreference}

Generate a detailed but concise prompt (3-4 lines MAX) that includes:
- Visual composition and layout
- Color scheme and mood
- Text placement and style (if applicable)
- Key visual elements
- Emotion and energy level

Make it optimized for AI image generation. Be specific but concise.`;

  try {
    const result = await model.generateContent(promptGenerationRequest);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Prompt generation error:', error);
    // Fallback prompt
    return `Create a ${data.visualPreference} thumbnail for ${data.contentType} content about "${data.videoTopic}". Target audience: ${data.targetAudience}. Evoke ${data.emotionGoal}. Include ${data.callToAction} text style. High quality, professional, eye-catching design.`;
  }
}

export default router;