const express = require('express');
const router = express.Router();
const {
  createTicket,
  getUserTickets,
  getTicketById,
  updateTicketStatus,
  addTicketResponse,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTicket);
router.get('/', protect, getUserTickets);
router.get('/:id', protect, getTicketById);
router.put('/:id/status', protect, updateTicketStatus);
router.put('/:id/response', protect, addTicketResponse);

module.exports = router;
