import { useMemo } from 'react'
import useTilt from '../hooks/useTilt'

export default function BudgetPlanner({ budgetAmount, onBudgetChange, spent = 0, formatCurrency, currency = 'USD' }) {
  const tiltRef = useTilt({ max: 5, lift: 8, shift: 6 })
  const { progress, remaining, statusLabel } = useMemo(() => {
    const normalizedBudget = Number.isFinite(budgetAmount) ? budgetAmount : null
    const normalizedSpent = Number.isFinite(spent) ? spent : 0
    if (!normalizedBudget || normalizedBudget <= 0) {
      return { progress: 0, remaining: 0, statusLabel: 'Set a monthly budget to track progress.' }
    }
    const progressValue = Math.min(normalizedSpent / normalizedBudget, 1)
    const remainingValue = normalizedBudget - normalizedSpent
    const label = remainingValue >= 0 ? 'Remaining this month' : 'Over budget'
    return { progress: progressValue, remaining: remainingValue, statusLabel: label }
  }, [budgetAmount, spent])

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
          <span>Monthly budget ({currency})</span>
          <input
            id="budget-input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="1200"
            value={budgetAmount ? String(budgetAmount) : ''}
            onChange={handleChange}
          />
        </label>
        <div className="budget-meta interactive-card">
          <span className="budget-label">{statusLabel}</span>
          <strong>{budgetAmount ? formatCurrency(Math.abs(remaining)) : '--'}</strong>
          <small>{budgetAmount ? `${formatCurrency(spent)} spent` : 'No budget set'}</small>
        </div>
      </div>

      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="budget-actions">
        <button className="btn btn-ghost" type="button" onClick={quickSet(500)}>
          {formatCurrency(500)}
        </button>
        <button className="btn btn-ghost" type="button" onClick={quickSet(1200)}>
          {formatCurrency(1200)}
        </button>
        <button className="btn btn-ghost" type="button" onClick={quickSet(2500)}>
          {formatCurrency(2500)}
        </button>
      </div>
    </section>
  )
}
