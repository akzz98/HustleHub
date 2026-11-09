const transactionRepository = require('../repositories/transactionRepository');
const { estimateTax } = require('../utils/taxEstimate');

async function getFreelancerIncome(freelancerId) {
  // Income is the sum of transaction amounts attributed to this freelancer.
  const summary = await transactionRepository.sumAmountByFreelancerId(freelancerId);
  const tax = estimateTax(summary.totalIncome);

  return {
    freelancerId,
    totalIncome: summary.totalIncome,
    transactionCount: summary.transactionCount,
    estimatedTax: tax.estimatedTax,
    netAfterTax: tax.netAfterTax,
    effectiveRate: tax.effectiveRate,
  };
}

module.exports = {
  getFreelancerIncome,
};
