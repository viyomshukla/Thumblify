import express from 'express';
import protectRoute from '../middleware/auth2.js';
import WhatsAppUser from '../model/whatsappUser.js';
import { sendWelcomeMessage, sendWhatsAppMessage } from '../config/twilioService.js';
import { handleConversation } from '../config/whatsappConversationHandler.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Connect WhatsApp
router.post('/connect', protectRoute, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const { userId } = req.session;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Format for Twilio (must include country code)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // Check if exists
    let whatsappUser = await WhatsAppUser.findOne({ phoneNumber: formattedPhone });
    
    if (whatsappUser) {
      whatsappUser.user = userId;
      whatsappUser.isActive = true;
      whatsappUser.conversationState = 'main_menu';
      await whatsappUser.save();
    } else {
      whatsappUser = new WhatsAppUser({
        user: userId,
        phoneNumber: formattedPhone,
        isActive: true,
        conversationState: 'main_menu'
      });
      await whatsappUser.save();
    }

    console.log('📱 Sending welcome message to:', formattedPhone);

    // Send welcome message via Twilio
    await sendWelcomeMessage(formattedPhone);

    res.json({
      success: true,
      message: 'WhatsApp connected! Check your WhatsApp for a message.',
      phoneNumber: formattedPhone
    });

  } catch (error) {
    console.error('WhatsApp connect error:', error);
    res.status(500).json({
      error: 'Failed to connect WhatsApp',
      details: error.message
    });
  }
});

// Twilio Webhook - receives messages
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔥 Twilio webhook received');

    // Safety check
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('❌ Empty request body!');
      res.set('Content-Type', 'text/xml');
      return res.send('<Response></Response>');
    }

    const From = req.body.From || '';
    const Body = req.body.Body || '';

    if (!From) {
      console.error('❌ Missing "From" field');
      res.set('Content-Type', 'text/xml');
      return res.send('<Response></Response>');
    }

    const phoneNumber = From.replace('whatsapp:', '');
    const messageBody = Body;

    console.log('👤 From:', phoneNumber);
    console.log('💬 Message:', messageBody);

    // Find user
    const whatsappUser = await WhatsAppUser.findOne({ 
      phoneNumber,
      isActive: true 
    });

    if (!whatsappUser) {
      await sendWhatsAppMessage(From, 
        "👋 Hi! Please connect your WhatsApp on the Thumblify website first.\n\nVisit: https://thumblify.com"
      );
      res.set('Content-Type', 'text/xml');
      return res.send('<Response></Response>');
    }

    // Update last message time
    whatsappUser.lastMessageAt = new Date();
    await whatsappUser.save();

    // ✅ HANDLE CONVERSATION
    await handleConversation(whatsappUser, messageBody, From);

    // Twilio expects TwiML response
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }
});

// Handle Twilio's validation GET request
router.get('/webhook', (req, res) => {
  console.log('✅ Twilio validation GET request');
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
});

// Disconnect
router.post('/disconnect', protectRoute, async (req, res) => {
  try {
    const { userId } = req.session;
    await WhatsAppUser.findOneAndUpdate(
      { user: userId }, 
      { isActive: false, conversationState: 'idle' }
    );
    res.json({ success: true, message: 'Disconnected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Get status
router.get('/status', protectRoute, async (req, res) => {
  try {
    const { userId } = req.session;
    const whatsappUser = await WhatsAppUser.findOne({ user: userId, isActive: true });
    res.json({
      connected: !!whatsappUser,
      phoneNumber: whatsappUser?.phoneNumber || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;