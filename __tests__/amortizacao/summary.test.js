const { calcSummary } = require('../../lib/amortizacao/summary')
const { generateSchedule } = require('../../lib/amortizacao/schedule')

const baseParams = {
  loanAmount: 300000,
  startDate: '2024-01-01',
  system: 'sac',
  interestRate: 10,
  rateType: 'anual',
  installments: 360,
  plans: [],
  correction: { enabled: false, rate: 0, rateType: 'anual' },
  insurance: { enabled: false, type: 'fixo', value: 0 },
}

describe('calcSummary', () => {
  test('returns null for empty schedule', () => {
    expect(calcSummary([], 300000)).toBeNull()
  })

  test('returns correct structure', () => {
    const schedule = generateSchedule(baseParams)
    const summary = calcSummary(schedule, 300000)

    expect(summary).toHaveProperty('totalPaid')
    expect(summary).toHaveProperty('totalInterest')
    expect(summary).toHaveProperty('totalExtra')
    expect(summary).toHaveProperty('totalFgts')
    expect(summary).toHaveProperty('firstPayment')
    expect(summary).toHaveProperty('lastPayment')
    expect(summary).toHaveProperty('lastDate')
    expect(summary).toHaveProperty('effectiveInstallments')
  })

  test('totalPaid equals sum of all totals', () => {
    const schedule = generateSchedule(baseParams)
    const summary = calcSummary(schedule, 300000)
    const manualTotal = schedule.reduce((s, r) => s + r.total, 0)
    expect(summary.totalPaid).toBeCloseTo(manualTotal, 2)
  })

  test('effectiveInstallments matches schedule length', () => {
    const schedule = generateSchedule(baseParams)
    const summary = calcSummary(schedule, 300000)
    expect(summary.effectiveInstallments).toBe(schedule.length)
  })

  test('firstPayment and lastPayment are correct', () => {
    const schedule = generateSchedule(baseParams)
    const summary = calcSummary(schedule, 300000)
    expect(summary.firstPayment).toBeCloseTo(schedule[0].total, 2)
    expect(summary.lastPayment).toBeCloseTo(schedule[schedule.length - 1].total, 2)
  })

  test('totalExtra is zero without extra plans', () => {
    const schedule = generateSchedule(baseParams)
    const summary = calcSummary(schedule, 300000)
    expect(summary.totalExtra).toBeCloseTo(0)
  })

  test('totalExtra is positive with extra plans', () => {
    const schedule = generateSchedule({
      ...baseParams,
      plans: [{ type: 'mensal', amount: 500 }],
    })
    const summary = calcSummary(schedule, 300000)
    expect(summary.totalExtra).toBeGreaterThan(0)
  })

  test('totalInterest is positive', () => {
    const schedule = generateSchedule(baseParams)
    const summary = calcSummary(schedule, 300000)
    expect(summary.totalInterest).toBeGreaterThan(0)
  })
})
