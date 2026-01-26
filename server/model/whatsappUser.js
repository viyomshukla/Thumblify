import mongoose from 'mongoose';

const whatsappUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  conversationState: {
    type: String,
    enum: [
      'idle', 
      'main_menu', 
      'waiting_for_title', 
      'waiting_for_credit_choice',
      'waiting_for_prompt', 
      'waiting_for_url',
      'waiting_for_youtube_credit_choice', // ✅ ADD THIS TOO
      'generating', 
      'showing_result', 
      'waiting_for_retry'
    ],
    default: 'main_menu'
  },
  currentThumbnailData: {
    title: String,
    prompt: String,
    youtubeUrl: String,
    qualityTier: String,        // ✅ ADD THIS - 'basic' or 'premium'
    creditsToDeduct: Number,    // ✅ ADD THIS - 5 or 10
    aspectRatio: { type: String, default: '16:9' },
    style: { type: String, default: 'Bold & Graphic' },
    model: { type: String, default: 'standard' },
    lastGeneratedImageUrl: String
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('WhatsAppUser', whatsappUserSchema);