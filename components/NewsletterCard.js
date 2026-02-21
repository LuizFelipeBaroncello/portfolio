import { useState } from 'react'
import Card from './Card'

export default function NewsletterCard({ activeFilters, locked }) {
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
        <Card
            className="newsletter-card"
            tags={['Newsletter']}
            activeFilters={activeFilters}
            locked={locked}
            accent="purple"
        >
            <div className="card-body">
                <div className="card-label">
                    <span className="card-label-dot" style={{ background: '#a78bfa' }} />
                    Newsletter
                </div>
                <div className="newsletter-title">Shall I keep you in the loop?</div>
                <div className="newsletter-desc">
                    Content includes articles, early access to products, and ongoing
                    learnings.
                </div>
                <form className="newsletter-form" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        className="newsletter-input"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    />
                    <button type="submit" className="newsletter-submit">
                        Subscribe
                    </button>
                </form>
                <div className="newsletter-count">
                    You'll be subscriber #{subscribers + 1} · {subscribers} subscribers
                </div>
            </div>
        </Card>
    )
}
