import { useState, useEffect, useMemo, useCallback } from 'react'
import Head from 'next/head'
import { useTheme } from '../lib/use-theme'

const CATEGORIES = [
  { key: 'custo_carro', label: 'Financiamento', icon: '🚗', color: 'blue' },
  { key: 'combustivel_energia', label: 'Energia', icon: '⚡', color: 'green' },
  { key: 'tag_estacionamento', label: 'Tag / Estacionamento', icon: '🅿️', color: 'purple' },
  { key: 'limpeza', label: 'Limpeza', icon: '✨', color: 'teal' },
  { key: 'documentos_seguro', label: 'Documentos / Seguro', icon: '📄', color: 'orange' },
  { key: 'outros', label: 'Outros', icon: '📦', color: 'pink' }
]

const COLOR_MAP = {
  blue: '#4a9eff',
  green: '#34d399',
  purple: '#a78bfa',
  teal: '#6ed2b7',
  orange: '#fb923c',
  pink: '#f472b6'
}

const PERIODS = [
  { key: 'diaria', label: 'Diaria', suffix: 'por dia' },
  { key: 'mensal', label: 'Mensal', suffix: 'por mes' },
  { key: 'trimestral', label: 'Trimestral', suffix: 'por trimestre' },
  { key: 'semestral', label: 'Semestral', suffix: 'por semestre' },
  { key: 'anual', label: 'Anual', suffix: 'por ano' }
]

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function formatMonth(mes) {
  const [year, month] = mes.split('-')
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]
  return `${months[parseInt(month, 10) - 1]} ${year}`
}

function formatMonthShort(mes) {
  const [year, month] = mes.split('-')
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]
  return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`
}

function getDivisor(period, monthCount) {
  const map = {
    diaria: monthCount * 30,
    mensal: monthCount,
    trimestral: monthCount / 3,
    semestral: monthCount / 6,
    anual: monthCount / 12
  }
  return Math.max(map[period] || monthCount, 1)
}

function formatBRLCompact(value) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`
  }
  return `R$ ${Math.round(value)}`
}

// ─── SVG Chart ───
const CHART = { w: 800, h: 300, padL: 70, padR: 20, padT: 20, padB: 40 }

