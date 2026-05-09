import { useEffect, useMemo, useState } from 'react'
import useTilt from '../hooks/useTilt'

const FRANKFURTER_API = 'https://api.frankfurter.dev/v2'
const PRIORITY_CURRENCIES = ['EUR', 'GBP', 'INR', 'USD']

export default function CurrencyConverter({ amount, baseCurrency }) {
  const tiltRef = useTilt({ max: 5, lift: 8, shift: 6 })
  const [targetCurrency, setTargetCurrency] = useState('EUR')
  const [rates, setRates] = useState({})
  const [currencies, setCurrencies] = useState([])
  const [rateDate, setRateDate] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const fetchRates = async () => {
      try {
        setStatus('loading')
        setError('')
        const [ratesResponse, currenciesResponse] = await Promise.all([
          fetch(`${FRANKFURTER_API}/rates?base=${baseCurrency}`, { signal: controller.signal }),
          fetch(`${FRANKFURTER_API}/currencies`, { signal: controller.signal }),
        ])

        if (!ratesResponse.ok || !currenciesResponse.ok) {
          throw new Error('Unable to fetch rates')
        }

        const ratesData = await ratesResponse.json()
        const currenciesData = await currenciesResponse.json()

        const nextRates = ratesData.reduce(
          (acc, entry) => {
            if (entry?.quote && Number.isFinite(entry.rate)) {
              acc[entry.quote] = entry.rate
            }
            return acc
          },
          { [baseCurrency]: 1 },
        )

        const currencyCodes = currenciesData
          .map((entry) => entry?.iso_code)
          .filter((code) => typeof code === 'string' && code && nextRates[code])

        setRates(nextRates)
        setCurrencies(currencyCodes)
        setRateDate(ratesData[0]?.date || 'Live')
        setStatus('ready')
      } catch (err) {
        if (err.name === 'AbortError') return
        setRates({})
        setCurrencies([])
        setRateDate('')
        setStatus('error')
        setError('Unable to load live rates right now.')
      }
    }

    fetchRates()
    return () => controller.abort()
  }, [baseCurrency, reloadKey])

  const availableCurrencies = useMemo(() => {
    const filtered = currencies.filter((code) => code !== baseCurrency)
    const priority = PRIORITY_CURRENCIES.filter((code) => filtered.includes(code))
    const remainder = filtered
      .filter((code) => !priority.includes(code))
      .sort((left, right) => left.localeCompare(right))

    return [...priority, ...remainder]
  }, [baseCurrency, currencies])

  const activeTargetCurrency = useMemo(() => {
    if (availableCurrencies.includes(targetCurrency)) return targetCurrency
    return availableCurrencies[0] || baseCurrency
  }, [availableCurrencies, baseCurrency, targetCurrency])

  const converted = useMemo(() => {
    const rate = rates[activeTargetCurrency]
    if (!rate) return null
    return amount * rate
  }, [activeTargetCurrency, amount, rates])

  const formatCurrency = (value, currency) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)

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
          <span>Base total</span>
          <strong>{formatCurrency(amount, baseCurrency)}</strong>
          <small>Tracked in {baseCurrency}</small>
        </div>
        <div className="converter-card interactive-card">
          <label className="field">
            <span>Convert to</span>
            <select
              value={activeTargetCurrency}
              onChange={(event) => setTargetCurrency(event.target.value)}
              disabled={status !== 'ready'}
            >
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <strong>
            {converted === null || status !== 'ready'
              ? '--'
              : formatCurrency(converted, activeTargetCurrency)}
          </strong>
          <small>
            {status === 'loading' && 'Fetching latest rates...'}
            {status === 'ready' && `Rate updated ${rateDate}`}
            {status === 'error' && error}
          </small>
          {status === 'error' ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setReloadKey((prev) => prev + 1)}
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
