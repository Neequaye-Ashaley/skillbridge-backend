const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function () {
      return !this.googleId; // Email is required unless signing up with Google
    },
    unique: true,
    lowercase: true,
    trim: true,
    sparse: true, // Allows multiple null values for unique field
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password_hash: {
    type: String,
    required: function () {
      return !this.googleId; // Password is required unless signing up with Google
    },
  },
  profile_picture: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    required: function () {
      return !this.googleId; // Phone is required unless signing up with Google
    },
  },
  role: {
    type: String,
    enum: ['customer', 'artisan', 'admin'],
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: function () {
        return !this.googleId; // Location is required unless signing up with Google
      },
    },
    coordinates: {
      type: [Number],
      required: function () {
        return !this.googleId; // Coordinates are required unless signing up with Google
      },
    },
  },
  location_address: {
    type: String,
    default: '',
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  blocked: {
    is_blocked: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      default: '',
    },
    blocked_at: {
      type: Date,
      default: null,
    },
  },
}, {
  timestamps: true,
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to generate auth token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = mongoose.model('User', userSchema);
