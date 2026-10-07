const incomeService = require('../services/incomeService');

async function getMyIncome(req, res, next) {
  try {
    // Freelancer id always comes from the verified JWT — never from query/body.
    const income = await incomeService.getFreelancerIncome(req.userId);
    res.status(200).json(income);
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  getMyIncome,
};
