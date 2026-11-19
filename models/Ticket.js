const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  raised_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  related_job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null,
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
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  admin_response: {
    type: String,
    default: null,
  },
  resolved_at: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
ticketSchema.index({ raised_by: 1 });
ticketSchema.index({ related_job_id: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
