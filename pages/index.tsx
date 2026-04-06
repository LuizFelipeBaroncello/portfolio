import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Head from 'next/head'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import type { GetStaticProps } from 'next'
import Card from '../components/Card'
import FilterBar from '../components/FilterBar'
import BioCard from '../components/BioCard'
import MapCard from '../components/MapCard'
import LinkedInCard from '../components/LinkedInCard'
import MusicCard from '../components/MusicCard'
import ThemeCard from '../components/ThemeCard'
import LanguageCard from '../components/LanguageCard'
import { useTheme } from '../lib/use-theme'
import { getCardsData, getCategoryFilters, GRID_LAYOUTS, CardData, GridLayouts, FilterKey } from '../lib/cards-data'

const ResponsiveGridLayout = dynamic(() => import('../components/BentoGrid'), { ssr: false })

type FilterFn = (card: CardData) => boolean

const FILTER_MAP: Record<FilterKey, FilterFn> = {
  all: () => true,
  about: (card) => ['bio', 'map', 'social', 'linkedin'].includes(card.id),
  projects: (card) => card.type === 'project',
  media: (card) => ['music'].includes(card.id),
  config: (card) => ['theme', 'language'].includes(card.id),
}

export default function Home() {
  const { t } = useTranslation('common')

  const CARDS_DATA = useMemo(() => getCardsData(t), [t])
  const CATEGORY_FILTERS = useMemo(() => getCategoryFilters(t), [t])

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [theme, toggleTheme] = useTheme()
  const [layouts, setLayouts] = useState<GridLayouts>(GRID_LAYOUTS)
  const [mounted, setMounted] = useState(false)
  const hasInteracted = useRef(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('bento-layout')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const isCorrupted = Object.values(parsed).some((bp) =>
          Array.isArray(bp) && bp.length > 1 && bp.every((item: any) => item.x === 0 && item.y === 0)
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

  const handleLayoutChange = (_: any, allLayouts: GridLayouts) => {
    if (!hasInteracted.current) return
    localStorage.setItem('bento-layout', JSON.stringify(allLayouts))
    setLayouts(allLayouts)
  }

  const handleDragStop = () => {
    hasInteracted.current = true
  }

  const filteredLayouts = useMemo(() => {
    if (activeFilter === 'all') return layouts

    const filterFn = FILTER_MAP[activeFilter]
    const result: GridLayouts = {} as GridLayouts

    for (const [bp, items] of Object.entries(layouts)) {
      const matching: any[] = []
      const nonMatching: any[] = []

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
  }, [activeFilter, layouts, CARDS_DATA])

  const isFiltered = (card: CardData) => {
    if (activeFilter === 'all') return false
    return !FILTER_MAP[activeFilter]?.(card)
  }

  const renderCard = (card: CardData) => {
    const filtered = isFiltered(card)

    switch (card.type) {
      case 'bio':
        return <BioCard key={card.id} isFiltered={filtered} />
      case 'map':
        return <MapCard key={card.id} isFiltered={filtered} />
      case 'linkedin':
        return <LinkedInCard key={card.id} isFiltered={filtered} />
      case 'music':
        return <MusicCard key={card.id} isFiltered={filtered} />
      case 'theme':
        return <ThemeCard key={card.id} theme={theme} onToggle={toggleTheme} isFiltered={filtered} />
      case 'language':
        return <LanguageCard key={card.id} isFiltered={filtered} />
      case 'project':
        return (
          <Card key={card.id} className="project-card" isFiltered={filtered} accent={card.accent}>
            <div className="card-body">
              <div className="card-label">
                <span
                  className="card-label-dot"
                  style={{ background: `var(--accent-${card.accent})` }}
                />
                {t('cards.label_project')}
              </div>
              <div className="card-title">{card.title}</div>
              <div className="card-description">{card.description}</div>
              <Link
                href={card.link}
                className="card-link"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {t('cards.visit_project')} <span className="card-link-arrow">→</span>
              </Link>
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
                {t('cards.label_connect')}
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
        <title>{t('meta.home_title')}</title>
        <meta name="description" content={t('meta.home_description')} />
        <meta name="keywords" content="software engineer, java, react, spring, microservices, cloud, santa catarina, brasil, portfolio" />
        <meta property="og:title" content={t('meta.home_title')} />
        <meta property="og:description" content={t('meta.home_description')} />
        <meta property="og:image" content="/og-image.svg" />
        <meta property="og:url" content="https://luizfelipebaroncello.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('meta.home_title')} />
        <meta name="twitter:description" content={t('meta.home_description')} />
        <meta name="twitter:image" content="/og-image.svg" />
      </Head>
      <div className="page-container">
        <FilterBar
          filters={CATEGORY_FILTERS}
          activeFilter={activeFilter}
          onSetFilter={setActiveFilter}
          logo="LFRB"
          contactHref="mailto:luizfelipe_rv97@hotmail.com"
          contactLabel={t('nav.contact')}
        />

        {mounted && (
          <ResponsiveGridLayout
            className="bento-grid draggable"
            layouts={filteredLayouts}
            breakpoints={{ lg: 1200, md: 900, sm: 0 }}
            cols={{ lg: 12, md: 8, sm: 4 }}
            rowHeight={180}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable
            isResizable={false}
            compactType="vertical"
            onLayoutChange={handleLayoutChange}
            onDragStop={handleDragStop}
            draggableCancel="a, button, input"
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

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  }
}
