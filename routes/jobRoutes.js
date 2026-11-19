const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobById,
  getJobs,
  acceptJob,
  declineJob,
  submitQuote,
  confirmQuote,
  startJob,
  completeJob,
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createJob);
router.get('/', protect, getJobs);
router.get('/:id', protect, getJobById);
router.put('/:id/accept', protect, acceptJob);
router.put('/:id/decline', protect, declineJob);
router.put('/:id/quote', protect, submitQuote);
router.put('/:id/confirm', protect, confirmQuote);
router.put('/:id/start', protect, startJob);
router.put('/:id/complete', protect, completeJob);

module.exports = router;
