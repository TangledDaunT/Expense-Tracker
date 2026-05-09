import { parseExpenseDate } from '../utils/date'
import useTilt from '../hooks/useTilt'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export default function ExpenseCard({ expense, onRemove, formatCurrency }) {
  const tiltRef = useTilt({ max: 7, lift: 10, shift: 8, scale: 1.015 })
  let dateLabel = 'No date'
  if (expense.date) {
    const parsed = parseExpenseDate(expense.date)
    if (parsed) {
      dateLabel = dateFormatter.format(parsed)
    }
  }

  return (
    <article ref={tiltRef} className="expense-card interactive-surface interactive-surface--compact">
      <div>
        <div className="expense-header">
          <h3>{expense.name}</h3>
          <span className="amount">{formatCurrency(expense.amount)}</span>
        </div>
        <div className="expense-meta">
          <span className="chip">{expense.category}</span>
          <span>{dateLabel}</span>
        </div>
        {expense.note ? <p className="expense-note">{expense.note}</p> : null}
      </div>
      <button
        className="btn btn-danger"
        type="button"
        onClick={() => onRemove(expense.id)}
      >
        Remove
      </button>
    </article>
  )
}
