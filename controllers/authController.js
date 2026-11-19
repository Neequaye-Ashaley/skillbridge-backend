const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const ArtisanProfile = require('../models/ArtisanProfile');
const Notification = require('../models/Notification');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, name, password, phone, role, location, location_address, categories } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      email,
      name,
      password_hash: password,
      phone,
      role,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      location_address,
    });

    // If artisan, create profile
    if (role === 'artisan') {
      console.log('Creating artisan profile for user:', user._id);
      await ArtisanProfile.create({
        user_id: user._id,
        rating_avg: 0,
        total_jobs_completed: 0,
        categories: categories || [],
      });

      // Create notification to complete profile setup
      try {
        await Notification.create({
          user_id: user._id,
          title: 'Complete Your Profile',
          message: 'Please finish setting up your profile to start receiving job requests and attract more customers.',
          link: '/artisan-profile',
        });
        console.log('Notification created for artisan:', user._id);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    } else {
      console.log('User role is not artisan, skipping notification. Role:', role);
    }

    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (await user.comparePassword(password)) {
      if (!user.is_active) {
        return res.status(401).json({ message: 'Account is inactive' });
      }

      if (user.blocked.is_blocked) {
        return res.status(403).json({ message: 'Account is blocked' });
      }

      // If artisan, fetch artisan profile
      let artisanProfile = null;
      if (user.role === 'artisan') {
        artisanProfile = await ArtisanProfile.findOne({ user_id: user._id });
      }

      res.json({
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        artisan_profile: artisanProfile,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe };
