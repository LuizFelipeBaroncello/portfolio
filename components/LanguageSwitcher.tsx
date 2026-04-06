import { useRouter } from 'next/router'

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const { locale, pathname, asPath, query } = router

  const switchLocale = (code: string) => {
    router.push({ pathname, query }, asPath, { locale: code })
  }

  return (
    <div className="language-switcher">
      {LOCALES.map((loc, i) => (
        <span key={loc.code}>
          <button
            className={`lang-btn${locale === loc.code ? ' active' : ''}`}
            onClick={() => switchLocale(loc.code)}
            aria-label={`Switch to ${loc.label}`}
          >
            {loc.label}
          </button>
          {i < LOCALES.length - 1 && <span className="lang-sep">|</span>}
        </span>
      ))}
    </div>
  )
}
