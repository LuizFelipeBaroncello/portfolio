import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Card from '../components/Card'
import FilterBar from '../components/FilterBar'
import BioCard from '../components/BioCard'
import MapCard from '../components/MapCard'
import LinkedInCard from '../components/LinkedInCard'
import MusicCard from '../components/MusicCard'
import { useTheme } from '../lib/use-theme'
import { CARDS_DATA, CATEGORY_FILTERS, GRID_LAYOUTS } from '../lib/cards-data'

const ResponsiveGridLayout = dynamic(() => import('../components/BentoGrid'), { ssr: false })

const FILTER_MAP = {
  All: () => true,
  About: (card) => ['bio', 'map', 'social', 'linkedin'].includes(card.id),
  Projects: (card) => card.type === 'project',
  Media: (card) => ['music', 'blog'].includes(card.id),
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [locked, setLocked] = useState(false)
  const [theme, toggleTheme] = useTheme()
  const [layouts, setLayouts] = useState(GRID_LAYOUTS)
  const [mounted, setMounted] = useState(false)
  const hasInteracted = useRef(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('bento-layout')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Validate: if every item in any breakpoint is at x=0,y=0, layout is corrupted
        const isCorrupted = Object.values(parsed).some((bp) =>
          Array.isArray(bp) && bp.length > 1 && bp.every((item) => item.x === 0 && item.y === 0)
        )
        if (!isCorrupted) {
          setLayouts(parsed)
        } else {
          localStorage.removeItem('bento-layout')
        }
      } catch (_) {
        localStorage.removeItem('bento-layout')
      }
    }
  }, [])

  const handleLayoutChange = (_, allLayouts) => {
    if (!hasInteracted.current) return
    localStorage.setItem('bento-layout', JSON.stringify(allLayouts))
    setLayouts(allLayouts)
  }

  const handleDragStop = () => {
    hasInteracted.current = true
  }

  const filteredLayouts = useMemo(() => {
    if (activeFilter === 'All') return layouts

    const filterFn = FILTER_MAP[activeFilter]
    const result = {}

    for (const [bp, items] of Object.entries(layouts)) {
      const matching = []
      const nonMatching = []

      for (const item of items) {
        const card = CARDS_DATA.find((c) => c.id === item.i)
        if (card && filterFn(card)) {
          matching.push({ ...item, y: 0 })
        } else {
          nonMatching.push({ ...item, y: 100 })
        }
      }

      result[bp] = [...matching, ...nonMatching]
    }

    return result
  }, [activeFilter, layouts])

  const isFiltered = (card) => {
    if (activeFilter === 'All') return false
    return !FILTER_MAP[activeFilter]?.(card)
  }

  const renderCard = (card) => {
    const filtered = isFiltered(card)

    switch (card.type) {
      case 'bio':
        return (
          <BioCard
            key={card.id}
            locked={locked}
            onToggleLockdown={() => setLocked((p) => !p)}
            isFiltered={filtered}
          />
        )
      case 'map':
        return <MapCard key={card.id} isFiltered={filtered} />
      case 'linkedin':
        return <LinkedInCard key={card.id} isFiltered={filtered} />
      case 'music':
        return <MusicCard key={card.id} isFiltered={filtered} />
      case 'project':
        return (
          <Card key={card.id} className="project-card" isFiltered={filtered} accent={card.accent}>
            <div className="card-body">
              <div className="card-label">
                <span
                  className="card-label-dot"
                  style={{ background: `var(--accent-${card.accent})` }}
                />
                Project
              </div>
              <div className="card-title">{card.title}</div>
              <div className="card-description">{card.description}</div>
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
          <Card key={card.id} className="blog-card" isFiltered={filtered} accent={card.accent}>
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
      case 'social':
        return (
          <Card key={card.id} className="social-card" isFiltered={filtered} accent="pink">
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
                  href="https://github.com/LuizFelipeBaroncello"
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
                  href="https://www.linkedin.com/in/luiz-felipe-ribeiro-baroncello-aa3825159/"
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
        <title>Luiz Felipe Baroncello — Software Engineer</title>
      </Head>
      <div className="page-container">
        <header className="header">
          <span className="header-logo">LFRB</span>
          <a href="mailto:luizfelipe_rv97@hotmail.com" className="contact-link">
            Contact
          </a>
        </header>

        <FilterBar
          filters={CATEGORY_FILTERS}
          activeFilter={activeFilter}
          onSetFilter={setActiveFilter}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {mounted && (
          <ResponsiveGridLayout
            className={`bento-grid${locked ? '' : ' draggable'}`}
            layouts={filteredLayouts}
            breakpoints={{ lg: 1200, md: 900, sm: 0 }}
            cols={{ lg: 12, md: 8, sm: 4 }}
            rowHeight={180}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable={!locked}
            isResizable={false}
            compactType="vertical"
            onLayoutChange={handleLayoutChange}
            onDragStop={handleDragStop}
            draggableCancel=".lockdown-btn, a, button, input"
          >
            {CARDS_DATA.map((card) => (
              <div key={card.id}>{renderCard(card)}</div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
    </>
  )
}
