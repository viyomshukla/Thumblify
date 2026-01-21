import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from "../model/user.js";  // Capital U if file is User.js
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
router.post('/create-order', async (req, res) => {
  const { amount, planName, credits } = req.body;

  console.log('📦 Creating order:', { amount, planName, credits });

  try {
    const options = {
      amount: amount * 100, // Convert rupees to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        planName,
        credits,
      },
    };

    const order = await razorpay.orders.create(options);
    console.log('✅ Order created:', order.id);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message,
    });
  }
});

// Verify Payment and Add Credits
router.post('/verify-payment', async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    credits,
    planName,
  } = req.body;

  console.log('🔍 Verifying payment:', {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });

  try {
    // Step 1: Verify the signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      console.log('❌ Invalid signature');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature',
      });
    }

    console.log('✅ Signature verified');

    // Step 2: Get user from session (or you can send userId from frontend)
    const userId = req.session?.userId; // Adjust based on your auth setup

    if (!userId) {
      console.log('⚠️ No user session found');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Step 3: Add credits to user account
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: parseInt(credits) }, // Add credits
        plan: planName.toLowerCase(), // Update plan if needed
      },
      { new: true } // Return updated user
    );

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log(`✅ Added ${credits} credits to user ${user.email}`);
    console.log(`💳 User now has ${user.credits} total credits`);

    res.json({
      success: true,
      message: 'Payment verified and credits added successfully',
      credits: user.credits,
      newCredits: parseInt(credits),
    });
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      message: error.message,
    });
  }
});

// Get Payment Status (optional - to check payment details)
router.get('/payment-status/:paymentId', async (req, res) => {
  try {
    const payment = await razorpay.payments.fetch(req.params.paymentId);
    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;