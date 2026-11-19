const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  artisan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  job_location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  job_address: {
    type: String,
    default: '',
  },
  artisan_charge: {
    type: Number,
    default: null,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'quoted', 'confirmed', 'in_progress', 'completed', 'rated', 'cancelled', 'disputed'],
    default: 'pending',
  },
  requested_at: {
    type: Date,
    default: Date.now,
  },
  artisan_accepted_at: {
    type: Date,
    default: null,
  },
  quoted_at: {
    type: Date,
    default: null,
  },
  customer_confirmed_at: {
    type: Date,
    default: null,
  },
  started_at: {
    type: Date,
    default: null,
  },
  completed_at: {
    type: Date,
    default: null,
  },
  duration_hours: {
    type: Number,
    default: null,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes
jobSchema.index({ customer_id: 1 });
jobSchema.index({ artisan_id: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ category_id: 1 });
jobSchema.index({ job_location: '2dsphere' });
jobSchema.index({ requested_at: -1 });

module.exports = mongoose.model('Job', jobSchema);
