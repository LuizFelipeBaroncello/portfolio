export default function FilterBar({
    filters,
    activeFilters,
    onToggleFilter,
    locked,
    onToggleLockdown,
}) {
    return (
        <div className="filter-bar">
            {filters.map((filter) => (
                <button
                    key={filter}
                    className={`filter-tag ${activeFilters.includes(filter) ? 'active' : ''
                        }`}
                    onClick={() => onToggleFilter(filter)}
                >
                    {filter}
                </button>
            ))}
            <button
                className={`lockdown-btn ${locked ? 'locked' : ''}`}
                onClick={onToggleLockdown}
            >
                <span className="lockdown-icon">{locked ? '🔒' : '🔓'}</span>
                {locked ? 'Locked' : 'Toggle Lockdown'}
            </button>
        </div>
    )
}
