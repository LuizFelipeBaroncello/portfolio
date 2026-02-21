import { useState, useMemo } from 'react'
import Head from 'next/head'
import Card from '../components/Card'
import FilterBar from '../components/FilterBar'
import MusicCard from '../components/MusicCard'
import NewsletterCard from '../components/NewsletterCard'

const FILTERS = [
    'React',
    'Node',
    'Product Design',
    'Next.js',
    'Startups',
    'Front-end',
    'Music',
]

const CARDS_DATA = [
    {
        id: 'recroot',
        type: 'project',
        title: 'Recroot',
        description:
            'A modern recruitment platform built with React and Node.js, focusing on streamlined hiring workflows and candidate experience.',
        tags: ['React', 'Node', 'Startups', 'Product Design'],
        accent: 'blue',
        link: '#',
    },
    {
        id: 'vouch',
        type: 'project',
        title: 'Vouch For',
        description:
            'Social proof platform that lets professionals vouch for each other\'s skills and work ethic.',
        tags: ['React', 'Next.js', 'Product Design', 'Startups'],
        accent: 'green',
        link: '#',
    },
    {
        id: 'wrapso',
        type: 'project',
        title: 'Wrap.so',
        description:
            'Create beautiful screenshots and code snippets for social media sharing. Built with modern web technologies.',
        tags: ['Next.js', 'React', 'Front-end', 'Product Design'],
        accent: 'purple',
        link: '#',
    },
    {
        id: 'blog-history',
        type: 'blog',
        title: 'How it started vs. how it\'s going',
        description:
            'A short personal history as it relates to design and development, and how I\'ve found value in the cross-section between both disciplines.',
        tags: ['Product Design', 'Front-end'],
        accent: 'orange',
        date: 'May 5, 2021',
    },
    {
        id: 'music',
        type: 'music',
        tags: ['Music'],
    },
    {
        id: 'newsletter',
        type: 'newsletter',
        tags: ['Newsletter'],
    },
    {
        id: 'devtools',
        type: 'project',
        title: 'DevTools Kit',
        description:
            'A collection of developer utilities and productivity tools for modern web development.',
        tags: ['Node', 'React', 'Front-end'],
        accent: 'pink',
        link: '#',
    },
    {
        id: 'about',
        type: 'about',
        tags: [],
    },
    {
        id: 'social',
        type: 'social',
        tags: [],
    },
]

