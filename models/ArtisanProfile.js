const mongoose = require('mongoose');

const artisanProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  rating_avg: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  total_jobs_completed: {
    type: Number,
    default: 0,
    min: 0,
  },
  qualifications: {
    type: [String],
    default: [],
  },
  bio: {
    type: String,
    default: '',
  },
  categories: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Category',
    default: [],
  },
  past_works: {
    type: [String],
    default: [],
  },
  years_of_experience: {
    type: Number,
    default: 0,
    min: 0,
  },
  base_price_range: {
    min: {
      type: Number,
      default: 0,
      min: 0,
    },
    max: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  is_available: {
    type: Boolean,
    default: true,
  },
  profile_image: {
    type: String,
    default: null,
  },
  background_image: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
artisanProfileSchema.index({ user_id: 1 }, { unique: true });
artisanProfileSchema.index({ rating_avg: -1 });
artisanProfileSchema.index({ categories: 1 });

module.exports = mongoose.model('ArtisanProfile', artisanProfileSchema);
