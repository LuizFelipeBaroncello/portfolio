import { useTranslation } from 'next-i18next/pages'

interface BioCardProps {
  isFiltered?: boolean
}

export default function BioCard({ isFiltered }: BioCardProps) {
  const { t } = useTranslation('common')

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
          <p
            className="bio-intro"
            dangerouslySetInnerHTML={{ __html: t('bio.intro') }}
          />
        </div>
      </div>
    </div>
  )
}
