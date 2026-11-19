const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  toggleBlockUser,
  deleteUser,
  getAllJobs,
  getAllTickets,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.get('/users', protect, getAllUsers);
router.get('/users/:id', protect, getUserById);
router.put('/users/:id/block', protect, toggleBlockUser);
router.delete('/users/:id', protect, deleteUser);
router.get('/jobs', protect, getAllJobs);
router.get('/tickets', protect, getAllTickets);
router.get('/stats', protect, getDashboardStats);

module.exports = router;
