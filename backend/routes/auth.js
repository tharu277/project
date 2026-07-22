const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper function to generate JWT token
const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
  });

// Helper function to format and send JSON response with JWT token
const sendToken = (user, code, res) => res.status(code).json({
  success: true,
  token: generateToken(user._id, user.role),
  user: { 
    id: user._id, 
    name: user.name, 
    email: user.email, 
    role: user.role 
  },
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate mandatory input fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email and password are required.' 
      });
    }

    // Check if the email address is already registered
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email already exists.' 
      });
    }

    // Create a new user record (Password hashing is handled in User Schema pre-save hook)
    const user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password, 
      role: role || 'passenger' 
    });

    // Send successful registration response with token
    sendToken(user, 201, res);

  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message)[0];
      return res.status(400).json({ success: false, message: msg });
    }
    console.error('[Register Error]:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate mandatory login credentials
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }

    // Find user by normalized email (include password field explicitly)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password. Please try again.' 
      });
    }

    // Check if account is temporarily locked due to multiple failed login attempts
    if (typeof user.isLocked === 'function' && user.isLocked()) {
      return res.status(423).json({ 
        success: false, 
        message: 'Account locked due to too many failed attempts. Try again in 30 minutes.' 
      });
    }

    // Check if account status is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated. Contact administrator.' 
      });
    }

    // Compare provided plain password with stored hashed password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Increment login attempt counter if user schema contains the helper method
      if (typeof user.incLoginAttempts === 'function') {
        await user.incLoginAttempts();
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password. Please try again.' 
      });
    }

    // Reset login attempts counter and update last login timestamp upon successful login
    await user.updateOne({ 
      $set: { loginAttempts: 0, lastLogin: new Date() }, 
      $unset: { lockUntil: 1 } 
    });

    // Return authorization token and user info
    sendToken(user, 200, res);

  } catch (err) {
    console.error('[Login Error]:', err.message);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in user profile
 * @access  Private
 */
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;