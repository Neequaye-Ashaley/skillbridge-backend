const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password_hash');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!req.user.is_active) {
      return res.status(401).json({ message: 'Account is inactive' });
    }
    
    if (req.user.blocked.is_blocked) {
      return res.status(403).json({ message: 'Account is blocked' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
