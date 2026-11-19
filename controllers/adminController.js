const User = require('../models/User');
const ArtisanProfile = require('../models/ArtisanProfile');
const Job = require('../models/Job');
const Ticket = require('../models/Ticket');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (admin)
const getUserById = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get artisan profile if user is an artisan
    let artisanProfile = null;
    if (user.role === 'artisan') {
      artisanProfile = await ArtisanProfile.findOne({ user_id: user._id });
    }

    res.json({ user, artisanProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private (admin)
const toggleBlockUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.is_blocked = !user.is_blocked;
    await user.save();

    res.json({ message: `User ${user.is_blocked ? 'blocked' : 'unblocked'}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated artisan profile if exists
    if (user.role === 'artisan') {
      await ArtisanProfile.findOneAndDelete({ user_id: user._id });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all jobs
// @route   GET /api/admin/jobs
// @access  Private (admin)
const getAllJobs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const jobs = await Job.find()
      .populate('customer', 'name email')
      .populate('artisan', 'name email')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tickets
// @route   GET /api/admin/tickets
// @access  Private (admin)
const getAllTickets = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const tickets = await Ticket.find()
      .populate('user_id', 'name email')
      .populate('job_id', 'title')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin)
const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const totalUsers = await User.countDocuments();
    const totalArtisans = await User.countDocuments({ role: 'artisan' });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'in_progress' });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    const openTickets = await Ticket.countDocuments({ status: 'open' });

    res.json({
      totalUsers,
      totalArtisans,
      totalJobs,
      activeJobs,
      completedJobs,
      openTickets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  toggleBlockUser,
  deleteUser,
  getAllJobs,
  getAllTickets,
  getDashboardStats,
};
