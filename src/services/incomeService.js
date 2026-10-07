const transactionRepository = require('../repositories/transactionRepository');

async function getFreelancerIncome(freelancerId) {
  // Income is the sum of transaction amounts attributed to this freelancer.
  const summary = await transactionRepository.sumAmountByFreelancerId(freelancerId);

  return {
    freelancerId,
    totalIncome: summary.totalIncome,
    transactionCount: summary.transactionCount,
  };
}

module.exports = {
  getFreelancerIncome,
};
