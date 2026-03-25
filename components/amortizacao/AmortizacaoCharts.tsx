import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface ScheduleRow {
  month: number
  date: Date | string
  payment: number
  amortization: number
  extraAmortization: number
  interest: number
  correction: number
  insurance: number
  fgtsDiscount: number
  totalWithFgts: number
  total: number
  balance: number
}

// ─── BRL Formatter ───
function fmtBRL(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`
  return `R$ ${value.toFixed(0)}`
}

function fmtBRLFull(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Custom Tooltip ───
interface TooltipEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="am-chart-tooltip">
      <p className="am-chart-tooltip-label">Mes {label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="am-chart-tooltip-item" style={{ color: entry.color }}>
          {entry.name}: {fmtBRLFull(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Downsample helper: keep at most N evenly-spaced points ───
function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  const step = arr.length / max
  return Array.from({ length: max }, (_, i) => arr[Math.round(i * step)])
}

// ─── Chart 1: Payment Composition (amortizacao + juros + seguros) ───
interface AmortCompositionChartProps {
  schedule: ScheduleRow[]
  hasInsurance: boolean
  hasCorrection: boolean
}

export function AmortCompositionChart({ schedule, hasInsurance, hasCorrection }: AmortCompositionChartProps) {
  if (schedule.length === 0) return null

  const data = downsample(
    schedule.map(r => ({
      month: r.month,
      Amortizacao: r.amortization,
      Juros: r.interest,
      ...(hasCorrection && r.correction > 0 ? { Correcao: r.correction } : {}),
      ...(hasInsurance && r.insurance > 0 ? { Seguro: r.insurance } : {}),
    })),
    200
  )

  return (
    <div className="am-chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Mes', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}
          />
          {hasInsurance && (
            <Area
              type="monotone"
              dataKey="Seguro"
              stackId="1"
              stroke="var(--accent-pink)"
              fill="var(--accent-pink)"
              fillOpacity={0.4}
              strokeWidth={1.5}
            />
          )}
          {hasCorrection && (
            <Area
              type="monotone"
              dataKey="Correcao"
              stackId="1"
              stroke="var(--accent-green)"
              fill="var(--accent-green)"
              fillOpacity={0.4}
              strokeWidth={1.5}
            />
          )}
          <Area
            type="monotone"
            dataKey="Juros"
            stackId="1"
            stroke="var(--accent-orange)"
            fill="var(--accent-orange)"
            fillOpacity={0.5}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="Amortizacao"
            stackId="1"
            stroke="var(--accent-blue)"
            fill="var(--accent-blue)"
            fillOpacity={0.5}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart 2: Saldo Devedor Evolution ───
interface BalanceChartProps {
  schedule: ScheduleRow[]
}

export function BalanceChart({ schedule }: BalanceChartProps) {
  if (schedule.length === 0) return null

  const data = downsample(
    schedule.map(r => ({
      month: r.month,
      'Saldo Devedor': r.balance,
    })),
    200
  )

  return (
    <div className="am-chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Mes', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="Saldo Devedor"
            stroke="var(--accent-blue)"
            fill="var(--accent-blue)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart 3: Accumulated Total Cost ───
interface AccumulatedCostChartProps {
  schedule: ScheduleRow[]
}

export function AccumulatedCostChart({ schedule }: AccumulatedCostChartProps) {
  if (schedule.length === 0) return null

  let cumTotal = 0
  let cumInterest = 0
  let cumAmort = 0
  const data = downsample(
    schedule.map(r => {
      cumTotal += r.total
      cumInterest += r.interest
      cumAmort += r.amortization + r.extraAmortization
      return {
        month: r.month,
        'Total Pago': cumTotal,
        'Juros Acumulados': cumInterest,
        'Capital Amortizado': cumAmort,
      }
    }),
    200
  )

  return (
    <div className="am-chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Mes', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12, color: 'var(--text-secondary)' }} />
          <Line type="monotone" dataKey="Total Pago" stroke="var(--text-muted)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Juros Acumulados" stroke="var(--accent-orange)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Capital Amortizado" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart 4: Compare Balance Chart (multiple strategies) ───
interface CompareBalanceChartProps {
  schedules: ScheduleRow[][]
  names: string[]
}

const STRATEGY_COLORS = ['var(--accent-blue)', 'var(--accent-orange)', 'var(--accent-green)']

export function CompareBalanceChart({ schedules, names }: CompareBalanceChartProps) {
  if (schedules.every(s => s.length === 0)) return null

  const maxMonths = Math.max(...schedules.map(s => s.length))

  const data = Array.from({ length: maxMonths }, (_, i) => {
    const point: Record<string, number> = { month: i + 1 }
    schedules.forEach((sched, si) => {
      if (sched[i]) point[names[si]] = sched[i].balance
    })
    return point
  })

  const downsampled = downsample(data, 200)

  return (
    <div className="am-chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={downsampled} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Mes', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12, color: 'var(--text-secondary)' }} />
          {names.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={STRATEGY_COLORS[i] || '#888'}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart 5: SAC vs Price comparison (if applicable) ───
interface SacPriceCompareChartProps {
  sacSchedule: ScheduleRow[]
  priceSchedule: ScheduleRow[]
}

export function SacPriceCompareChart({ sacSchedule, priceSchedule }: SacPriceCompareChartProps) {
  if (sacSchedule.length === 0 && priceSchedule.length === 0) return null

  const maxMonths = Math.max(sacSchedule.length, priceSchedule.length)
  const data = Array.from({ length: maxMonths }, (_, i) => ({
    month: i + 1,
    ...(sacSchedule[i] ? { SAC: sacSchedule[i].total } : {}),
    ...(priceSchedule[i] ? { Price: priceSchedule[i].total } : {}),
  }))

  const downsampled = downsample(data, 200)

  return (
    <div className="am-chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={downsampled} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Mes', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12, color: 'var(--text-secondary)' }} />
          {sacSchedule.length > 0 && (
            <Line type="monotone" dataKey="SAC" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
          )}
          {priceSchedule.length > 0 && (
            <Line type="monotone" dataKey="Price" stroke="var(--accent-orange)" strokeWidth={2} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart 6: Investment Portfolio Growth (compare mode) ───
interface InvestmentGrowthChartProps {
  schedules: ScheduleRow[][]
  names: string[]
  investments: Array<{ monthlyGrowth?: number[] } | null>
}

export function InvestmentGrowthChart({ schedules, names, investments }: InvestmentGrowthChartProps) {
  const hasData = investments.some(inv => inv && inv.monthlyGrowth && inv.monthlyGrowth.length > 0)
  if (!hasData) return null

  const maxMonths = Math.max(...investments.map(inv => inv?.monthlyGrowth?.length ?? 0))
  const data = Array.from({ length: maxMonths }, (_, i) => {
    const point: Record<string, number> = { month: i + 1 }
    investments.forEach((inv, si) => {
      if (inv?.monthlyGrowth?.[i] !== undefined) {
        point[names[si]] = inv.monthlyGrowth[i]
      }
    })
    return point
  })

  const downsampled = downsample(data, 200)

  return (
    <div className="am-chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={downsampled} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12, color: 'var(--text-secondary)' }} />
          {names.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={STRATEGY_COLORS[i] || '#888'}
              fill={STRATEGY_COLORS[i] || '#888'}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
