interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        style={{ color: '#ef4444', flexShrink: 0 }}
      >
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 12v10M20 26v2"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <p
        style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--text-secondary)',
          maxWidth: '320px',
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '4px',
            padding: '8px 20px',
            background: 'var(--bg-tag)',
            border: '1px solid var(--border-card)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
