
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN||'7d' });

const sendToken = (user, code, res) => res.status(code).json({
  success: true,
  token:   generateToken(user._id, user.role),
  user:    { id:user._id, name:user.name, email:user.email, role:user.role },
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name||!email||!password)
      return res.status(400).json({ success:false, message:'Name, email and password are required.' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(400).json({ success:false, message:'An account with this email already exists.' });

    const user = await User.create({ name:name.trim(), email:email.toLowerCase().trim(), password, role:role||'passenger' });
    sendToken(user, 201, res);
  } catch(err) {
    if (err.name==='ValidationError') {
      const msg = Object.values(err.errors).map(e=>e.message)[0];
      return res.status(400).json({ success:false, message:msg });
    }
    console.error('[Register]', err.message);
    res.status(500).json({ success:false, message:'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password)
      return res.status(400).json({ success:false, message:'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user)
      return res.status(401).json({ success:false, message:'Invalid email or password. Please try again.' });

    if (user.isLocked())
      return res.status(423).json({ success:false, message:'Account locked due to too many failed attempts. Try again in 30 minutes.' });

    if (!user.isActive)
      return res.status(403).json({ success:false, message:'Account is deactivated. Contact administrator.' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ success:false, message:'Invalid email or password. Please try again.' });
    }

    await user.updateOne({ $set:{ loginAttempts:0, lastLogin:new Date() }, $unset:{ lockUntil:1 } });
    sendToken(user, 200, res);
  } catch(err) {
    console.error('[Login]', err.message);
    res.status(500).json({ success:false, message:'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ success:true, user:req.user }));

module.exports = router;
