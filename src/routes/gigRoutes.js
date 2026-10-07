const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const gigController = require('../controllers/gigController');

const router = express.Router();

router.get('/', gigController.listGigs); // GET /api/gigs — public browse
router.get('/:id', gigController.getGig); // GET /api/gigs/:id — public view
router.post(
  '/',
  authenticate,
  requireRole('freelancer'),
  gigController.createGig
); // POST /api/gigs — freelancer only
router.put(
  '/:id',
  authenticate,
  requireRole('freelancer'),
  gigController.updateGig
); // PUT /api/gigs/:id — owner only

module.exports = router;
