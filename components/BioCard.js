export default function BioCard({ locked, onToggleLockdown, isFiltered }) {
  return (
    <div className={`card bio-card${isFiltered ? ' filtered-out' : ''}`}>
      <div className="card-inner">
        <div className="card-body">
          <img
            src="/images/photo.jpg"
            alt="Luiz Felipe"
            className="bio-avatar"
            onMouseDown={(e) => e.stopPropagation()}
          />
          <p className="bio-intro">
            I&apos;m <strong className="bio-name">Luiz Felipe</strong>, a developer
            and product designer from Brazil. I&apos;m interested in{' '}
            <strong>React</strong>, <strong>Node</strong>,{' '}
            <strong>Product Design</strong>, <strong>Next.js</strong>,{' '}
            <strong>Startups</strong> and <strong>Front-end</strong>.
          </p>
          <button
            className={`lockdown-btn${locked ? ' locked' : ''}`}
            onClick={onToggleLockdown}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {locked ? '🔒' : '↕'} {locked ? 'Unlock grid' : 'Toggle Lockdown'}
          </button>
        </div>
      </div>
    </div>
  )
}
