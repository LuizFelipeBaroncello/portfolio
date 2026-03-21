import ThemeToggle from './ThemeToggle'

export default function FilterBar({ filters, activeFilter, onSetFilter, theme, onToggleTheme }) {
  return (
    <div className="filter-bar-wrapper">
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
      <div className="filter-bar-right">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </div>
  )
}
