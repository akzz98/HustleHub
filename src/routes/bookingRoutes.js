const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  authenticate,
  requireRole('client', 'freelancer'),
  bookingController.listMyBookings
); // GET /api/bookings — own bookings only

router.post(
  '/',
  authenticate,
  requireRole('client'),
  bookingController.createBooking
); // POST /api/bookings — client only

module.exports = router;
