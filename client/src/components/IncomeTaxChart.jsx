function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function formatRate(rate) {
  return `${(Number(rate) * 100).toFixed(0)}%`;
}

/**
 * Summary + dependency-free bar chart for gross / estimated tax / net.
 */
function IncomeTaxChart({ income }) {
  const gross = Number(income.totalIncome) || 0;
  const tax = Number(income.estimatedTax) || 0;
  const net = Number(income.netAfterTax) || 0;
  const rate = Number(income.effectiveRate) || 0;
  const max = Math.max(gross, tax, net, 1);

  const bars = [
    { key: 'gross', label: 'Gross', value: gross },
    { key: 'tax', label: 'Estimated tax', value: tax },
    { key: 'net', label: 'Net', value: net },
  ];

  return (
    <div className="income-tax-summary">
      <dl className="income-tax-stats">
        <div>
          <dt>Gross income</dt>
          <dd className="income-total">{formatPrice(gross)}</dd>
        </div>
        <div>
          <dt>Estimated tax</dt>
          <dd>{formatPrice(tax)}</dd>
        </div>
        <div>
          <dt>Net after tax</dt>
          <dd>{formatPrice(net)}</dd>
        </div>
        <div>
          <dt>Effective rate</dt>
          <dd>{formatRate(rate)}</dd>
        </div>
      </dl>

      <p className="hint income-tax-note">
        Approximate tax on HustleHub income only. This is not a tax return.
      </p>

      <div
        className="income-tax-chart"
        role="img"
        aria-label={`Gross ${formatPrice(gross)}, estimated tax ${formatPrice(tax)}, net ${formatPrice(net)}`}
      >
        {bars.map((bar) => (
          <div key={bar.key} className="income-tax-bar-row">
            <span className="income-tax-bar-label">{bar.label}</span>
            <div className="income-tax-bar-track" aria-hidden="true">
              <div
                className={`income-tax-bar-fill income-tax-bar-fill--${bar.key}`}
                style={{ width: `${(bar.value / max) * 100}%` }}
              />
            </div>
            <span className="income-tax-bar-value">{formatPrice(bar.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IncomeTaxChart;
export { formatPrice, formatRate };