export default function Home() {
    const [activeFilters, setActiveFilters] = useState([])
    const [locked, setLocked] = useState(false)

    const toggleFilter = (filter) => {
        setActiveFilters((prev) =>
            prev.includes(filter)
                ? prev.filter((f) => f !== filter)
                : [...prev, filter]
        )
    }

    const toggleLockdown = () => setLocked((prev) => !prev)

    // Sort cards: filtered-in first, filtered-out last
    const sortedCards = useMemo(() => {
        if (activeFilters.length === 0) return CARDS_DATA
        const matched = []
        const unmatched = []
        CARDS_DATA.forEach((card) => {
            if (card.tags.some((t) => activeFilters.includes(t))) {
                matched.push(card)
            } else {
                unmatched.push(card)
            }
        })
        return [...matched, ...unmatched]
    }, [activeFilters])

    const renderCard = (card) => {
        switch (card.type) {
            case 'music':
                return (
                    <MusicCard
                        key={card.id}
                        activeFilters={activeFilters}
                        locked={locked}
                    />
                )
            case 'newsletter':
                return (
                    <NewsletterCard
                        key={card.id}
                        activeFilters={activeFilters}
                        locked={locked}
                    />
                )
            case 'project':
                return (
                    <Card
                        key={card.id}
                        className="project-card"
                        tags={card.tags}
                        activeFilters={activeFilters}
                        locked={locked}
                        accent={card.accent}
                    >
                        <div className="card-body">
                            <div className="card-label">
                                <span
                                    className="card-label-dot"
                                    style={{
                                        background: `var(--accent-${card.accent})`,
                                    }}
                                />
                                Project
                            </div>
                            <div className="card-title">{card.title}</div>
                            <div className="card-description">{card.description}</div>
                            <div className="card-tags">
                                {card.tags.map((tag) => (
                                    <span key={tag} className="card-tag-pill">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <a
                                href={card.link}
                                className="card-link"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                Visit project <span className="card-link-arrow">→</span>
                            </a>
                        </div>
                    </Card>
                )
            case 'blog':
                return (
                    <Card
                        key={card.id}
                        className="blog-card"
                        tags={card.tags}
                        activeFilters={activeFilters}
                        locked={locked}
                        accent={card.accent}
                    >
                        <div className="card-body">
                            <div className="card-label">
                                <span
                                    className="card-label-dot"
                                    style={{ background: `var(--accent-${card.accent})` }}
                                />
                                Blog
                            </div>
                            <div className="card-title">{card.title}</div>
                            <div className="card-description">{card.description}</div>
                            <div className="card-date">{card.date}</div>
                            <a
                                href="#"
                                className="read-more"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                Read more <span>→</span>
                            </a>
                        </div>
                    </Card>
                )
            case 'about':
                return (
                    <Card
                        key={card.id}
                        className="about-card"
                        tags={card.tags}
                        activeFilters={activeFilters}
                        locked={locked}
                        accent="blue"
                    >
                        <div className="card-body">
                            <div className="card-label">
                                <span
                                    className="card-label-dot"
                                    style={{ background: 'var(--accent-blue)' }}
                                />
                                About
                            </div>
                            <div className="card-title">Background</div>
                            <div className="about-content">
                                A <strong>Mid level Software Engineer</strong> at GFT, I enjoy
                                working with <strong>Next.js</strong>, teaching my friends and
                                crafting beautiful <strong>front-end experiences</strong>. My
                                journey spans from product design to full-stack development,
                                always finding value at the intersection of both disciplines.
                            </div>
                            <div className="card-tags">
                                <span className="card-tag-pill">React</span>
                                <span className="card-tag-pill">Next.js</span>
                                <span className="card-tag-pill">Product Design</span>
                                <span className="card-tag-pill">Node.js</span>
                            </div>
                        </div>
                    </Card>
                )
            case 'social':
                return (
                    <Card
                        key={card.id}
                        className="social-card"
                        tags={card.tags}
                        activeFilters={activeFilters}
                        locked={locked}
                        accent="pink"
                    >
                        <div className="card-body">
                            <div className="card-label">
                                <span
                                    className="card-label-dot"
                                    style={{ background: 'var(--accent-pink)' }}
                                />
                                Connect
                            </div>
                            <div className="social-links">
                                <a
                                    href="https://github.com"
                                    className="social-link"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="social-link-icon">🐙</span>
                                    GitHub
                                </a>
                                <a
                                    href="https://twitter.com"
                                    className="social-link"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="social-link-icon">🐦</span>
                                    Twitter / X
                                </a>
                                <a
                                    href="https://linkedin.com"
                                    className="social-link"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="social-link-icon">💼</span>
                                    LinkedIn
                                </a>
                            </div>
                        </div>
                    </Card>
                )
            default:
                return null
        }
    }

    return (
        <>
            <Head>
                <title>Luiz Felipe Baroncello — Developer, Designer</title>
            </Head>
            <div className="page-container">
                <header className="header">
                    <div className="header-left">
                        <p className="header-intro">
                            I'm{' '}
                            <span className="name-highlight">Luiz Felipe</span>, a
                            developer and product designer from Brazil. I'm interested in{' '}
                            <strong>React</strong>, <strong>Node</strong>,{' '}
                            <strong>Product Design</strong>, <strong>Next.js</strong>,{' '}
                            <strong>Startups</strong>, <strong>Front-end Development</strong>{' '}
                            and <strong>Music</strong>.
                        </p>
                    </div>
                    <a href="mailto:luizfelipe@example.com" className="contact-link">
                        ✉️ Contact
                    </a>
                </header>

                <FilterBar
                    filters={FILTERS}
                    activeFilters={activeFilters}
                    onToggleFilter={toggleFilter}
                    locked={locked}
                    onToggleLockdown={toggleLockdown}
                />

                <div className="cards-container">
                    {sortedCards.map((card) => renderCard(card))}
                </div>
            </div>
        </>
    )
}
