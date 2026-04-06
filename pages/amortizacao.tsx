import React, { useState, useMemo, useCallback, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import type { GetStaticProps } from 'next'
import { useTheme } from '../lib/use-theme'
import {
  formatBRL,
  formatDate,
  formatMonth,
  addMonths,
  toMonthlyRate,
  generateSchedule,
  calculateInvestment,
  calcSummary,
  planTypeLabel,
  planDescription,
} from '../lib/amortizacao'
import {
  validateLoanAmount,
  validateRate,
  validateTerm,
  validateExtraPayment,
} from '../lib/amortizacao/validation'
import {
  AmortCompositionChart,
  BalanceChart,
  AccumulatedCostChart,
  CompareBalanceChart as RechartsCompareBalanceChart,
} from '../components/amortizacao/AmortizacaoCharts'

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

interface AmortPlan {
  id: number
  type: string
  amount: number
  month: number
  frequency: number
  amortizeDiscount: boolean
  recurring: boolean
}

interface Strategy {
  id: number
  name: string
  plans: AmortPlan[]
}

// ─── Main Page ───
export default function Amortizacao() {
  const { t } = useTranslation('common')
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
  const [newPlan, setNewPlan] = useState({ type: 'mensal', amount: 500, month: 12, frequency: 6, amortizeDiscount: false, recurring: false })
  const [editingPlanId, setEditingPlanId] = useState(null)

  // Table visibility
  const [showTable, setShowTable] = useState(false)

  // Calculation error
  const [calcError, setCalcError] = useState<string | null>(null)

  // Field validation errors/warnings
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [warnings, setWarnings] = useState<Record<string, string | undefined>>({})

  const setFieldValidation = useCallback((field: string, value: number, validator: (v: number) => { valid: boolean; message?: string }, warnOnly = false) => {
    const result = validator(value)
    if (!result.valid) {
      setErrors(prev => ({ ...prev, [field]: result.message }))
      setWarnings(prev => ({ ...prev, [field]: undefined }))
    } else if (result.message) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
      setWarnings(prev => ({ ...prev, [field]: result.message }))
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }))
      setWarnings(prev => ({ ...prev, [field]: undefined }))
    }
  }, [])

  const hasErrors = Object.values(errors).some(Boolean)

  // Compare mode
  const [compareMode, setCompareMode] = useState(false)
  const [strategies, setStrategies] = useState([
    { id: 1, name: 'Estrategia 1', plans: [] },
    { id: 2, name: 'Estrategia 2', plans: [] },
  ])
  const [investment, setInvestment] = useState({ enabled: false, rate: 12, rateType: 'anual', includeMonthly: false })
  const [showCompareTable, setShowCompareTable] = useState(false)

  const addPlan = useCallback(() => {
    // Validate FGTS parcela: no overlap within 12 months (skip if recurring)
    if (newPlan.type === 'fgts_parcela' && !newPlan.recurring) {
      const overlap = plans.find(p => p.type === 'fgts_parcela' && p.id !== editingPlanId &&
        !(newPlan.month >= p.month + 12 || newPlan.month + 12 <= p.month))
      if (overlap) {
        alert('Ja existe um FGTS Parcelas ativo nesse periodo. O intervalo minimo e de 12 meses.')
        return
      }
    }
    // Validate FGTS saldo: minimum 24 months apart (skip if recurring)
    if (newPlan.type === 'fgts_saldo' && !newPlan.recurring) {
      const tooClose = plans.find(p => p.type === 'fgts_saldo' && p.id !== editingPlanId &&
        Math.abs(newPlan.month - p.month) < 24)
      if (tooClose) {
        alert('FGTS Saldo Devedor so pode ser usado a cada 24 meses.')
        return
      }
    }
    if (editingPlanId) {
      setPlans(prev => prev.map(p => p.id === editingPlanId ? { ...newPlan, id: editingPlanId } : p))
      setEditingPlanId(null)
    } else {
      setPlans(prev => [...prev, { ...newPlan, id: Date.now() }])
    }
    setShowPlanForm(false)
    setNewPlan({ type: 'mensal', amount: 500, month: 12, frequency: 6, amortizeDiscount: false, recurring: false })
  }, [newPlan, plans, editingPlanId])

  const editPlan = useCallback((plan) => {
    setNewPlan({ type: plan.type, amount: plan.amount, month: plan.month, frequency: plan.frequency, amortizeDiscount: plan.amortizeDiscount, recurring: plan.recurring || false })
    setEditingPlanId(plan.id)
    setShowPlanForm(true)
  }, [])

  const removePlan = useCallback((id) => {
    setPlans(prev => prev.filter(p => p.id !== id))
  }, [])

  // Generate schedule
  const schedule = useMemo(() => {
    if (!loanAmount || !installments || !interestRate) return []
    if (hasErrors) return []
    try {
      const result = generateSchedule({
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
      setCalcError(null)
      return result
    } catch (err: any) {
      setCalcError(err?.message || 'Erro inesperado ao calcular o financiamento.')
      return []
    }
  }, [loanAmount, startDate, system, interestRate, rateType, installments, plans, correction, insurance])

  // Summary
  const summary = useMemo(() => {
    if (schedule.length === 0) return null
    const totalPaid = schedule.reduce((s, r) => s + r.total, 0)
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0)
    const totalCorrection = schedule.reduce((s, r) => s + r.correction, 0)
    const totalInsurance = schedule.reduce((s, r) => s + r.insurance, 0)
    const totalFgts = schedule.reduce((s, r) => s + r.fgtsDiscount, 0)
    const totalExtra = schedule.reduce((s, r) => s + r.extraAmortization, 0)
    const firstPayment = schedule[0].total
    const lastPayment = schedule[schedule.length - 1].total
    const lastDate = schedule[schedule.length - 1].date
    const effectiveInstallments = schedule.length

    return {
      totalPaid,
      totalInterest,
      totalCorrection,
      totalInsurance,
      totalFgts,
      totalExtra,
      firstPayment,
      lastPayment,
      lastDate,
      effectiveInstallments,
    }
  }, [schedule])

  // Compare mode: generate schedules and summaries for each strategy
  const baseParams = { loanAmount, startDate, system, interestRate, rateType, installments, correction, insurance }
  const compareData = useMemo(() => {
    if (!compareMode || !loanAmount || !installments || !interestRate || hasErrors) return null
    const baseSchedule = generateSchedule({ ...baseParams, plans: [] })
    const baseSummary = calcSummary(baseSchedule, loanAmount)
    const investMonthlyRate = investment.enabled ? toMonthlyRate(investment.rate, investment.rateType) : 0

    const results = strategies.map(strat => {
      const sched = generateSchedule({ ...baseParams, plans: strat.plans })
      const summ = calcSummary(sched, loanAmount)
      const inv = investment.enabled
        ? calculateInvestment({ schedule: sched, baseSchedule, investmentRate: investMonthlyRate, includeMonthly: investment.includeMonthly })
        : null
      return { strategy: strat, schedule: sched, summary: summ, investment: inv }
    })
    return { baseSchedule, baseSummary, results }
  }, [compareMode, loanAmount, startDate, system, interestRate, rateType, installments, correction, insurance, strategies, investment])

  const addStrategy = useCallback(() => {
    if (strategies.length >= 3) return
    setStrategies(prev => [...prev, { id: Date.now(), name: `Estrategia ${prev.length + 1}`, plans: [] }])
  }, [strategies.length])

  const removeStrategy = useCallback((id) => {
    setStrategies(prev => prev.filter(s => s.id !== id))
  }, [])

  const updateStrategyName = useCallback((id, name) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, name } : s))
  }, [])

  const addPlanToStrategy = useCallback((stratId, plan) => {
    setStrategies(prev => prev.map(s =>
      s.id === stratId ? { ...s, plans: [...s.plans, { ...plan, id: Date.now() }] } : s
    ))
  }, [])

  const removePlanFromStrategy = useCallback((stratId, planId) => {
    setStrategies(prev => prev.map(s =>
      s.id === stratId ? { ...s, plans: s.plans.filter(p => p.id !== planId) } : s
    ))
  }, [])

  const updatePlanInStrategy = useCallback((stratId, planId, updatedPlan) => {
    setStrategies(prev => prev.map(s =>
      s.id === stratId ? { ...s, plans: s.plans.map(p => p.id === planId ? { ...updatedPlan, id: planId } : p) } : s
    ))
  }, [])

  return (
    <>
      <Head>
        <title>{t('meta.amortizacao_title')}</title>
        <meta name="description" content={t('meta.amortizacao_description')} />
        <meta property="og:title" content={t('meta.amortizacao_title')} />
        <meta property="og:description" content={t('meta.amortizacao_description')} />
        <meta property="og:image" content="/og-image.svg" />
        <meta property="og:url" content="https://luizfelipebaroncello.com/amortizacao" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('meta.amortizacao_title')} />
        <meta name="twitter:description" content={t('meta.amortizacao_description')} />
        <meta name="twitter:image" content="/og-image.svg" />
      </Head>

      <div className="am-page">
        {/* Header */}
        <header className="ev-header">
          <div className="ev-header-left">
            <Link href="/" className="ev-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <h1 className="ev-title">Simulador de Amortizacao</h1>
              <p className="ev-subtitle">Financiamentos SAC e Price</p>
            </div>
          </div>
          <div className="am-header-actions">
            <label className="am-switch">
              <input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)} />
              <span className="am-switch-slider" />
            </label>
            <span className="am-compare-label">Comparar</span>
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
                  className={`am-input am-input-with-prefix${errors.loanAmount ? ' input-error' : ''}`}
                  value={loanAmount}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setLoanAmount(v)
                    setFieldValidation('loanAmount', v, validateLoanAmount)
                  }}
                  min={0}
                  step={1000}
                />
              </div>
              {errors.loanAmount && <span className="field-error-msg">{errors.loanAmount}</span>}
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
                  className={`am-input${errors.interestRate ? ' input-error' : ''}`}
                  value={interestRate}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setInterestRate(v)
                    setFieldValidation('interestRate', v, validateRate)
                  }}
                  min={0}
                  step={0.01}
                />
                <div className="am-toggle-group am-toggle-small">
                  <button className={`am-toggle-btn${rateType === 'anual' ? ' active' : ''}`} onClick={() => setRateType('anual')}>a.a.</button>
                  <button className={`am-toggle-btn${rateType === 'mensal' ? ' active' : ''}`} onClick={() => setRateType('mensal')}>a.m.</button>
                </div>
              </div>
              {errors.interestRate && <span className="field-error-msg">{errors.interestRate}</span>}
              {!errors.interestRate && warnings.interestRate && <span className="field-warn-msg">{warnings.interestRate}</span>}
            </div>
            <div className="am-field">
              <label className="am-label">Quantidade de Parcelas</label>
              <input
                type="number"
                className={`am-input${errors.installments ? ' input-error' : ''}`}
                value={installments}
                onChange={e => {
                  const v = Number(e.target.value)
                  setInstallments(v)
                  setFieldValidation('installments', v, validateTerm)
                }}
                min={1}
                max={600}
              />
              {errors.installments && <span className="field-error-msg">{errors.installments}</span>}
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

        {/* ─── Normal Mode ─── */}
        {!compareMode && <>
        <section className="am-section">
          <div className="am-section-header">
            <h2 className="ev-section-title">Plano de Amortizacao Extra</h2>
            <button className="am-btn am-btn-outline" onClick={() => {
              if (showPlanForm) {
                setShowPlanForm(false)
                setEditingPlanId(null)
                setNewPlan({ type: 'mensal', amount: 500, month: 12, frequency: 6, amortizeDiscount: false, recurring: false })
              } else {
                setShowPlanForm(true)
              }
            }}>
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
                  <button className={`am-toggle-btn${newPlan.type === 'fgts_parcela' || newPlan.type === 'fgts_saldo' ? ' active' : ''}`} onClick={() => setNewPlan(p => ({ ...p, type: 'fgts_parcela' }))}>FGTS</button>
                </div>
              </div>
              {(newPlan.type === 'fgts_parcela' || newPlan.type === 'fgts_saldo') && (
                <div className="am-field">
                  <label className="am-label-sm">Modalidade FGTS</label>
                  <div className="am-toggle-group am-toggle-small">
                    <button className={`am-toggle-btn${newPlan.type === 'fgts_parcela' ? ' active' : ''}`} onClick={() => setNewPlan(p => ({ ...p, type: 'fgts_parcela' }))}>Abatimento de Parcelas</button>
                    <button className={`am-toggle-btn${newPlan.type === 'fgts_saldo' ? ' active' : ''}`} onClick={() => setNewPlan(p => ({ ...p, type: 'fgts_saldo' }))}>Abatimento Saldo Devedor</button>
                  </div>
                </div>
              )}
              <div className="am-plan-form-row">
                <div className="am-field">
                  <label className="am-label-sm">Valor (R$)</label>
                  <input
                    type="number"
                    className={`am-input am-input-sm${errors.planAmount ? ' input-error' : ''}`}
                    value={newPlan.amount}
                    onChange={e => {
                      const v = Number(e.target.value)
                      setNewPlan(p => ({ ...p, amount: v }))
                      setFieldValidation('planAmount', v, validateExtraPayment)
                    }}
                    min={0}
                    step={100}
                  />
                  {errors.planAmount && <span className="field-error-msg">{errors.planAmount}</span>}
                </div>
                {(newPlan.type === 'unico' || newPlan.type === 'fgts_parcela' || newPlan.type === 'fgts_saldo') && (
                  <div className="am-field">
                    <label className="am-label-sm">{newPlan.type === 'fgts_parcela' ? 'A partir do mes' : 'No mes'}</label>
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
              {newPlan.type === 'fgts_parcela' && (
                <div className="am-field">
                  <div className="am-extra-header">
                    <label className="am-switch">
                      <input type="checkbox" checked={newPlan.amortizeDiscount} onChange={e => setNewPlan(p => ({ ...p, amortizeDiscount: e.target.checked }))} />
                      <span className="am-switch-slider" />
                    </label>
                    <span className="am-label-sm">Amortizar valor descontado (do bolso)</span>
                  </div>
                </div>
              )}
              {(newPlan.type === 'fgts_parcela' || newPlan.type === 'fgts_saldo') && (
                <div className="am-field">
                  <div className="am-extra-header">
                    <label className="am-switch">
                      <input type="checkbox" checked={newPlan.recurring} onChange={e => setNewPlan(p => ({ ...p, recurring: e.target.checked }))} />
                      <span className="am-switch-slider" />
                    </label>
                    <span className="am-label-sm">
                      Recorrente (a cada {newPlan.type === 'fgts_saldo' ? '24' : '12'} meses)
                    </span>
                  </div>
                </div>
              )}
              <button className="am-btn am-btn-primary" onClick={addPlan}>{editingPlanId ? 'Salvar' : 'Adicionar Plano'}</button>
            </div>
          )}

          {plans.length > 0 && (
            <div className="am-plans-list">
              {plans.map(plan => (
                <div key={plan.id} className="am-plan-item am-plan-item-clickable" onClick={() => editPlan(plan)}>
                  <div className="am-plan-info">
                    <span className="am-plan-type">{planTypeLabel(plan.type)}</span>
                    <span className="am-plan-desc">{planDescription(plan)}</span>
                  </div>
                  <button className="am-plan-remove" onClick={(e) => { e.stopPropagation(); removePlan(plan.id) }} aria-label="Remover plano">
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

        {/* ─── Calculation Error ─── */}
        {calcError && (
          <div style={{ padding: '16px 0' }}>
            <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', margin: 0 }}>
              {calcError}
            </p>
          </div>
        )}

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
                {summary.totalFgts > 0 && (
                  <div className="am-dash-card">
                    <span className="am-dash-label">Economia FGTS</span>
                    <span className="am-dash-value am-dash-value-green">{formatBRL(summary.totalFgts)}</span>
                    <span className="am-dash-meta">Voce desembolsa {formatBRL(summary.totalPaid - summary.totalFgts)}</span>
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

            {/* ─── Charts ─── */}
            <section className="am-section">
              <h2 className="ev-section-title">Composicao das Parcelas</h2>
              <AmortCompositionChart
                schedule={schedule}
                hasInsurance={insurance.enabled && summary.totalInsurance > 0}
                hasCorrection={correction.enabled && summary.totalCorrection > 0}
              />
            </section>

            <section className="am-section">
              <h2 className="ev-section-title">Evolucao do Saldo Devedor</h2>
              <BalanceChart schedule={schedule} />
            </section>

            <section className="am-section">
              <h2 className="ev-section-title">Custo Total Acumulado</h2>
              <AccumulatedCostChart schedule={schedule} />
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
                        {summary.totalExtra > 0 && <th>Amort. Extra</th>}
                        <th>Juros</th>
                        {correction.enabled && <th>Correcao</th>}
                        {insurance.enabled && <th>Seguro/Taxa</th>}
                        {summary.totalFgts > 0 && <th>FGTS</th>}
                        {(summary.totalExtra > 0 || summary.totalFgts > 0) && <th>Total</th>}
                        <th>Saldo Devedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row) => (
                        <tr key={row.month}>
                          <td className="ev-td-month">{row.month}</td>
                          <td>{formatMonth(row.date)}</td>
                          <td>{formatBRL(row.payment)}</td>
                          <td>{formatBRL(row.amortization)}</td>
                          {summary.totalExtra > 0 && <td>{row.extraAmortization > 0 ? formatBRL(row.extraAmortization) : '-'}</td>}
                          <td>{formatBRL(row.interest)}</td>
                          {correction.enabled && <td>{formatBRL(row.correction)}</td>}
                          {insurance.enabled && <td>{formatBRL(row.insurance)}</td>}
                          {summary.totalFgts > 0 && <td>{row.fgtsDiscount > 0 ? `- ${formatBRL(row.fgtsDiscount)}` : '-'}</td>}
                          {(summary.totalExtra > 0 || summary.totalFgts > 0) && <td className="ev-td-total">{formatBRL(row.totalWithFgts)}</td>}
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
        </>}

        {/* ─── Compare Mode ─── */}
        {compareMode && compareData && (
          <>
            {/* Strategy Cards */}
            <section className="am-section">
              <div className="am-section-header">
                <h2 className="ev-section-title">Estrategias</h2>
                {strategies.length < 3 && (
                  <button className="am-btn am-btn-outline" onClick={addStrategy}>+ Estrategia</button>
                )}
              </div>
              <div className="am-strategies-grid">
                {strategies.map((strat, si) => (
                  <div key={strat.id} className="am-strategy-card">
                    <div className="am-strategy-header">
                      <input
                        type="text"
                        className="am-strategy-name"
                        value={strat.name}
                        onChange={e => updateStrategyName(strat.id, e.target.value)}
                      />
                      {strategies.length > 1 && (
                        <button className="am-plan-remove" onClick={() => removeStrategy(strat.id)} aria-label="Remover estrategia">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="am-strategy-plans">
                      <StrategyPlanAdder
                        stratId={strat.id}
                        plans={strat.plans}
                        installments={installments}
                        onAdd={addPlanToStrategy}
                        onUpdate={updatePlanInStrategy}
                        onRemove={removePlanFromStrategy}
                        planTypeLabel={planTypeLabel}
                        planDescription={planDescription}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Investment Config */}
            <section className="am-section">
              <div className="am-extra-card">
                <div className="am-extra-header">
                  <label className="am-switch">
                    <input type="checkbox" checked={investment.enabled} onChange={e => setInvestment(prev => ({ ...prev, enabled: e.target.checked }))} />
                    <span className="am-switch-slider" />
                  </label>
                  <span className="am-extra-title">Comparar com Investimento</span>
                </div>
                {investment.enabled && (
                  <div className="am-extra-body">
                    <div className="am-field">
                      <label className="am-label-sm">Taxa de Rendimento (%)</label>
                      <div className="am-input-row">
                        <input type="number" className="am-input am-input-sm" value={investment.rate}
                          onChange={e => setInvestment(prev => ({ ...prev, rate: Number(e.target.value) }))} min={0} step={0.01} />
                        <div className="am-toggle-group am-toggle-small">
                          <button className={`am-toggle-btn${investment.rateType === 'anual' ? ' active' : ''}`} onClick={() => setInvestment(prev => ({ ...prev, rateType: 'anual' }))}>a.a.</button>
                          <button className={`am-toggle-btn${investment.rateType === 'mensal' ? ' active' : ''}`} onClick={() => setInvestment(prev => ({ ...prev, rateType: 'mensal' }))}>a.m.</button>
                        </div>
                      </div>
                    </div>
                    <div className="am-extra-header" style={{ marginTop: 8 }}>
                      <label className="am-switch">
                        <input type="checkbox" checked={investment.includeMonthly} onChange={e => setInvestment(prev => ({ ...prev, includeMonthly: e.target.checked }))} />
                        <span className="am-switch-slider" />
                      </label>
                      <span className="am-label-sm">Incluir economia mensal como aporte</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Compare Summary Cards */}
            <section className="am-section">
              <h2 className="ev-section-title">Comparativo</h2>
              <div className="am-compare-grid" style={{ gridTemplateColumns: `repeat(${compareData.results.length}, 1fr)` }}>
                {compareData.results.map(({ strategy, summary: s, investment: inv }, i) => {
                  if (!s) return <div key={strategy.id} className="am-compare-col"><p className="am-empty-text">Sem planos</p></div>
                  const isBestPaid = compareData.results.every(r => !r.summary || s.totalPaid <= r.summary.totalPaid)
                  const isBestInterest = compareData.results.every(r => !r.summary || s.totalInterest <= r.summary.totalInterest)
                  const isBestInstallments = compareData.results.every(r => !r.summary || s.effectiveInstallments <= r.summary.effectiveInstallments)
                  return (
                    <div key={strategy.id} className="am-compare-col">
                      <h3 className="am-compare-col-title">{strategy.name}</h3>
                      <div className={`am-compare-metric${isBestPaid ? ' am-compare-best' : ''}`}>
                        <span className="am-dash-label">Total Pago</span>
                        <span className="am-dash-value">{formatBRL(s.totalPaid)}</span>
                      </div>
                      <div className={`am-compare-metric${isBestInterest ? ' am-compare-best' : ''}`}>
                        <span className="am-dash-label">Total Juros</span>
                        <span className="am-dash-value am-dash-value-orange">{formatBRL(s.totalInterest)}</span>
                      </div>
                      <div className={`am-compare-metric${isBestInstallments ? ' am-compare-best' : ''}`}>
                        <span className="am-dash-label">Parcelas</span>
                        <span className="am-dash-value">{s.effectiveInstallments}</span>
                      </div>
                      <div className="am-compare-metric">
                        <span className="am-dash-label">Primeira Parcela</span>
                        <span className="am-dash-value">{formatBRL(s.firstPayment)}</span>
                      </div>
                      <div className="am-compare-metric">
                        <span className="am-dash-label">Ultima Parcela</span>
                        <span className="am-dash-value">{formatBRL(s.lastPayment)}</span>
                      </div>
                      {s.totalFgts > 0 && (
                        <div className="am-compare-metric">
                          <span className="am-dash-label">Economia FGTS</span>
                          <span className="am-dash-value am-dash-value-green">{formatBRL(s.totalFgts)}</span>
                        </div>
                      )}
                      {inv && (
                        <>
                          {inv.invested > 0 && (
                            <>
                              <div className="am-compare-metric am-compare-invest">
                                <span className="am-dash-label">Investimento (do bolso)</span>
                                <span className="am-dash-value">{formatBRL(inv.invested)}</span>
                                <span className="am-dash-meta">Aportado</span>
                              </div>
                              <div className="am-compare-metric am-compare-invest">
                                <span className="am-dash-label">Rendimento Investimento</span>
                                <span className="am-dash-value am-dash-value-green">{formatBRL(inv.profit)}</span>
                                <span className="am-dash-meta">Saldo: {formatBRL(inv.finalBalance)}</span>
                              </div>
                            </>
                          )}
                          {inv.fgtsInvested > 0 && (
                            <>
                              <div className="am-compare-metric am-compare-invest">
                                <span className="am-dash-label">FGTS Utilizado</span>
                                <span className="am-dash-value">{formatBRL(inv.fgtsInvested)}</span>
                                <span className="am-dash-meta">Rende 3% a.a. no fundo</span>
                              </div>
                              <div className="am-compare-metric am-compare-invest">
                                <span className="am-dash-label">Rendimento FGTS</span>
                                <span className="am-dash-value am-dash-value-green">{formatBRL(inv.fgtsProfit)}</span>
                                <span className="am-dash-meta">Saldo: {formatBRL(inv.fgtsFinalBalance)}</span>
                              </div>
                            </>
                          )}
                          <div className={`am-compare-metric am-compare-invest${
                            compareData.results.every(r => !r.investment || inv.totalPatrimony >= r.investment.totalPatrimony) ? ' am-compare-best' : ''
                          }`}>
                            <span className="am-dash-label">Patrimonio Total</span>
                            <span className="am-dash-value">{formatBRL(inv.totalPatrimony)}</span>
                            <span className="am-dash-meta">Investimento + FGTS</span>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Analysis */}
            {investment.enabled && compareData.results.filter(r => r.investment).length >= 2 && (() => {
              const withInv = compareData.results.filter(r => r.summary && r.investment)
              if (withInv.length < 2) return null

              // Calculate net patrimony: patrimony accumulated - (total interest paid beyond base)
              const analyses = withInv.map(r => {
                const patrimony = r.investment.totalPatrimony
                const totalPaid = r.summary.totalPaid
                const totalFgtsUsed = r.summary.totalFgts
                // Net = patrimonio acumulado - custo total do financiamento + valor do emprestimo (ja quitado = imovel)
                // Simplificando: patrimonio liquido = patrimonio_investimentos - (juros extras vs base)
                return {
                  name: r.strategy.name,
                  patrimony,
                  totalPaid,
                  totalInterest: r.summary.totalInterest,
                  effectiveInstallments: r.summary.effectiveInstallments,
                  totalFgts: totalFgtsUsed,
                  // Patrimonio final = investimentos acumulados (o imovel todos tem igual)
                  netPatrimony: patrimony,
                }
              })

              const best = analyses.reduce((a, b) => a.netPatrimony > b.netPatrimony ? a : b)
              const others = analyses.filter(a => a !== best)
              const hasClearWinner = others.every(o => best.netPatrimony > o.netPatrimony)

              return (
                <section className="am-section">
                  <div className="am-analysis-card">
                    <h3 className="am-analysis-title">Analise Comparativa</h3>
                    <div className="am-analysis-body">
                      {hasClearWinner ? (
                        <>
                          <p className="am-analysis-text">
                            <strong>{best.name}</strong> gera o maior patrimonio ao final do financiamento: <strong className="am-analysis-highlight">{formatBRL(best.netPatrimony)}</strong>
                          </p>
                          {others.map(o => (
                            <p key={o.name} className="am-analysis-text">
                              Comparado com <strong>{o.name}</strong>, sao <strong className="am-analysis-highlight">{formatBRL(best.netPatrimony - o.netPatrimony)}</strong> a mais em patrimonio acumulado.
                            </p>
                          ))}
                          {best.effectiveInstallments < Math.max(...analyses.map(a => a.effectiveInstallments)) && (
                            <p className="am-analysis-text am-analysis-detail">
                              Alem disso, {best.name} quita o financiamento em <strong>{best.effectiveInstallments} parcelas</strong> ({Math.floor(best.effectiveInstallments / 12)} anos e {best.effectiveInstallments % 12} meses), economizando {Math.max(...analyses.map(a => a.effectiveInstallments)) - best.effectiveInstallments} parcelas.
                            </p>
                          )}
                          {best.totalInterest < Math.max(...analyses.map(a => a.totalInterest)) && (
                            <p className="am-analysis-text am-analysis-detail">
                              Total de juros pagos: {formatBRL(best.totalInterest)} — economia de {formatBRL(Math.max(...analyses.map(a => a.totalInterest)) - best.totalInterest)} em juros.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="am-analysis-text">
                          As estrategias geram patrimonio equivalente: {formatBRL(best.netPatrimony)}.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )
            })()}

            {/* Compare Balance Chart */}
            <section className="am-section">
              <h2 className="ev-section-title">Evolucao do Saldo Devedor</h2>
              <RechartsCompareBalanceChart
                schedules={compareData.results.map(r => r.schedule)}
                names={compareData.results.map(r => r.strategy.name)}
              />
            </section>

            {/* Compare Table */}
            <section className="am-section">
              <div className="am-section-header">
                <h2 className="ev-section-title">Tabela Comparativa</h2>
                <button className="am-btn am-btn-outline" onClick={() => setShowCompareTable(!showCompareTable)}>
                  {showCompareTable ? 'Ocultar' : 'Mostrar Tabela'}
                </button>
              </div>
              {showCompareTable && compareData.results.length > 0 && (
                <div className="ev-table-wrap">
                  <table className="ev-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        {compareData.results.map(r => (
                          <th key={r.strategy.id} colSpan={2}>{r.strategy.name}</th>
                        ))}
                      </tr>
                      <tr>
                        <th>Mes</th>
                        {compareData.results.map(r => (
                          <React.Fragment key={r.strategy.id}>
                            <th>Parcela</th>
                            <th>Saldo</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.max(...compareData.results.map(r => r.schedule.length)) }, (_, i) => (
                        <tr key={i}>
                          <td className="ev-td-month">{i + 1}</td>
                          {compareData.results.map(r => (
                            <React.Fragment key={r.strategy.id}>
                              <td>{r.schedule[i] ? formatBRL(r.schedule[i].totalWithFgts) : '-'}</td>
                              <td>{r.schedule[i] ? formatBRL(r.schedule[i].balance) : '-'}</td>
                            </React.Fragment>
                          ))}
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

// ─── Strategy Plan Adder (mini form for compare mode) ───
function StrategyPlanAdder({ stratId, plans, installments, onAdd, onUpdate, onRemove, planTypeLabel, planDescription }: {
  stratId: number
  plans: AmortPlan[]
  installments: number
  onAdd: (stratId: number, plan: Omit<AmortPlan, 'id'>) => void
  onUpdate: (stratId: number, planId: number, plan: Omit<AmortPlan, 'id'>) => void
  onRemove: (stratId: number, planId: number) => void
  planTypeLabel: (type: string) => string
  planDescription: (plan: AmortPlan) => string
}) {
  const [show, setShow] = useState(false)
  const [plan, setPlan] = useState({ type: 'mensal', amount: 500, month: 12, frequency: 6, amortizeDiscount: false, recurring: false })
  const [editingId, setEditingId] = useState(null)

  const resetForm = () => {
    setShow(false)
    setEditingId(null)
    setPlan({ type: 'mensal', amount: 500, month: 12, frequency: 6, amortizeDiscount: false, recurring: false })
  }

  const handleAdd = () => {
    if (plan.type === 'fgts_parcela' && !plan.recurring) {
      const overlap = plans.find(p => p.type === 'fgts_parcela' && p.id !== editingId &&
        !(plan.month >= p.month + 12 || plan.month + 12 <= p.month))
      if (overlap) { alert('FGTS Parcelas: intervalo minimo de 12 meses.'); return }
    }
    if (plan.type === 'fgts_saldo' && !plan.recurring) {
      const tooClose = plans.find(p => p.type === 'fgts_saldo' && p.id !== editingId && Math.abs(plan.month - p.month) < 24)
      if (tooClose) { alert('FGTS Saldo: intervalo minimo de 24 meses.'); return }
    }
    if (editingId) {
      onUpdate(stratId, editingId, plan)
    } else {
      onAdd(stratId, plan)
    }
    resetForm()
  }

  const handleEdit = (p) => {
    setPlan({ type: p.type, amount: p.amount, month: p.month, frequency: p.frequency, amortizeDiscount: p.amortizeDiscount, recurring: p.recurring || false })
    setEditingId(p.id)
    setShow(true)
  }

  return (
    <>
      {plans.map(p => (
        <div key={p.id} className="am-plan-item am-plan-item-sm am-plan-item-clickable" onClick={() => handleEdit(p)}>
          <div className="am-plan-info">
            <span className="am-plan-type">{planTypeLabel(p.type)}</span>
            <span className="am-plan-desc">{planDescription(p)}</span>
          </div>
          <button className="am-plan-remove" onClick={(e) => { e.stopPropagation(); onRemove(stratId, p.id) }} aria-label="Remover">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
      {!show && <button className="am-btn am-btn-outline am-btn-sm" onClick={() => setShow(true)}>+ Plano</button>}
      {show && (
        <div className="am-plan-form am-plan-form-compact">
          <div className="am-toggle-group am-toggle-small">
            <button className={`am-toggle-btn${plan.type === 'unico' ? ' active' : ''}`} onClick={() => setPlan(p => ({ ...p, type: 'unico' }))}>Unico</button>
            <button className={`am-toggle-btn${plan.type === 'mensal' ? ' active' : ''}`} onClick={() => setPlan(p => ({ ...p, type: 'mensal' }))}>Mensal</button>
            <button className={`am-toggle-btn${plan.type === 'periodico' ? ' active' : ''}`} onClick={() => setPlan(p => ({ ...p, type: 'periodico' }))}>Periodico</button>
            <button className={`am-toggle-btn${plan.type === 'fgts_parcela' || plan.type === 'fgts_saldo' ? ' active' : ''}`} onClick={() => setPlan(p => ({ ...p, type: 'fgts_parcela' }))}>FGTS</button>
          </div>
          {(plan.type === 'fgts_parcela' || plan.type === 'fgts_saldo') && (
            <div className="am-toggle-group am-toggle-small">
              <button className={`am-toggle-btn${plan.type === 'fgts_parcela' ? ' active' : ''}`} onClick={() => setPlan(p => ({ ...p, type: 'fgts_parcela' }))}>Parcelas</button>
              <button className={`am-toggle-btn${plan.type === 'fgts_saldo' ? ' active' : ''}`} onClick={() => setPlan(p => ({ ...p, type: 'fgts_saldo' }))}>Saldo</button>
            </div>
          )}
          <div className="am-plan-form-row">
            <div className="am-field">
              <label className="am-label-sm">R$</label>
              <input type="number" className="am-input am-input-sm" value={plan.amount}
                onChange={e => setPlan(p => ({ ...p, amount: Number(e.target.value) }))} min={0} step={100} />
            </div>
            {(plan.type === 'unico' || plan.type === 'fgts_parcela' || plan.type === 'fgts_saldo') && (
              <div className="am-field">
                <label className="am-label-sm">{plan.type === 'fgts_parcela' ? 'Inicio' : 'Mes'}</label>
                <input type="number" className="am-input am-input-sm" value={plan.month}
                  onChange={e => setPlan(p => ({ ...p, month: Number(e.target.value) }))} min={1} max={installments} />
              </div>
            )}
            {plan.type === 'periodico' && (
              <div className="am-field">
                <label className="am-label-sm">A cada</label>
                <input type="number" className="am-input am-input-sm" value={plan.frequency}
                  onChange={e => setPlan(p => ({ ...p, frequency: Number(e.target.value) }))} min={1} />
              </div>
            )}
          </div>
          {plan.type === 'fgts_parcela' && (
            <div className="am-extra-header">
              <label className="am-switch">
                <input type="checkbox" checked={plan.amortizeDiscount} onChange={e => setPlan(p => ({ ...p, amortizeDiscount: e.target.checked }))} />
                <span className="am-switch-slider" />
              </label>
              <span className="am-label-sm">Amortizar desconto</span>
            </div>
          )}
          {(plan.type === 'fgts_parcela' || plan.type === 'fgts_saldo') && (
            <div className="am-extra-header">
              <label className="am-switch">
                <input type="checkbox" checked={plan.recurring} onChange={e => setPlan(p => ({ ...p, recurring: e.target.checked }))} />
                <span className="am-switch-slider" />
              </label>
              <span className="am-label-sm">
                Recorrente (a cada {plan.type === 'fgts_saldo' ? '24' : '12'} meses)
              </span>
            </div>
          )}
          <div className="am-plan-form-row">
            <button className="am-btn am-btn-primary am-btn-sm" onClick={handleAdd}>{editingId ? 'Salvar' : 'Adicionar'}</button>
            <button className="am-btn am-btn-outline am-btn-sm" onClick={resetForm}>Cancelar</button>
          </div>
        </div>
      )}
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
