const express = require('express');
const router = express.Router();
const {
  createReview,
  getArtisanReviews,
  getReviewByJob,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/artisan/:artisanId', getArtisanReviews);
router.get('/job/:jobId', protect, getReviewByJob);

module.exports = router;
