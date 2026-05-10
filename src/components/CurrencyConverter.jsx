import { useMemo } from 'react'
import useTilt from '../hooks/useTilt'

const RATE_HIGHLIGHTS = ['INR', 'USD', 'EUR', 'GBP']

export default function CurrencyConverter({
  total,
  displayCurrency = 'USD',
  formatCurrency,
  rates = {},
  rateDate,
  status,
  error,
  onRetry = () => {},
}) {
  const tiltRef = useTilt({ max: 5, lift: 8, shift: 6 })

  const highlightedRates = useMemo(() => {
    const selections = []
    RATE_HIGHLIGHTS.forEach((code) => {
      if (code === displayCurrency) return
      if (Number.isFinite(rates[code])) selections.push(code)
    })

    if (selections.length < 4) {
      const extras = Object.keys(rates)
        .filter((code) => code !== displayCurrency && !selections.includes(code))
        .sort((left, right) => left.localeCompare(right))
      selections.push(...extras.slice(0, 4 - selections.length))
    }

    return selections
  }, [displayCurrency, rates])

  const formatRate = (value) => (Number.isFinite(value) ? value.toFixed(3) : '--')
  const rateLabel = rateDate || 'Live'

  return (
    <section ref={tiltRef} className="panel interactive-surface">
      <div className="panel-header">
        <div>
          <h2>Currency view</h2>
          <p className="muted">Live rates via Frankfurter.</p>
        </div>
        <span className="pill">Live rates</span>
      </div>
      <div className="converter-grid">
        <div className="converter-card interactive-card">
          <span>Display total</span>
          <strong>{formatCurrency(total, displayCurrency)}</strong>
          <small>All values in {displayCurrency}</small>
        </div>
        <div className="converter-card interactive-card">
          <span>Rate snapshot</span>
          <div className="rate-grid">
            {highlightedRates.length === 0 ? (
              <span className="muted">Rates unavailable.</span>
            ) : (
              highlightedRates.map((code) => (
                <div key={code} className="rate-row">
                  <span>{code}</span>
                  <strong>{formatRate(rates[code])}</strong>
                </div>
              ))
            )}
          </div>
          <small className="rate-caption">
            1 {displayCurrency} equals
          </small>
          <small>
            {status === 'loading' && 'Fetching latest rates...'}
            {status === 'ready' && `Rate updated ${rateLabel}`}
            {status === 'error' && error}
          </small>
          {status === 'error' ? (
            <button className="btn btn-ghost" type="button" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
