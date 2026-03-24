export default function BioCard({ isFiltered }) {
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
            I&apos;m <strong className="bio-name">Luiz Felipe</strong>, a Software
            Engineer from Santa Catarina, Brazil. Currently at{' '}
            <strong>Mercado Livre</strong>. Experienced with{' '}
            <strong>Java</strong>, <strong>Spring</strong>,{' '}
            <strong>React</strong>, <strong>Microservices</strong>{' '}
            and <strong>Cloud</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
