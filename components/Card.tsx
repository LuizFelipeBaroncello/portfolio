import { ReactNode } from 'react'

interface CardProps {
  children?: ReactNode
  className?: string
  isFiltered?: boolean
  accent?: string
}

export default function Card({
  children,
  className = '',
  isFiltered = false,
  accent = 'blue',
}: CardProps) {
  const classes = [
    'card',
    className,
    isFiltered ? 'filtered-out' : 'filtered-in',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className={`card-accent ${accent}`} />
      <div className="card-inner">{children}</div>
    </div>
  )
}
