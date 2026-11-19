const Review = require('../models/Review');
const Job = require('../models/Job');
const ArtisanProfile = require('../models/ArtisanProfile');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (customer only, after job completion)
const createReview = async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;
    const userId = req.user._id;

    // Check if job exists and belongs to the user
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customer_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this job' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed jobs' });
    }

    // Check if review already exists for this job
    const existingReview = await Review.findOne({ job_id: jobId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this job' });
    }

    // Create review
    const review = await Review.create({
      job_id: jobId,
      customer_id: userId,
      artisan_id: job.artisan_id,
      rating,
      comment,
    });

    // Update artisan profile rating
    const artisanProfile = await ArtisanProfile.findOne({ user_id: job.artisan_id });
    if (artisanProfile) {
      const reviews = await Review.find({ artisan_id: job.artisan_id });
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;

      artisanProfile.rating_avg = averageRating;
      artisanProfile.total_jobs_completed = reviews.length;
      await artisanProfile.save();
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for an artisan
// @route   GET /api/reviews/artisan/:artisanId
// @access  Public
const getArtisanReviews = async (req, res) => {
  try {
    const { artisanId } = req.params;

    const reviews = await Review.find({ artisan_id: artisanId })
      .populate('customer_id', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get review by job ID
// @route   GET /api/reviews/job/:jobId
// @access  Private
const getReviewByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const review = await Review.findOne({ job_id: jobId })
      .populate('customer_id', 'name')
      .populate('artisan_id', 'name');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getArtisanReviews,
  getReviewByJob,
};