function EvolutionChart({ data, visibleCats, onHover, hoveredIndex }) {
  const plotW = CHART.w - CHART.padL - CHART.padR
  const plotH = CHART.h - CHART.padT - CHART.padB

  const maxVal = useMemo(() => {
    let max = 0
    for (const row of data) {
      for (const cat of CATEGORIES) {
        if (visibleCats.has(cat.key) && row[cat.key] > max) {
          max = row[cat.key]
        }
      }
    }
    return max * 1.1 || 100
  }, [data, visibleCats])

  if (data.length === 0) return null

  const xStep = data.length > 1 ? plotW / (data.length - 1) : plotW / 2

  const getX = (i) => CHART.padL + i * xStep
  const getY = (val) => CHART.padT + plotH - (val / maxVal) * plotH

  // Y-axis grid lines
  const gridCount = 5
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = (maxVal / gridCount) * i
    return { y: getY(val), label: formatBRLCompact(val) }
  })

  // Build polylines for each visible category
  const lines = CATEGORIES.filter((c) => visibleCats.has(c.key)).map((cat) => {
    const points = data.map((row, i) => `${getX(i)},${getY(row[cat.key])}`).join(' ')
    const areaPoints = [
      ...data.map((row, i) => `${getX(i)},${getY(row[cat.key])}`),
      `${getX(data.length - 1)},${getY(0)}`,
      `${getX(0)},${getY(0)}`
    ].join(' ')
    return { key: cat.key, color: COLOR_MAP[cat.color], points, areaPoints }
  })

  // Total line
  const totalPoints = data
    .map((row, i) => {
      const total = CATEGORIES.reduce(
        (sum, c) => sum + (visibleCats.has(c.key) ? row[c.key] : 0),
        0
      )
      return `${getX(i)},${getY(total)}`
    })
    .join(' ')

  const totalMax = Math.max(
    ...data.map((row) =>
      CATEGORIES.reduce((s, c) => s + (visibleCats.has(c.key) ? row[c.key] : 0), 0)
    )
  )
  // Rescale if total exceeds max
  const effectiveMax = Math.max(maxVal, totalMax * 1.1)
  const getYAdj = (val) => CHART.padT + plotH - (val / effectiveMax) * plotH

  // Rebuild with adjusted scale
  const adjGridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = (effectiveMax / gridCount) * i
    return { y: getYAdj(val), label: formatBRLCompact(val) }
  })

  const adjLines = CATEGORIES.filter((c) => visibleCats.has(c.key)).map((cat) => {
    const points = data.map((row, i) => `${getX(i)},${getYAdj(row[cat.key])}`).join(' ')
    const areaPoints = [
      ...data.map((row, i) => `${getX(i)},${getYAdj(row[cat.key])}`),
      `${getX(data.length - 1)},${getYAdj(0)}`,
      `${getX(0)},${getYAdj(0)}`
    ].join(' ')
    return { key: cat.key, color: COLOR_MAP[cat.color], points, areaPoints }
  })

  const adjTotalPoints = data
    .map((row, i) => {
      const total = CATEGORIES.reduce(
        (sum, c) => sum + (visibleCats.has(c.key) ? row[c.key] : 0),
        0
      )
      return `${getX(i)},${getYAdj(total)}`
    })
    .join(' ')

  // X-axis labels (show every N labels to avoid overlap)
  const labelEvery = Math.max(1, Math.ceil(data.length / 12))

  return (
    <div className="ev-chart-wrap">
      <svg
        className="ev-chart-svg"
        viewBox={`0 0 ${CHART.w} ${CHART.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {adjGridLines.map((g, i) => (
          <g key={i}>
            <line
              className="ev-chart-gridline"
              x1={CHART.padL}
              y1={g.y}
              x2={CHART.w - CHART.padR}
              y2={g.y}
            />
            <text className="ev-chart-label-y" x={CHART.padL - 8} y={g.y + 4} textAnchor="end">
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fills */}
        {adjLines.map((line) => (
          <polygon key={`area-${line.key}`} className="ev-chart-area" points={line.areaPoints} fill={line.color} />
        ))}

        {/* Lines */}
        {adjLines.map((line) => (
          <polyline
            key={`line-${line.key}`}
            className="ev-chart-line"
            points={line.points}
            stroke={line.color}
          />
        ))}

        {/* Total dashed line */}
        {visibleCats.size > 1 && (
          <polyline
            className="ev-chart-line ev-chart-line-total"
            points={adjTotalPoints}
          />
        )}

        {/* Data points */}
        {adjLines.map((line) =>
          data.map((row, i) => (
            <circle
              key={`dot-${line.key}-${i}`}
              cx={getX(i)}
              cy={getYAdj(row[CATEGORIES.find((c) => c.key === line.key)?.key] || 0)}
              r={hoveredIndex === i ? 4 : 2.5}
              fill={line.color}
              className="ev-chart-dot"
            />
          ))
        )}

        {/* X-axis labels */}
        {data.map((row, i) =>
          i % labelEvery === 0 ? (
            <text
              key={`xlabel-${i}`}
              className="ev-chart-label-x"
              x={getX(i)}
              y={CHART.h - 8}
              textAnchor="middle"
            >
              {formatMonthShort(row.mes)}
            </text>
          ) : null
        )}

        {/* Hover columns */}
        {data.map((_, i) => (
          <rect
            key={`hover-${i}`}
            x={getX(i) - xStep / 2}
            y={CHART.padT}
            width={xStep}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
          />
        ))}

        {/* Hover vertical line */}
        {hoveredIndex !== null && (
          <line
            className="ev-chart-hoverline"
            x1={getX(hoveredIndex)}
            y1={CHART.padT}
            x2={getX(hoveredIndex)}
            y2={CHART.padT + plotH}
          />
        )}
      </svg>
    </div>
  )
}

// ─── Tooltip ───
function ChartTooltip({ data, index, visibleCats, chartRef }) {
  if (index === null || !data[index]) return null
  const row = data[index]

  return (
    <div className="ev-chart-tooltip">
      <div className="ev-tooltip-month">{formatMonth(row.mes)}</div>
      {CATEGORIES.filter((c) => visibleCats.has(c.key)).map((cat) => (
        <div key={cat.key} className="ev-tooltip-row">
          <span className={`ev-tooltip-dot ${cat.color}`} />
          <span className="ev-tooltip-label">{cat.label}</span>
          <span className="ev-tooltip-value">{formatBRL(row[cat.key])}</span>
        </div>
      ))}
      <div className="ev-tooltip-row ev-tooltip-total">
        <span className="ev-tooltip-label">Total</span>
        <span className="ev-tooltip-value">
          {formatBRL(
            CATEGORIES.reduce((s, c) => s + (visibleCats.has(c.key) ? row[c.key] : 0), 0)
          )}
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ───
export default function EVStats() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [theme, toggleTheme] = useTheme()
  const [visibleCats, setVisibleCats] = useState(() => new Set(CATEGORIES.map((c) => c.key)))
  const [period, setPeriod] = useState('mensal')
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Restore preferences from localStorage
  useEffect(() => {
    try {
      const savedCats = localStorage.getItem('ev-visible-cats')
      if (savedCats) {
        const parsed = JSON.parse(savedCats)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleCats(new Set(parsed))
        }
      }
      const savedPeriod = localStorage.getItem('ev-period')
      if (savedPeriod && PERIODS.some((p) => p.key === savedPeriod)) {
        setPeriod(savedPeriod)
      }
    } catch (_) {}
  }, [])

  // Persist preferences
  const updateVisibleCats = useCallback((updater) => {
    setVisibleCats((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem('ev-visible-cats', JSON.stringify([...next]))
      return next
    })
  }, [])

  const updatePeriod = useCallback((p) => {
    setPeriod(p)
    localStorage.setItem('ev-period', p)
  }, [])

  // Fetch data
  useEffect(() => {
    fetch('/api/ev-stats')
      .then((r) => {
        if (!r.ok) throw new Error('Erro ao carregar dados')
        return r.json()
      })
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  // Toggle a category
  const toggleCategory = useCallback(
    (key) => {
      updateVisibleCats((prev) => {
        const next = new Set(prev)
        if (next.has(key)) {
          if (next.size > 1) next.delete(key) // keep at least one
        } else {
          next.add(key)
        }
        return next
      })
    },
    [updateVisibleCats]
  )

  // Computed values
  const totals = useMemo(() => {
    const acc = { total: 0 }
    CATEGORIES.forEach((cat) => {
      acc[cat.key] = 0
    })
    for (const row of data) {
      for (const cat of CATEGORIES) {
        acc[cat.key] += row[cat.key] || 0
      }
      acc.total += CATEGORIES.reduce(
        (s, c) => s + (visibleCats.has(c.key) ? (row[c.key] || 0) : 0),
        0
      )
    }
    return acc
  }, [data, visibleCats])

  const visibleTotal = useMemo(() => {
    return data.reduce(
      (sum, row) =>
        sum + CATEGORIES.reduce((s, c) => s + (visibleCats.has(c.key) ? (row[c.key] || 0) : 0), 0),
      0
    )
  }, [data, visibleCats])

  const divisor = getDivisor(period, data.length)
  const currentPeriod = PERIODS.find((p) => p.key === period)

  const maxMonthlyTotal = useMemo(() => {
    return Math.max(
      ...data.map((row) =>
        CATEGORIES.reduce((s, c) => s + (visibleCats.has(c.key) ? (row[c.key] || 0) : 0), 0)
      ),
      1
    )
  }, [data, visibleCats])

  return (
    <>
      <Head>
        <title>EV Dashboard — Carro Eletrico</title>
        <meta name="description" content="Estatisticas de uso do carro eletrico" />
      </Head>

      <div className="ev-page">
        {/* Header */}
        <header className="ev-header">
          <div className="ev-header-left">
            <a href="/" className="ev-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <div>
              <h1 className="ev-title">EV Dashboard</h1>
              <p className="ev-subtitle">Custos do carro eletrico</p>
            </div>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </header>

        {loading && (
          <div className="ev-loading">
            <div className="ev-spinner" />
            <p>Carregando dados...</p>
          </div>
        )}

        {error && (
          <div className="ev-error">
            <p>Erro: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Period Selector */}
            <div className="ev-period-bar-wrapper">
              <div className="ev-period-bar">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    className={`ev-period-tag${period === p.key ? ' active' : ''}`}
                    onClick={() => updatePeriod(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="ev-summary">
              <div className="ev-summary-card ev-summary-highlight">
                <span className="ev-summary-label">Total Geral</span>
                <span className="ev-summary-value">{formatBRL(visibleTotal)}</span>
                <span className="ev-summary-meta">{data.length} meses registrados</span>
              </div>
              <div className="ev-summary-card">
                <span className="ev-summary-label">Media {currentPeriod?.label}</span>
                <span className="ev-summary-value">
                  {formatBRL(visibleTotal / divisor)}
                </span>
                <span className="ev-summary-meta">{currentPeriod?.suffix}</span>
              </div>
            </div>

            {/* Category Breakdown */}
            <section className="ev-section">
              <h2 className="ev-section-title">Por Categoria</h2>
              <div className="ev-categories">
                {CATEGORIES.map((cat) => {
                  const val = totals[cat.key] || 0
                  const allTotal = CATEGORIES.reduce((s, c) => s + (totals[c.key] || 0), 0)
                  const pct = allTotal > 0 ? (val / allTotal) * 100 : 0
                  const avg = val / divisor
                  const isVisible = visibleCats.has(cat.key)
                  return (
                    <div
                      key={cat.key}
                      className={`ev-cat-card${!isVisible ? ' ev-cat-dimmed' : ''}`}
                      onClick={() => toggleCategory(cat.key)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleCategory(cat.key)}
                    >
                      <div className="ev-cat-header">
                        <span className="ev-cat-icon">{cat.icon}</span>
                        <span className="ev-cat-label">{cat.label}</span>
                      </div>
                      <span className="ev-cat-value">{formatBRL(val)}</span>
                      <div className="ev-cat-bar-track">
                        <div
                          className={`ev-cat-bar-fill ${cat.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="ev-cat-footer">
                        <span className="ev-cat-pct">{pct.toFixed(1)}%</span>
                        <span className="ev-cat-avg">
                          {formatBRL(avg)} {currentPeriod?.suffix}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Interactive Legend */}
            <div className="ev-legend">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  className={`ev-legend-btn${!visibleCats.has(cat.key) ? ' hidden' : ''}`}
                  onClick={() => toggleCategory(cat.key)}
                >
                  <span className={`ev-legend-dot ${cat.color}`} />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Evolution Chart */}
            <section className="ev-section">
              <h2 className="ev-section-title">Evolucao Mensal</h2>
              <div className="ev-chart-container">
                <EvolutionChart
                  data={data}
                  visibleCats={visibleCats}
                  onHover={setHoveredIndex}
                  hoveredIndex={hoveredIndex}
                />
                <ChartTooltip
                  data={data}
                  index={hoveredIndex}
                  visibleCats={visibleCats}
                />
              </div>
            </section>

            {/* Monthly Timeline */}
            <section className="ev-section">
              <h2 className="ev-section-title">Timeline Mensal</h2>
              <div className="ev-timeline">
                {[...data].reverse().map((row) => {
                  const total = CATEGORIES.reduce(
                    (s, c) => s + (visibleCats.has(c.key) ? (row[c.key] || 0) : 0),
                    0
                  )
                  const barPct = (total / maxMonthlyTotal) * 100
                  return (
                    <div key={row.mes} className="ev-month-row">
                      <span className="ev-month-label">{formatMonth(row.mes)}</span>
                      <div className="ev-month-bar-track">
                        <div className="ev-month-bar-fill" style={{ width: `${barPct}%` }}>
                          {CATEGORIES.filter((c) => visibleCats.has(c.key)).map((cat) => {
                            const catVal = row[cat.key] || 0
                            const catPct = total > 0 ? (catVal / total) * 100 : 0
                            if (catPct < 1) return null
                            return (
                              <div
                                key={cat.key}
                                className={`ev-month-segment ${cat.color}`}
                                style={{ width: `${catPct}%` }}
                                title={`${cat.label}: ${formatBRL(catVal)}`}
                              />
                            )
                          })}
                        </div>
                      </div>
                      <span className="ev-month-value">{formatBRL(total)}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Detail Table */}
            <section className="ev-section">
              <h2 className="ev-section-title">Detalhamento</h2>
              <div className="ev-table-wrap">
                <table className="ev-table">
                  <thead>
                    <tr>
                      <th>Mes</th>
                      {CATEGORIES.filter((c) => visibleCats.has(c.key)).map((c) => (
                        <th key={c.key}>
                          <span className="ev-th-icon">{c.icon}</span>
                          {c.label}
                        </th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data].reverse().map((row) => {
                      const total = CATEGORIES.reduce(
                        (s, c) => s + (visibleCats.has(c.key) ? (row[c.key] || 0) : 0),
                        0
                      )
                      return (
                        <tr key={row.mes}>
                          <td className="ev-td-month">{formatMonth(row.mes)}</td>
                          {CATEGORIES.filter((c) => visibleCats.has(c.key)).map((cat) => (
                            <td key={cat.key}>{formatBRL(row[cat.key] || 0)}</td>
                          ))}
                          <td className="ev-td-total">{formatBRL(total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  )
}
