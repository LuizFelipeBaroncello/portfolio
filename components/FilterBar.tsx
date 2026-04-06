import type { CategoryFilter, FilterKey } from '../lib/cards-data'

interface FilterBarProps {
  filters: CategoryFilter[]
  activeFilter: FilterKey
  onSetFilter: (filter: FilterKey) => void
  logo: string
  contactHref: string
  contactLabel: string
}

export default function FilterBar({ filters, activeFilter, onSetFilter, logo, contactHref, contactLabel }: FilterBarProps) {
  return (
    <div className="filter-bar-wrapper">
      <span className="header-logo">{logo}</span>
      <div className="filter-bar-center">
        <div className="filter-bar">
          {filters.map((filter) => (
            <button
              key={filter.key}
              className={`filter-tag${activeFilter === filter.key ? ' active' : ''}`}
              onClick={() => onSetFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <a href={contactHref} className="contact-link">
        {contactLabel}
      </a>
    </div>
  )
}
