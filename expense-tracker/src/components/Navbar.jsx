import TextType from './TextType'

export default function Navbar() {
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
      </div>
    </header>
  )
}
