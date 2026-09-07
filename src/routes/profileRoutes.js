const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const profileController = require('../controllers/profileController');

const router = express.Router();

router.get('/', authenticate, profileController.getProfile); // GET /api/profile

module.exports = router;
