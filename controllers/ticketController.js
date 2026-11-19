const Ticket = require('../models/Ticket');
const Job = require('../models/Job');

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { title, description, jobId, priority } = req.body;
    const userId = req.user._id;

    // If jobId is provided, verify it belongs to the user
    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job || (job.customer.toString() !== userId.toString() && job.artisan.toString() !== userId.toString())) {
        return res.status(403).json({ message: 'Not authorized to create ticket for this job' });
      }
    }

    const ticket = await Ticket.create({
      user_id: userId,
      job_id: jobId,
      title,
      description,
      priority: priority || 'medium',
      status: 'open',
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tickets for a user
// @route   GET /api/tickets
// @access  Private
const getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id;

    const tickets = await Ticket.find({ user_id: userId })
      .populate('job_id', 'title status')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const ticket = await Ticket.findById(id).populate('job_id', 'title status');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user owns the ticket or is admin
    if (ticket.user_id.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket status (admin only)
// @route   PUT /api/tickets/:id/status
// @access  Private (admin)
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    if (status === 'resolved') {
      ticket.resolved_at = Date.now();
    }

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add admin response to ticket (admin only)
// @route   PUT /api/tickets/:id/response
// @access  Private (admin)
const addTicketResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.admin_response = response;
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getUserTickets,
  getTicketById,
  updateTicketStatus,
  addTicketResponse,
};
