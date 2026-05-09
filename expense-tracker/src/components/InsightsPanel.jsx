import useTilt from '../hooks/useTilt'

export default function InsightsPanel({ insights, formatCurrency }) {
  const tiltRef = useTilt({ max: 5, lift: 8, shift: 6 })

  return (
    <section ref={tiltRef} className="panel insights-panel interactive-surface">
      <div className="panel-header">
        <div>
          <h2>Insights</h2>
          <p className="muted">A few signals you can act on fast.</p>
        </div>
        <span className="pill">Highlights</span>
      </div>
      <div className="insights-grid">
        <div className="insight-card interactive-card">
          <span>Top category</span>
          <strong>{insights.topCategory ?? 'No data yet'}</strong>
          <small>{insights.topCategory ? formatCurrency(insights.topCategoryAmount) : 'Add expenses to see trends'}</small>
        </div>
        <div className="insight-card interactive-card">
          <span>Most active day</span>
          <strong>{insights.topDayLabel ?? '--'}</strong>
          <small>{insights.topDayLabel ? formatCurrency(insights.topDayAmount) : 'Track a week to compare'}</small>
        </div>
        <div className="insight-card interactive-card">
          <span>Avg. daily spend</span>
          <strong>{formatCurrency(insights.averageDaily)}</strong>
          <small>Last 30 days</small>
        </div>
      </div>
    </section>
  )
}
