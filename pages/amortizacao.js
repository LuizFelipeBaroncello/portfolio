import { useState, useMemo, useCallback } from 'react'
import Head from 'next/head'
import { useTheme } from '../lib/use-theme'

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatMonth(date) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function toMonthlyRate(rate, type) {
  const r = rate / 100
  if (type === 'mensal') return r
  return Math.pow(1 + r, 1 / 12) - 1
}

function generateSchedule({ loanAmount, startDate, system, interestRate, rateType, installments, plans, correction, insurance }) {
  const monthlyRate = toMonthlyRate(interestRate, rateType)
  const correctionMonthlyRate = correction.enabled ? toMonthlyRate(correction.rate, correction.rateType) : 0

  const schedule = []
  let balance = loanAmount

  // Price: fixed payment (before extras)
  const pricePayment = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1)
    : loanAmount / installments

  for (let i = 1; i <= installments; i++) {
    if (balance <= 0.01) break

    // Apply correction to balance
    const correctionAmount = balance * correctionMonthlyRate
    balance += correctionAmount

    // Interest on current balance
    const interest = balance * monthlyRate

    // Base amortization
    let baseAmort
    if (system === 'sac') {
      baseAmort = loanAmount / installments
    } else {
      baseAmort = pricePayment - interest
    }

    // Extra payments from plans
    let extraPayment = 0
    for (const plan of plans) {
      if (plan.type === 'unico' && i === plan.month) {
        extraPayment += plan.amount
      } else if (plan.type === 'mensal') {
        extraPayment += plan.amount
      } else if (plan.type === 'periodico' && plan.frequency > 0 && i % plan.frequency === 0) {
        extraPayment += plan.amount
      }
    }

    // Insurance
    let insuranceAmount = 0
    if (insurance.enabled) {
      if (insurance.type === 'fixo') {
        insuranceAmount = insurance.value
      } else {
        insuranceAmount = balance * (insurance.value / 100)
      }
    }

    // Make sure amortization doesn't exceed balance
    let totalAmort = Math.min(baseAmort + extraPayment, balance)
    let payment = interest + totalAmort + insuranceAmount + correctionAmount

    balance = Math.max(balance - totalAmort, 0)

    const paymentDate = addMonths(new Date(startDate), i)

    schedule.push({
      month: i,
      date: paymentDate,
      balance: balance,
      amortization: totalAmort,
      interest,
      correction: correctionAmount,
      insurance: insuranceAmount,
      extraPayment: Math.min(extraPayment, totalAmort - (totalAmort - extraPayment > 0 ? totalAmort - extraPayment : 0)),
      payment,
    })
  }

  return schedule
}

// ─── SVG Mini Chart ───
function AmortChart({ schedule }) {
  if (schedule.length === 0) return null

  const W = 800, H = 260, padL = 65, padR = 20, padT = 20, padB = 35
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const maxPayment = Math.max(...schedule.map(r => r.payment))
  const maxBalance = Math.max(...schedule.map(r => r.balance), schedule.length > 0 ? schedule[0].amortization + schedule[0].balance : 0)
  const effectiveMax = Math.max(maxPayment, 1)

  const getX = (i) => padL + (i / (schedule.length - 1 || 1)) * plotW
  const getY = (val) => padT + plotH - (val / effectiveMax) * plotH

  const interestPoints = schedule.map((r, i) => `${getX(i)},${getY(r.interest)}`).join(' ')
  const amortPoints = schedule.map((r, i) => `${getX(i)},${getY(r.amortization)}`).join(' ')
  const paymentPoints = schedule.map((r, i) => `${getX(i)},${getY(r.payment)}`).join(' ')

  const interestArea = [
    ...schedule.map((r, i) => `${getX(i)},${getY(r.interest)}`),
    `${getX(schedule.length - 1)},${getY(0)}`,
    `${getX(0)},${getY(0)}`
  ].join(' ')

  const amortArea = [
    ...schedule.map((r, i) => `${getX(i)},${getY(r.amortization)}`),
    `${getX(schedule.length - 1)},${getY(0)}`,
    `${getX(0)},${getY(0)}`
  ].join(' ')

  const gridCount = 4
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = (effectiveMax / gridCount) * i
    return { y: getY(val), label: val >= 1000 ? `R$ ${(val / 1000).toFixed(1)}k` : `R$ ${Math.round(val)}` }
  })

  const labelEvery = Math.max(1, Math.ceil(schedule.length / 12))

  return (
    <div className="am-chart-wrap">
      <svg className="am-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {gridLines.map((g, i) => (
          <g key={i}>
            <line className="am-chart-gridline" x1={padL} y1={g.y} x2={W - padR} y2={g.y} />
            <text className="am-chart-label-y" x={padL - 8} y={g.y + 4} textAnchor="end">{g.label}</text>
          </g>
        ))}
        <polygon className="am-chart-area" points={interestArea} fill="var(--accent-orange)" />
        <polygon className="am-chart-area" points={amortArea} fill="var(--accent-blue)" />
        <polyline className="am-chart-line" points={interestPoints} stroke="var(--accent-orange)" />
        <polyline className="am-chart-line" points={amortPoints} stroke="var(--accent-blue)" />
        <polyline className="am-chart-line am-chart-line-total" points={paymentPoints} />
        {schedule.map((r, i) =>
          i % labelEvery === 0 ? (
            <text key={i} className="am-chart-label-x" x={getX(i)} y={H - 8} textAnchor="middle">
              {r.month}
            </text>
          ) : null
        )}
      </svg>
      <div className="am-chart-legend">
        <span className="am-legend-item"><span className="am-legend-dot" style={{ background: 'var(--accent-blue)' }} /> Amortizacao</span>
        <span className="am-legend-item"><span className="am-legend-dot" style={{ background: 'var(--accent-orange)' }} /> Juros</span>
        <span className="am-legend-item"><span className="am-legend-dot am-legend-dot-dashed" /> Parcela Total</span>
      </div>
    </div>
  )
}

