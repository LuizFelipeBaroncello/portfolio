interface ThemeCardProps {
  theme: string
  onToggle: () => void
  isFiltered?: boolean
}

export default function ThemeCard({ theme, onToggle, isFiltered }: ThemeCardProps) {
  const isDark = theme === 'dark'

  return (
    <div className={`card theme-card${isDark ? ' dark' : ' light'}${isFiltered ? ' filtered-out' : ''}`}>
      <div className="card-inner" style={{ height: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <div className="theme-card-icon">
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </div>
        </div>
        <button
          className="corner-link"
          onClick={onToggle}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={isDark
            ? { color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.15)' }
            : { color: '#6366f1', borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.15)' }
          }
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
