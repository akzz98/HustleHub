// Approximate tax on HustleHub freelance income only.
// Not a tax return. Currency matches stored amounts (USD).
//
// Progressive bands (applied to totalIncome):
//   0 .. 10000              → 0%
//   above 10000 .. 50000    → 18% on the amount above 10000
//   above 50000             → 7200 + 26% on the amount above 50000
//
// Worked examples:
//   160    → 0
//   20000  → 1800
//   60000  → 9800

const BAND_1_CEILING = 10000;
const BAND_2_CEILING = 50000;
const BAND_2_RATE = 0.18;
const BAND_3_RATE = 0.26;
// Tax owed at the top of band 2: 18% of (50000 - 10000) = 7200
const TAX_AT_BAND_2_CEILING = (BAND_2_CEILING - BAND_1_CEILING) * BAND_2_RATE;

function roundToCents(value) {
  return Math.round(value * 100) / 100;
}

function normaliseIncome(totalIncome) {
  const amount = Number(totalIncome);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  return roundToCents(amount);
}

/**
 * Estimate tax for a freelancer's HustleHub income total.
 * @param {number} totalIncome
 * @returns {{ estimatedTax: number, netAfterTax: number, effectiveRate: number }}
 */
function estimateTax(totalIncome) {
  const income = normaliseIncome(totalIncome);
  let estimatedTax = 0;

  if (income > BAND_2_CEILING) {
    estimatedTax =
      TAX_AT_BAND_2_CEILING + (income - BAND_2_CEILING) * BAND_3_RATE;
  } else if (income > BAND_1_CEILING) {
    estimatedTax = (income - BAND_1_CEILING) * BAND_2_RATE;
  }

  estimatedTax = roundToCents(estimatedTax);
  const netAfterTax = roundToCents(income - estimatedTax);
  const effectiveRate = income === 0 ? 0 : roundToCents(estimatedTax / income);

  return {
    estimatedTax,
    netAfterTax,
    effectiveRate,
  };
}

module.exports = {
  estimateTax,
  BAND_1_CEILING,
  BAND_2_CEILING,
  BAND_2_RATE,
  BAND_3_RATE,
  TAX_AT_BAND_2_CEILING,
};
