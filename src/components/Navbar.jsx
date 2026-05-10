import TextType from './TextType'

export default function Navbar({
  currency = 'USD',
  currencies = [],
  onCurrencyChange = () => {},
  rateStatus,
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <p className="brand-title">Expense Tracker</p>
            <TextType
              text={['Personal finance, distilled', 'Track. Reflect. Adjust.', 'Clarity in every receipt.']}
              typingSpeed={55}
              pauseDuration={1600}
              deletingSpeed={28}
              showCursor={true}
              cursorCharacter="|"
              className="brand-subtitle"
            />
          </div>
        </div>
        <div className="topbar-meta">
          <label className="field currency-switch" htmlFor="currency-switch">
            <span>Currency</span>
            <select
              id="currency-switch"
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value)}
            >
              {currencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {rateStatus === 'loading' ? (
            <span className="currency-status">Updating rates...</span>
          ) : null}
          {rateStatus === 'error' ? (
            <span className="currency-status currency-status--error">Rates unavailable</span>
          ) : null}
        </div>
      </div>
    </header>
  )
}
