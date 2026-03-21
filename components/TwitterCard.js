export default function TwitterCard({ isFiltered }) {
  return (
    <div className={`card twitter-card${isFiltered ? ' filtered-out' : ''}`}>
      <div className="card-inner" style={{ height: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <div className="twitter-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>
        <a
          href="https://twitter.com"
          className="corner-link"
          target="_blank"
          rel="noopener noreferrer"
          onMouseDown={(e) => e.stopPropagation()}
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)' }}
        >
          ↗
        </a>
      </div>
    </div>
  )
}
