interface BioCardProps {
  isFiltered?: boolean
}

const TECH_STACK = [
  { area: 'Backend', techs: ['Java', 'Spring Boot', 'Microservices', 'Kafka'] },
  { area: 'Frontend', techs: ['React', 'Next.js', 'TypeScript'] },
  { area: 'Cloud/Infra', techs: ['AWS', 'Docker', 'Kubernetes'] },
]

const EXPERIENCE = [
  'Software Engineer at Mercado Livre, working on high-scale distributed systems',
  'Experience building Java/Spring microservices handling millions of daily transactions',
  'Full-stack skills: React frontends to cloud-native backend services on AWS',
]

export default function BioCard({ isFiltered }: BioCardProps) {
  return (
    <div className={`card bio-card${isFiltered ? ' filtered-out' : ''}`}>
      <div className="card-inner">
        <div className="card-body">
          <div className="bio-header">
            <img
              src="/images/photo.jpg"
              alt="Luiz Felipe"
              className="bio-avatar"
              onMouseDown={(e) => e.stopPropagation()}
            />
            <div className="bio-header-text">
              <p className="bio-intro">
                I&apos;m <strong className="bio-name">Luiz Felipe</strong>, a Software
                Engineer from Santa Catarina, Brazil. Currently at{' '}
                <strong>Mercado Livre</strong>, building high-scale distributed systems.
                Passionate about clean code, complex problems, and backend engineering.
              </p>
            </div>
          </div>

          <div className="bio-experience">
            <div className="bio-section-label">Experience</div>
            <ul className="bio-experience-list">
              {EXPERIENCE.map((item, i) => (
                <li key={i} className="bio-experience-item">{item}</li>
              ))}
            </ul>
          </div>

          <div className="bio-stack">
            <div className="bio-section-label">Tech Stack</div>
            <div className="bio-stack-groups">
              {TECH_STACK.map(({ area, techs }) => (
                <div key={area} className="bio-stack-group">
                  <span className="bio-stack-area">{area}:</span>
                  <div className="bio-stack-tags">
                    {techs.map((tech) => (
                      <span key={tech} className="bio-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
