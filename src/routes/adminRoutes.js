const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const adminController = require('../controllers/adminController');

const router = express.Router();

// All admin oversight routes: JWT + admin role. GET only — no create/update/delete.
router.use(authenticate, requireRole('admin'));

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);

router.get('/gigs', adminController.listGigs);
router.get('/gigs/:id', adminController.getGig);

router.get('/bookings', adminController.listBookings);
router.get('/bookings/:id', adminController.getBooking);

router.get('/transactions', adminController.listTransactions);
router.get('/transactions/:id', adminController.getTransaction);

module.exports = router;
