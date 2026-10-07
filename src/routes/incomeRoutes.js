const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const incomeController = require('../controllers/incomeController');

const router = express.Router();

router.get(
  '/me',
  authenticate,
  requireRole('freelancer'),
  incomeController.getMyIncome
); // GET /api/income/me — freelancer only

module.exports = router;
