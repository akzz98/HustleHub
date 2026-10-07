const express = require('express');
const gigController = require('../controllers/gigController');

const router = express.Router();

router.get('/', gigController.listGigs); // GET /api/gigs — public browse

module.exports = router;
