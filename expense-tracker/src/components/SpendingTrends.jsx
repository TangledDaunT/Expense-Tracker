import useTilt from '../hooks/useTilt'

export default function SpendingTrends({ days, formatCurrency }) {
  const tiltRef = useTilt({ max: 4, lift: 7, shift: 5 })
  const maxValue = days.reduce((max, item) => Math.max(max, item.amount), 0) || 1

  return (
    <section ref={tiltRef} className="panel trends-panel interactive-surface">
      <div className="panel-header">
        <div>
          <h2>Spending rhythm</h2>
          <p className="muted">A seven-day glance at your activity.</p>
        </div>
        <span className="pill">Weekly</span>
      </div>
      <div className="trend-chart" role="img" aria-label="Seven day spending chart">
        {days.map((day) => {
          const height = Math.max(6, Math.round((day.amount / maxValue) * 100))
          return (
            <div className="trend-bar interactive-bar" key={day.key} style={{ height: `${height}%` }}>
              <div className="trend-tooltip">
                <strong>{formatCurrency(day.amount)}</strong>
                <span>{day.label}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="trend-labels">
        {days.map((day) => (
          <span key={day.key}>{day.shortLabel}</span>
        ))}
      </div>
    </section>
  )
}
