import { useState } from 'react'

export default function NewsletterCard({ isFiltered }) {
  const [email, setEmail] = useState('')
  const [subscribers] = useState(42)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setEmail('')
      alert('Thanks for subscribing!')
    }
  }

  return (
    <div className={`card newsletter-card${isFiltered ? ' filtered-out' : ''}`}>
      <div className="card-accent purple" />
      <div className="card-inner">
        <div className="card-body">
          <div className="card-label">
            <span className="card-label-dot" style={{ background: '#a78bfa' }} />
            Newsletter
          </div>
          <div className="newsletter-title">Shall I keep you in the loop?</div>
          <div className="newsletter-desc">
            Content includes articles, early access to projects, and ongoing learnings.
          </div>
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="newsletter-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <button type="submit" className="newsletter-submit">
              Subscribe
            </button>
          </form>
          <div className="newsletter-count">
            #{subscribers + 1} · {subscribers} subscribers
          </div>
        </div>
      </div>
    </div>
  )
}
