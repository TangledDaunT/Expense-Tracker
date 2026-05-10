import useTilt from '../hooks/useTilt'

export default function SummaryPanel({ summary, formatCurrency }) {
  const tiltRef = useTilt({ max: 5, lift: 8, shift: 6 })

  return (
    <section ref={tiltRef} className="panel summary-panel interactive-surface">
      <div className="panel-header">
        <div>
          <h2>Snapshot</h2>
          <p className="muted">A quick read on your spending behavior.</p>
        </div>
        <span className="pill">Updated live</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card interactive-card">
          <span>Total spend</span>
          <strong>{formatCurrency(summary.total)}</strong>
          <small>All time</small>
        </div>
        <div className="stat-card interactive-card">
          <span>This month</span>
          <strong>{formatCurrency(summary.monthTotal)}</strong>
          <small>Month to date</small>
        </div>
        <div className="stat-card interactive-card">
          <span>Average expense</span>
          <strong>{formatCurrency(summary.average)}</strong>
          <small>{summary.count} transactions</small>
        </div>
        <div className="stat-card interactive-card">
          <span>Largest expense</span>
          <strong>{formatCurrency(summary.largest)}</strong>
          <small>Highest single entry</small>
        </div>
      </div>

      <div className="category-panel">
        <div>
          <h3>Category mix</h3>
          <p className="muted">A full breakdown of every category you have logged.</p>
        </div>
        {summary.categoryTotals.length === 0 ? (
          <div className="empty-state">Add expenses to see category trends.</div>
        ) : (
          <div className="category-grid">
            {summary.categoryTotals.map((item) => (
              <div className="category-row interactive-line" key={item.category}>
                <span>{item.category}</span>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
