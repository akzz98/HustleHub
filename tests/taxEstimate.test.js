const {
  estimateTax,
  BAND_1_CEILING,
  BAND_2_CEILING,
  TAX_AT_BAND_2_CEILING,
} = require('../src/utils/taxEstimate');

describe('estimateTax', () => {
  test('worked example: income 160 → tax 0', () => {
    expect(estimateTax(160)).toEqual({
      estimatedTax: 0,
      netAfterTax: 160,
      effectiveRate: 0,
    });
  });

  // Temporary deliberate failure to prove CI goes red — remove after the failed run.
  test('deliberate CI failure probe', () => {
    expect(true).toBe(false);
  });

  test('worked example: income 20000 → tax 1800', () => {
    expect(estimateTax(20000)).toEqual({
      estimatedTax: 1800,
      netAfterTax: 18200,
      effectiveRate: 0.09,
    });
  });

  test('worked example: income 60000 → tax 9800', () => {
    expect(estimateTax(60000)).toEqual({
      estimatedTax: 9800,
      netAfterTax: 50200,
      effectiveRate: 0.16,
    }); // (rounded) 9800 / 60000 = 0.1633… → 0.16
  });

  test('zero and empty income stay at tax 0', () => {
    expect(estimateTax(0)).toEqual({
      estimatedTax: 0,
      netAfterTax: 0,
      effectiveRate: 0,
    });
    expect(estimateTax(null)).toEqual({
      estimatedTax: 0,
      netAfterTax: 0,
      effectiveRate: 0,
    });
  });

  test('band boundary: exactly 10000 stays at 0%', () => {
    expect(estimateTax(BAND_1_CEILING).estimatedTax).toBe(0);
  });

  test('band boundary: exactly 50000 equals 18% of the middle band', () => {
    expect(estimateTax(BAND_2_CEILING).estimatedTax).toBe(TAX_AT_BAND_2_CEILING);
  });

  test('rounds fractional cents', () => {
    // 18% of 0.01 = 0.0018 → rounds to 0.00 tax
    expect(estimateTax(10000.01).estimatedTax).toBe(0);
    // 18% of 0.06 = 0.0108 → rounds to 0.01
    expect(estimateTax(10000.06).estimatedTax).toBe(0.01);
  });
});
