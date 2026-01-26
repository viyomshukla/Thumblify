import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import protectRoute from '../middleware/auth2.js';
import User from '../model/user.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat endpoint - Only for logged-in users
router.post('/message', async (req, res) => {
  try {
    const { message, conversationHistory, currentStep, thumbnailData } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ✅ Check if user is authenticated
    const { userId } = req.session;
    
    if (!userId) {
      return res.status(401).json({ message: "Please Login In" });
    }

    // ✅ CHECK USER EXISTS
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Define the conversation flow steps
    const steps = {
      INITIAL: 'initial',
      TITLE: 'title',
      DESCRIPTION: 'description',
      ASPECT_RATIO: 'aspectRatio',
      COLOR_SCHEME: 'colorScheme',
      STYLE: 'style',
      COMPLETE: 'complete'
    };

    // Initialize thumbnail data
    const data = thumbnailData || {};
    let nextStep = currentStep || steps.INITIAL;
    let prompt = '';
    let showOptions = null;

    // Handle different conversation steps
    switch (currentStep) {
      case steps.INITIAL:
        // User sends title
        data.title = message;
        nextStep = steps.DESCRIPTION;
        prompt = `User wants to create a thumbnail with title: "${message}". 
        Acknowledge their title and ask them to provide a description for their thumbnail. 
        Keep response brief and friendly.`;
        break;

      case steps.DESCRIPTION:
        // User sends description
        data.description = message;
        nextStep = steps.ASPECT_RATIO;
        showOptions = {
          type: 'aspectRatio',
          options: [
            { value: '16:9', label: '16:9 (YouTube Standard)' },
            { value: '1:1', label: '1:1 (Square)' },
            { value: '9:16', label: '9:16 (Vertical/Stories)' }
          ]
        };
        prompt = `User provided description: "${message}". 
        Acknowledge their description briefly and ask them to choose an aspect ratio. 
        Keep response concise.`;
        break;

      case steps.ASPECT_RATIO:
        // User selects aspect ratio
        const validAspectRatios = ['16:9', '1:1', '9:16'];
        if (!validAspectRatios.includes(message)) {
          return res.status(400).json({ 
            error: 'Invalid aspect ratio. Please choose from 16:9, 1:1, or 9:16' 
          });
        }
        data.aspectRatio = message;
        nextStep = steps.COLOR_SCHEME;
        showOptions = {
          type: 'colorScheme',
          options: [
            { value: 'vibrant', label: 'Vibrant' },
            { value: 'sunset', label: 'Sunset' },
            { value: 'forest', label: 'Forest' },
            { value: 'neon', label: 'Neon' },
            { value: 'purple', label: 'Purple' },
            { value: 'monochrome', label: 'Monochrome' },
            { value: 'ocean', label: 'Ocean' },
            { value: 'pastel', label: 'Pastel' }
          ]
        };
        prompt = `User selected ${message} aspect ratio. 
        Acknowledge their choice and ask them to choose a color scheme. 
        Keep response brief.`;
        break;

      case steps.COLOR_SCHEME:
        // User selects color scheme
        const validColorSchemes = ['vibrant', 'sunset', 'forest', 'neon', 'purple', 'monochrome', 'ocean', 'pastel'];
        if (!validColorSchemes.includes(message.toLowerCase())) {
          return res.status(400).json({ 
            error: 'Invalid color scheme. Please choose from the available options.' 
          });
        }
        data.colorScheme = message.toLowerCase();
        nextStep = steps.STYLE;
        showOptions = {
          type: 'style',
          options: [
            { value: 'Bold & Graphic', label: 'Bold & Graphic' },
            { value: 'Tech/Futuristic', label: 'Tech/Futuristic' },
            { value: 'Minimalist', label: 'Minimalist' },
            { value: 'Photorealistic', label: 'Photorealistic' },
            { value: 'Illustrated', label: 'Illustrated' }
          ]
        };
        prompt = `User selected ${message} color scheme. 
        Acknowledge their choice and ask them to choose a style for their thumbnail. 
        Keep response brief.`;
        break;

      case steps.STYLE:
        // User selects style
        const validStyles = ['Bold & Graphic', 'Tech/Futuristic', 'Minimalist', 'Photorealistic', 'Illustrated'];
        if (!validStyles.includes(message)) {
          return res.status(400).json({ 
            error: 'Invalid style. Please choose from the available options.' 
          });
        }
        data.style = message;
        nextStep = steps.COMPLETE;
        prompt = `User has completed their thumbnail configuration:
        - Title: ${data.title}
        - Description: ${data.description}
        - Aspect Ratio: ${data.aspectRatio}
        - Color Scheme: ${data.colorScheme}
        - Style: ${message}
        
        Generate an enthusiastic response confirming all their choices and let them know their thumbnail is ready to be generated. 
        Keep response friendly and encouraging.`;
        break;

      default:
        // General conversation
        prompt = `You are a helpful AI assistant for Thumbify, a thumbnail generation platform. Help users with:
- Creating effective YouTube thumbnails
- Design tips and best practices
- Using the Thumbify platform
- General questions about thumbnails

User question: ${message}`;
        
        if (conversationHistory && conversationHistory.length > 0) {
          const context = conversationHistory
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');
          prompt = `${context}\nUser: ${message}`;
        }
    }

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      response: text,
      success: true,
      nextStep: nextStep,
      thumbnailData: data,
      showOptions: showOptions,
      isComplete: nextStep === steps.COMPLETE
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

export default router;