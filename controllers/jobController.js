const Job = require('../models/Job');
const User = require('../models/User');
const ArtisanProfile = require('../models/ArtisanProfile');
const Notification = require('../models/Notification');

// @desc    Create new job request
// @route   POST /api/jobs
// @access  Private (Customer)
const createJob = async (req, res) => {
  try {
    const { title, description, category_id, job_location, job_address, artisan_id, budget } = req.body;

    // Prevent artisans from posting jobs to themselves
    if (artisan_id && artisan_id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot post a job to yourself' });
    }

    const job = await Job.create({
      customer_id: req.user._id,
      artisan_id: artisan_id || null,
      category_id,
      title,
      description,
      job_location: {
        type: 'Point',
        coordinates: [job_location.lng, job_location.lat],
      },
      job_address,
      artisan_charge: budget,
    });

    // If artisan_id is provided, notify that specific artisan
    if (artisan_id) {
      await Notification.create({
        user_id: artisan_id,
        job_id: job._id,
        title: 'New Job Request',
        message: `A customer has posted a job "${title}" for you.`,
      });
    } else {
      // Notify nearby artisans (for future job board feature)
      const nearbyArtisans = await User.find({
        role: 'artisan',
        is_verified: true,
        is_active: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [job_location.lng, job_location.lat],
            },
            $maxDistance: 50000, // 50km radius
          },
        },
      });

      for (const artisan of nearbyArtisans) {
        await Notification.create({
          user_id: artisan._id,
          job_id: job._id,
          title: 'New Job Request',
          message: `A new job "${title}" is available in your area.`,
        });
      }
    }

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Private (Related user)
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customer_id', 'name email phone location')
      .populate('artisan_id', 'name email phone location')
      .populate('category_id', 'name description');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check authorization
    if (
      job.customer_id._id.toString() !== req.user._id.toString() &&
      job.artisan_id?._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Convert to plain object and add artisan_profile if job has an artisan
    const jobObj = job.toObject();
    if (jobObj.artisan_id) {
      const artisanProfile = await ArtisanProfile.findOne({ user_id: jobObj.artisan_id._id });
      jobObj.artisan_id.artisan_profile = artisanProfile;
    }

    res.json(jobObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List jobs (filtered)
// @route   GET /api/jobs
// @access  Private
const getJobs = async (req, res) => {
  try {
    const { status, customer_id, artisan_id } = req.query;

    const query = {};

    // Filter based on user role
    if (req.user.role === 'customer') {
      query.customer_id = req.user._id;
    } else if (req.user.role === 'artisan') {
      query.artisan_id = req.user._id;
    }

    // Additional filters
    if (status) query.status = status;
    if (customer_id && req.user.role === 'admin') query.customer_id = customer_id;
    if (artisan_id && req.user.role === 'admin') query.artisan_id = artisan_id;

    const jobs = await Job.find(query)
      .populate('customer_id', 'name email')
      .populate('artisan_id', 'name email')
      .populate('category_id', 'name')
      .sort({ requested_at: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept job
// @route   PUT /api/jobs/:id/accept
// @access  Private (Artisan)
const acceptJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({ message: 'Job is no longer available' });
    }

    job.artisan_id = req.user._id;
    job.status = 'accepted';
    job.artisan_accepted_at = Date.now();
    await job.save();

    // Notify customer
    await Notification.create({
      user_id: job.customer_id,
      job_id: job._id,
      title: 'Job Accepted',
      message: 'An artisan has accepted your job request.',
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Decline job
// @route   PUT /api/jobs/:id/decline
// @access  Private (Artisan)
const declineJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({ message: 'Job is no longer available' });
    }

    job.status = 'declined';
    await job.save();

    // Notify customer
    await Notification.create({
      user_id: job.customer_id,
      job_id: job._id,
      title: 'Job Declined',
      message: 'The artisan has declined your job request.',
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit quote
// @route   PUT /api/jobs/:id/quote
// @access  Private (Artisan)
const submitQuote = async (req, res) => {
  try {
    const { artisan_charge } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.artisan_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (job.status !== 'accepted') {
      return res.status(400).json({ message: 'Cannot quote this job' });
    }

    job.artisan_charge = artisan_charge;
    job.status = 'quoted';
    job.quoted_at = Date.now();
    await job.save();

    // Notify customer
    await Notification.create({
      user_id: job.customer_id,
      job_id: job._id,
      title: 'Quote Received',
      message: `Artisan has quoted GHS ${artisan_charge} for your job.`,
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm quote
// @route   PUT /api/jobs/:id/confirm
// @access  Private (Customer)
const confirmQuote = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (job.status !== 'quoted') {
      return res.status(400).json({ message: 'Cannot confirm this job' });
    }

    job.status = 'confirmed';
    job.customer_confirmed_at = Date.now();
    await job.save();

    // Notify artisan
    await Notification.create({
      user_id: job.artisan_id,
      job_id: job._id,
      title: 'Quote Confirmed',
      message: 'Customer has confirmed your quote. You can now start the job.',
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start job
// @route   PUT /api/jobs/:id/start
// @access  Private (Artisan)
const startJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    console.log('Job status:', job.status);
    console.log('Job artisan_id:', job.artisan_id);
    console.log('User ID:', req.user._id);

    if (job.artisan_id && job.artisan_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (job.status !== 'accepted' && job.status !== 'confirmed') {
      return res.status(400).json({ message: `Cannot start this job. Current status: ${job.status}` });
    }

    job.status = 'in_progress';
    job.started_at = Date.now();
    await job.save();

    // Notify customer
    await Notification.create({
      user_id: job.customer_id,
      job_id: job._id,
      title: 'Job Started',
      message: 'Your job has been started by the artisan.',
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete job
// @route   PUT /api/jobs/:id/complete
// @access  Private (Artisan)
const completeJob = async (req, res) => {
  try {
    const { duration_hours } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.artisan_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ message: 'Cannot complete this job' });
    }

    job.status = 'completed';
    job.completed_at = Date.now();
    job.duration_hours = duration_hours;
    await job.save();

    // Update artisan stats
    const artisanProfile = await ArtisanProfile.findOne({ user_id: req.user._id });
    if (artisanProfile) {
      artisanProfile.total_jobs_completed += 1;
      await artisanProfile.save();
    }

    // Notify customer
    await Notification.create({
      user_id: job.customer_id,
      job_id: job._id,
      title: 'Job Completed',
      message: 'Your job has been completed. Please rate the artisan.',
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createJob,
  getJobById,
  getJobs,
  acceptJob,
  declineJob,
  submitQuote,
  confirmQuote,
  startJob,
  completeJob,
};