// ─── Main Page ───
export default function Amortizacao() {
  const [theme, toggleTheme] = useTheme()

  // Form state
  const [loanAmount, setLoanAmount] = useState(300000)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [system, setSystem] = useState('sac')
  const [interestRate, setInterestRate] = useState(10)
  const [rateType, setRateType] = useState('anual')
  const [installments, setInstallments] = useState(360)

  // Extra configs
  const [correction, setCorrection] = useState({ enabled: false, rate: 0, rateType: 'anual' })
  const [insurance, setInsurance] = useState({ enabled: false, type: 'fixo', value: 0 })

  // Amortization plans
  const [plans, setPlans] = useState([])
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [newPlan, setNewPlan] = useState({ type: 'mensal', amount: 500, month: 12, frequency: 6 })

  // Table visibility
  const [showTable, setShowTable] = useState(false)

  const addPlan = useCallback(() => {
    setPlans(prev => [...prev, { ...newPlan, id: Date.now() }])
    setShowPlanForm(false)
    setNewPlan({ type: 'mensal', amount: 500, month: 12, frequency: 6 })
  }, [newPlan])

  const removePlan = useCallback((id) => {
    setPlans(prev => prev.filter(p => p.id !== id))
  }, [])

  // Generate schedule
  const schedule = useMemo(() => {
    if (!loanAmount || !installments || !interestRate) return []
    return generateSchedule({
      loanAmount,
      startDate,
      system,
      interestRate,
      rateType,
      installments,
      plans,
      correction,
      insurance,
    })
  }, [loanAmount, startDate, system, interestRate, rateType, installments, plans, correction, insurance])

  // Summary
  const summary = useMemo(() => {
    if (schedule.length === 0) return null
    const totalPaid = schedule.reduce((s, r) => s + r.payment, 0)
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0)
    const totalCorrection = schedule.reduce((s, r) => s + r.correction, 0)
    const totalInsurance = schedule.reduce((s, r) => s + r.insurance, 0)
    const firstPayment = schedule[0].payment
    const lastPayment = schedule[schedule.length - 1].payment
    const lastDate = schedule[schedule.length - 1].date
    const effectiveInstallments = schedule.length

    return {
      totalPaid,
      totalInterest,
      totalCorrection,
      totalInsurance,
      firstPayment,
      lastPayment,
      lastDate,
      effectiveInstallments,
    }
  }, [schedule])

  const planTypeLabel = (type) => {
    const map = { unico: 'Pagamento Unico', mensal: 'Pagamento Mensal', periodico: 'Pagamento Periodico' }
    return map[type] || type
  }

  const planDescription = (plan) => {
    if (plan.type === 'unico') return `${formatBRL(plan.amount)} no mes ${plan.month}`
    if (plan.type === 'mensal') return `${formatBRL(plan.amount)} por mes`
    if (plan.type === 'periodico') return `${formatBRL(plan.amount)} a cada ${plan.frequency} meses`
    return ''
  }

  return (
    <>
      <Head>
        <title>Simulador de Amortizacao</title>
        <meta name="description" content="Simulador de amortizacao de financiamentos - SAC e Price" />
      </Head>

      <div className="am-page">
        {/* Header */}
        <header className="ev-header">
          <div className="ev-header-left">
            <a href="/" className="ev-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <div>
              <h1 className="ev-title">Simulador de Amortizacao</h1>
              <p className="ev-subtitle">Financiamentos SAC e Price</p>
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

        {/* ─── Config Section ─── */}
        <section className="am-section">
          <h2 className="ev-section-title">Dados do Financiamento</h2>
          <div className="am-form-grid">
            <div className="am-field">
              <label className="am-label">Valor do Emprestimo</label>
              <div className="am-input-prefix-wrap">
                <span className="am-input-prefix">R$</span>
                <input
                  type="number"
                  className="am-input am-input-with-prefix"
                  value={loanAmount}
                  onChange={e => setLoanAmount(Number(e.target.value))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>
            <div className="am-field">
              <label className="am-label">Data de Inicio</label>
              <input
                type="date"
                className="am-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="am-field">
              <label className="am-label">Sistema de Amortizacao</label>
              <div className="am-toggle-group">
                <button className={`am-toggle-btn${system === 'sac' ? ' active' : ''}`} onClick={() => setSystem('sac')}>SAC</button>
                <button className={`am-toggle-btn${system === 'price' ? ' active' : ''}`} onClick={() => setSystem('price')}>Price</button>
              </div>
            </div>
            <div className="am-field">
              <label className="am-label">Taxa de Juros (%)</label>
              <div className="am-input-row">
                <input
                  type="number"
                  className="am-input"
                  value={interestRate}
                  onChange={e => setInterestRate(Number(e.target.value))}
                  min={0}
                  step={0.01}
                />
                <div className="am-toggle-group am-toggle-small">
                  <button className={`am-toggle-btn${rateType === 'anual' ? ' active' : ''}`} onClick={() => setRateType('anual')}>a.a.</button>
                  <button className={`am-toggle-btn${rateType === 'mensal' ? ' active' : ''}`} onClick={() => setRateType('mensal')}>a.m.</button>
                </div>
              </div>
            </div>
            <div className="am-field">
              <label className="am-label">Quantidade de Parcelas</label>
              <input
                type="number"
                className="am-input"
                value={installments}
                onChange={e => setInstallments(Number(e.target.value))}
                min={1}
                max={600}
              />
            </div>
            <div className="am-field">
              <label className="am-label">Taxa Mensal Efetiva</label>
              <div className="am-computed-value">
                {(toMonthlyRate(interestRate, rateType) * 100).toFixed(4)}% a.m.
              </div>
            </div>
          </div>
        </section>

        {/* ─── Correction & Insurance ─── */}
        <section className="am-section">
          <h2 className="ev-section-title">Correcao e Taxas</h2>
          <div className="am-extras-grid">
            {/* Correction */}
            <div className="am-extra-card">
              <div className="am-extra-header">
                <label className="am-switch">
                  <input type="checkbox" checked={correction.enabled} onChange={e => setCorrection(prev => ({ ...prev, enabled: e.target.checked }))} />
                  <span className="am-switch-slider" />
                </label>
                <span className="am-extra-title">Correcao Monetaria</span>
              </div>
              {correction.enabled && (
                <div className="am-extra-body">
                  <div className="am-field">
                    <label className="am-label-sm">Taxa (%)</label>
                    <div className="am-input-row">
                      <input
                        type="number"
                        className="am-input am-input-sm"
                        value={correction.rate}
                        onChange={e => setCorrection(prev => ({ ...prev, rate: Number(e.target.value) }))}
                        min={0}
                        step={0.01}
                      />
                      <div className="am-toggle-group am-toggle-small">
                        <button className={`am-toggle-btn${correction.rateType === 'anual' ? ' active' : ''}`} onClick={() => setCorrection(prev => ({ ...prev, rateType: 'anual' }))}>a.a.</button>
                        <button className={`am-toggle-btn${correction.rateType === 'mensal' ? ' active' : ''}`} onClick={() => setCorrection(prev => ({ ...prev, rateType: 'mensal' }))}>a.m.</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Insurance */}
            <div className="am-extra-card">
              <div className="am-extra-header">
                <label className="am-switch">
                  <input type="checkbox" checked={insurance.enabled} onChange={e => setInsurance(prev => ({ ...prev, enabled: e.target.checked }))} />
                  <span className="am-switch-slider" />
                </label>
                <span className="am-extra-title">Seguro / Taxa</span>
              </div>
              {insurance.enabled && (
                <div className="am-extra-body">
                  <div className="am-field">
                    <label className="am-label-sm">Tipo</label>
                    <div className="am-toggle-group am-toggle-small">
                      <button className={`am-toggle-btn${insurance.type === 'fixo' ? ' active' : ''}`} onClick={() => setInsurance(prev => ({ ...prev, type: 'fixo' }))}>Valor Fixo</button>
                      <button className={`am-toggle-btn${insurance.type === 'percentual' ? ' active' : ''}`} onClick={() => setInsurance(prev => ({ ...prev, type: 'percentual' }))}>% Saldo</button>
                    </div>
                  </div>
                  <div className="am-field">
                    <label className="am-label-sm">{insurance.type === 'fixo' ? 'Valor (R$)' : 'Percentual (%)'}</label>
                    <input
                      type="number"
                      className="am-input am-input-sm"
                      value={insurance.value}
                      onChange={e => setInsurance(prev => ({ ...prev, value: Number(e.target.value) }))}
                      min={0}
                      step={insurance.type === 'fixo' ? 1 : 0.01}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Amortization Plans ─── */}
        <section className="am-section">
          <div className="am-section-header">
            <h2 className="ev-section-title">Plano de Amortizacao Extra</h2>
            <button className="am-btn am-btn-outline" onClick={() => setShowPlanForm(!showPlanForm)}>
              {showPlanForm ? 'Cancelar' : '+ Adicionar'}
            </button>
          </div>

          {showPlanForm && (
            <div className="am-plan-form">
              <div className="am-field">
                <label className="am-label-sm">Tipo</label>
                <div className="am-toggle-group">
                  <button className={`am-toggle-btn${newPlan.type === 'unico' ? ' active' : ''}`} onClick={() => setNewPlan(p => ({ ...p, type: 'unico' }))}>Unico</button>
                  <button className={`am-toggle-btn${newPlan.type === 'mensal' ? ' active' : ''}`} onClick={() => setNewPlan(p => ({ ...p, type: 'mensal' }))}>Mensal</button>
                  <button className={`am-toggle-btn${newPlan.type === 'periodico' ? ' active' : ''}`} onClick={() => setNewPlan(p => ({ ...p, type: 'periodico' }))}>Periodico</button>
                </div>
              </div>
              <div className="am-plan-form-row">
                <div className="am-field">
                  <label className="am-label-sm">Valor (R$)</label>
                  <input
                    type="number"
                    className="am-input am-input-sm"
                    value={newPlan.amount}
                    onChange={e => setNewPlan(p => ({ ...p, amount: Number(e.target.value) }))}
                    min={0}
                    step={100}
                  />
                </div>
                {newPlan.type === 'unico' && (
                  <div className="am-field">
                    <label className="am-label-sm">No mes</label>
                    <input
                      type="number"
                      className="am-input am-input-sm"
                      value={newPlan.month}
                      onChange={e => setNewPlan(p => ({ ...p, month: Number(e.target.value) }))}
                      min={1}
                      max={installments}
                    />
                  </div>
                )}
                {newPlan.type === 'periodico' && (
                  <div className="am-field">
                    <label className="am-label-sm">A cada X meses</label>
                    <input
                      type="number"
                      className="am-input am-input-sm"
                      value={newPlan.frequency}
                      onChange={e => setNewPlan(p => ({ ...p, frequency: Number(e.target.value) }))}
                      min={1}
                    />
                  </div>
                )}
              </div>
              <button className="am-btn am-btn-primary" onClick={addPlan}>Adicionar Plano</button>
            </div>
          )}

          {plans.length > 0 && (
            <div className="am-plans-list">
              {plans.map(plan => (
                <div key={plan.id} className="am-plan-item">
                  <div className="am-plan-info">
                    <span className="am-plan-type">{planTypeLabel(plan.type)}</span>
                    <span className="am-plan-desc">{planDescription(plan)}</span>
                  </div>
                  <button className="am-plan-remove" onClick={() => removePlan(plan.id)} aria-label="Remover plano">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {plans.length === 0 && !showPlanForm && (
            <p className="am-empty-text">Nenhum plano de amortizacao extra adicionado.</p>
          )}
        </section>

        {/* ─── Dashboard ─── */}
        {summary && (
          <>
            <section className="am-section">
              <h2 className="ev-section-title">Resumo do Financiamento</h2>
              <div className="am-dashboard">
                <div className="am-dash-card am-dash-highlight">
                  <span className="am-dash-label">Valor Emprestado</span>
                  <span className="am-dash-value">{formatBRL(loanAmount)}</span>
                </div>
                <div className="am-dash-card">
                  <span className="am-dash-label">Total a Pagar</span>
                  <span className="am-dash-value">{formatBRL(summary.totalPaid)}</span>
                </div>
                <div className="am-dash-card">
                  <span className="am-dash-label">Total de Juros</span>
                  <span className="am-dash-value am-dash-value-orange">{formatBRL(summary.totalInterest)}</span>
                  <span className="am-dash-meta">{((summary.totalInterest / loanAmount) * 100).toFixed(1)}% do emprestimo</span>
                </div>
                {correction.enabled && summary.totalCorrection > 0 && (
                  <div className="am-dash-card">
                    <span className="am-dash-label">Total Correcao</span>
                    <span className="am-dash-value">{formatBRL(summary.totalCorrection)}</span>
                  </div>
                )}
                {insurance.enabled && summary.totalInsurance > 0 && (
                  <div className="am-dash-card">
                    <span className="am-dash-label">Total Seguro/Taxa</span>
                    <span className="am-dash-value">{formatBRL(summary.totalInsurance)}</span>
                  </div>
                )}
                <div className="am-dash-card">
                  <span className="am-dash-label">Primeira Parcela</span>
                  <span className="am-dash-value">{formatBRL(summary.firstPayment)}</span>
                </div>
                <div className="am-dash-card">
                  <span className="am-dash-label">Ultima Parcela</span>
                  <span className="am-dash-value">{formatBRL(summary.lastPayment)}</span>
                  <span className="am-dash-meta">{formatDate(summary.lastDate)}</span>
                </div>
                <div className="am-dash-card">
                  <span className="am-dash-label">Parcelas Efetivas</span>
                  <span className="am-dash-value">{summary.effectiveInstallments}</span>
                  <span className="am-dash-meta">
                    {summary.effectiveInstallments < installments
                      ? `${installments - summary.effectiveInstallments} parcelas economizadas`
                      : `${Math.floor(summary.effectiveInstallments / 12)} anos e ${summary.effectiveInstallments % 12} meses`
                    }
                  </span>
                </div>
                <div className="am-dash-card">
                  <span className="am-dash-label">Sistema</span>
                  <span className="am-dash-value am-dash-value-sm">{system === 'sac' ? 'SAC' : 'Price'}</span>
                  <span className="am-dash-meta">{system === 'sac' ? 'Amortizacao Constante' : 'Parcela Constante'}</span>
                </div>
              </div>
            </section>

            {/* ─── Chart ─── */}
            <section className="am-section">
              <h2 className="ev-section-title">Evolucao das Parcelas</h2>
              <AmortChart schedule={schedule} />
            </section>

            {/* ─── Table ─── */}
            <section className="am-section">
              <div className="am-section-header">
                <h2 className="ev-section-title">Tabela de Amortizacao</h2>
                <button className="am-btn am-btn-outline" onClick={() => setShowTable(!showTable)}>
                  {showTable ? 'Ocultar' : 'Mostrar Tabela'}
                </button>
              </div>
              {showTable && (
                <div className="ev-table-wrap">
                  <table className="ev-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Data</th>
                        <th>Parcela</th>
                        <th>Amortizacao</th>
                        <th>Juros</th>
                        {correction.enabled && <th>Correcao</th>}
                        {insurance.enabled && <th>Seguro/Taxa</th>}
                        <th>Saldo Devedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row) => (
                        <tr key={row.month}>
                          <td className="ev-td-month">{row.month}</td>
                          <td>{formatMonth(row.date)}</td>
                          <td className="ev-td-total">{formatBRL(row.payment)}</td>
                          <td>{formatBRL(row.amortization)}</td>
                          <td>{formatBRL(row.interest)}</td>
                          {correction.enabled && <td>{formatBRL(row.correction)}</td>}
                          {insurance.enabled && <td>{formatBRL(row.insurance)}</td>}
                          <td>{formatBRL(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  )
}
