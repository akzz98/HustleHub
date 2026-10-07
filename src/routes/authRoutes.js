const express = require('express');
const authController = require('../controllers/authController');
const { authRateLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Limit register/login together per IP to slow credential stuffing
router.use(authRateLimiter);

router.post('/register', authController.register); // POST /api/auth/register
router.post('/login', authController.login); // POST /api/auth/login

module.exports = router;
