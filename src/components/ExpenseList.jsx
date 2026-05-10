import ExpenseCard from './ExpenseCard'
import useTilt from '../hooks/useTilt'

export default function ExpenseList({
  items,
  filters,
  onFiltersChange,
  onRemoveExpense,
  categories,
  sortOptions,
  formatCurrency,
}) {
  const tiltRef = useTilt({ max: 4, lift: 8, shift: 6 })
  let totalVisible = 0
  let totalMissing = false
  items.forEach((item) => {
    if (!Number.isFinite(item.displayAmount)) {
      totalMissing = true
      return
    }
    totalVisible += item.displayAmount
  })

  const updateFilter = (key) => (event) => {
    const value = event.target.value
    onFiltersChange((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      category: 'All',
      minAmount: '',
      maxAmount: '',
      sort: 'date-desc',
    })
  }

  return (
    <section ref={tiltRef} className="panel interactive-surface">
      <div className="panel-header">
        <div>
          <h2>Recent activity</h2>
          <p className="muted">
            {items.length} entries · {formatCurrency(totalMissing ? null : totalVisible)} shown
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={clearFilters}>
          Reset filters
        </button>
      </div>

      <div className="filters-grid">
        <label className="field" aria-label="Search expenses">
          <span>Search</span>
          <input
            type="search"
            placeholder="Name or category"
            value={filters.query}
            onChange={updateFilter('query')}
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select value={filters.category} onChange={updateFilter('category')}>
            <option value="All">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Min amount</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={filters.minAmount}
            onChange={updateFilter('minAmount')}
          />
        </label>

        <label className="field">
          <span>Max amount</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={filters.maxAmount}
            onChange={updateFilter('maxAmount')}
          />
        </label>

        <label className="field">
          <span>Sort</span>
          <select value={filters.sort} onChange={updateFilter('sort')}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="list-grid">
        {items.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing yet</h3>
            <p>Add your first expense to see insights and trends here.</p>
          </div>
        ) : (
          items.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onRemove={onRemoveExpense}
              formatCurrency={formatCurrency}
              displayAmount={expense.displayAmount}
            />
          ))
        )}
      </div>
    </section>
  )
}
