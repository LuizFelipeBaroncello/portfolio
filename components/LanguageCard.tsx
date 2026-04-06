import { useRouter } from 'next/router'

const LOCALES = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'pt', label: 'PT', flag: '🇧🇷' },
]

interface LanguageCardProps {
  isFiltered?: boolean
}

export default function LanguageCard({ isFiltered }: LanguageCardProps) {
  const router = useRouter()
  const { locale, pathname, asPath, query } = router

  const switchLocale = (code: string) => {
    router.push({ pathname, query }, asPath, { locale: code })
  }

  return (
    <div className={`card language-card${isFiltered ? ' filtered-out' : ''}`}>
      <div className="card-inner" style={{ height: '100%' }}>
        <div className="language-card-content">
          {LOCALES.map((loc) => (
            <button
              key={loc.code}
              className={`language-card-btn${locale === loc.code ? ' active' : ''}`}
              onClick={() => switchLocale(loc.code)}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={`Switch to ${loc.label}`}
            >
              <span className="language-card-flag">{loc.flag}</span>
              <span className="language-card-label">{loc.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
