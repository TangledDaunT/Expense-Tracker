import { useId, useMemo, useState } from 'react'
import useTilt from '../hooks/useTilt'
import { toLocalDateInputValue } from '../utils/date'

function todayValue() {
  return toLocalDateInputValue()
}

export default function ExpenseForm({ categories, onAddExpense }) {
  const tiltRef = useTilt()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0] || 'Other')
  const [date, setDate] = useState(todayValue)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const nameId = useId()
  const amountId = useId()
  const categoryId = useId()
  const dateId = useId()
  const noteId = useId()

  const canSubmit = useMemo(() => {
    const numericAmount = Number(amount)
    return name.trim().length > 1 && numericAmount > 0
  }, [name, amount])

  const updateField = (setter) => (event) => {
    setter(event.target.value)
    if (error) setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const numericAmount = Number(amount)

    if (trimmedName.length < 2) {
      setError('Add a descriptive expense name.')
      return
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount above zero.')
      return
    }

    onAddExpense({
      name: trimmedName,
      amount: Number(numericAmount.toFixed(2)),
      category,
      date: date || todayValue(),
      note: note.trim(),
    })

    setName('')
    setAmount('')
    setCategory(categories[0] || 'Other')
    setDate(todayValue())
    setNote('')
    setError('')
  }

  return (
    <section ref={tiltRef} className="panel tilt-card interactive-surface">
      <div className="panel-header">
        <div>
          <h2>Log a new expense</h2>
          <p className="muted">Capture the basics and keep the ledger clean.</p>
        </div>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field" htmlFor={nameId}>
          <span>Expense name</span>
          <input
            id={nameId}
            type="text"
            placeholder="Coffee run, design tools, groceries"
            value={name}
            onChange={updateField(setName)}
            autoComplete="off"
            maxLength={60}
            required
          />
        </label>

        <label className="field" htmlFor={amountId}>
          <span>Amount (USD)</span>
          <input
            id={amountId}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={updateField(setAmount)}
            required
          />
        </label>

        <label className="field" htmlFor={categoryId}>
          <span>Category</span>
          <select
            id={categoryId}
            value={category}
            onChange={updateField(setCategory)}
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor={dateId}>
          <span>Date</span>
          <input
            id={dateId}
            type="date"
            value={date}
            onChange={updateField(setDate)}
            required
          />
        </label>

        <label className="field field-full" htmlFor={noteId}>
          <span>Note (optional)</span>
          <textarea
            id={noteId}
            rows="3"
            placeholder="Add a reminder or tag the context."
            value={note}
            onChange={updateField(setNote)}
            maxLength={180}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            Add expense
          </button>
          <p className="muted">Stored locally in your browser.</p>
        </div>
      </form>
    </section>
  )
}
