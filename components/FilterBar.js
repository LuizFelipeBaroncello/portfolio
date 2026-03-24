import ThemeToggle from './ThemeToggle'

export default function FilterBar({ filters, activeFilter, onSetFilter, theme, onToggleTheme, logo, contactHref }) {
  return (
    <div className="filter-bar-wrapper">
      <span className="header-logo">{logo}</span>
      <div className="filter-bar-center">
        <div className="filter-bar">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-tag${activeFilter === filter ? ' active' : ''}`}
              onClick={() => onSetFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <a href={contactHref} className="contact-link">
        Contact
      </a>
    </div>
  )
}
