import { useMemo } from 'react'
import useTilt from '../hooks/useTilt'

export default function BudgetPlanner({ budget, onBudgetChange, spent, formatCurrency }) {
  const tiltRef = useTilt({ max: 5, lift: 8, shift: 6 })
  const { progress, remaining, statusLabel } = useMemo(() => {
    if (!budget || budget <= 0) {
      return { progress: 0, remaining: 0, statusLabel: 'Set a monthly budget to track progress.' }
    }
    const progressValue = Math.min(spent / budget, 1)
    const remainingValue = budget - spent
    const label = remainingValue >= 0 ? 'Remaining this month' : 'Over budget'
    return { progress: progressValue, remaining: remainingValue, statusLabel: label }
  }, [budget, spent])

  const handleChange = (event) => {
    const nextValue = event.target.value
    const numeric = Number(nextValue)
    if (nextValue === '') {
      onBudgetChange(null)
      return
    }
    if (Number.isFinite(numeric) && numeric >= 0) {
      onBudgetChange(Number(numeric.toFixed(2)))
    }
  }

  const quickSet = (value) => () => {
    onBudgetChange(value)
  }

  return (
    <section ref={tiltRef} className="panel budget-panel interactive-surface">
      <div className="panel-header">
        <div>
          <h2>Budget planner</h2>
          <p className="muted">Stay ahead with a monthly spending target.</p>
        </div>
        <span className="pill">Interactive</span>
      </div>

      <div className="budget-grid">
        <label className="field" htmlFor="budget-input">
          <span>Monthly budget (USD)</span>
          <input
            id="budget-input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="1200"
            value={budget ? String(budget) : ''}
            onChange={handleChange}
          />
        </label>
        <div className="budget-meta interactive-card">
          <span className="budget-label">{statusLabel}</span>
          <strong>{budget ? formatCurrency(Math.abs(remaining)) : '--'}</strong>
          <small>{budget ? `${formatCurrency(spent)} spent` : 'No budget set'}</small>
        </div>
      </div>

      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="budget-actions">
        <button className="btn btn-ghost" type="button" onClick={quickSet(500)}>
          $500
        </button>
        <button className="btn btn-ghost" type="button" onClick={quickSet(1200)}>
          $1,200
        </button>
        <button className="btn btn-ghost" type="button" onClick={quickSet(2500)}>
          $2,500
        </button>
      </div>
    </section>
  )
}
