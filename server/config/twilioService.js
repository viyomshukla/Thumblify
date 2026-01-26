import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(to, message) {
  try {
    // Twilio requires 'whatsapp:' prefix
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const result = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: formattedTo,
      body: message
    });

    console.log('✅ WhatsApp message sent:', result.sid);
    return result;

  } catch (error) {
    console.error('❌ Twilio send error:', error.message);
    throw error;
  }
}

/**
 * Send welcome message
 */
export async function sendWelcomeMessage(to) {
  const message = `🎨 *Welcome to Thumblify!*

I'm your AI assistant for creating stunning YouTube thumbnails!

*Choose an option:*
1️⃣ Create New Thumbnail
2️⃣ Improve YouTube Thumbnail

Reply with *1* or *2* to get started! 🚀`;

  return await sendWhatsAppMessage(to, message);
}

/**
 * Send image via WhatsApp
 */
export async function sendWhatsAppImage(to, imageUrl, caption = '') {
  try {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const result = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: formattedTo,
      body: caption,
      mediaUrl: [imageUrl]
    });

    console.log('✅ WhatsApp image sent:', result.sid);
    return result;

  } catch (error) {
    console.error('❌ Twilio image send error:', error.message);
    throw error;
  }
}