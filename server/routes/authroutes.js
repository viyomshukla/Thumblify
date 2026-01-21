import express from 'express';
import passport from 'passport';
import User from  '../model/user.js'

const router = express.Router();

// ✅ Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`
  }),
  (req, res) => {
    // Successful authentication
    console.log('✅ Google OAuth successful for:', req.user.email);
    // Set session for consistency
    req.session.userId = req.user._id;
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  }
);

// Regular Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user signed up with Google
    if (user.googleId && !user.password) {
      return res.status(401).json({ 
        message: 'This account uses Google Sign-In. Please use "Continue with Google"' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Store user in session
    req.session.userId = user._id;

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.googleId 
          ? 'This email is registered with Google. Please use "Continue with Google"'
          : 'User already exists' 
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      credits: 30, // Free credits on signup
      plan: 'free'
    });

    // Store user in session
    req.session.userId = user._id;

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify (Check if user is logged in)
router.get('/verify', async (req, res) => {
  try {
    if (!req.session.userId && !req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = req.session.userId || req.user._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

export default router;