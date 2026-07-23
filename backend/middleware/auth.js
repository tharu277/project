const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

    const token = authHeader.split(' ')[1];
    let decoded;
    
    // 🔑 JWT Secret එක මෙතැනට සම්බන්ධ කර ඇත
    const JWT_SECRET = process.env.JWT_SECRET || 'smartbus_default_jwt_secret_key_2026';

    try { 
      decoded = jwt.verify(token, JWT_SECRET); 
    } catch(err) {
      if (err.name === 'TokenExpiredError')
        return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
      return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated.' });

    req.user = user;
    next();
  } catch(err) {
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: `Access denied. Requires ${roles.join(' or ')} role.` });
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET || 'smartbus_default_jwt_secret_key_2026';
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) req.user = user;
    }
  } catch {}
  next();
};

module.exports = { protect, restrictTo, optionalAuth };