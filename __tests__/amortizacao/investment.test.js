const { calculateInvestment } = require('../../lib/amortizacao/investment')
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

describe('calculateInvestment', () => {
  test('returns zero when no extra payments', () => {
    const baseSchedule = generateSchedule(baseParams)
    const schedule = generateSchedule(baseParams)
    const result = calculateInvestment({
      schedule,
      baseSchedule,
      investmentRate: 0.01,
      includeMonthly: false,
    })
    expect(result.invested).toBeCloseTo(0)
    expect(result.finalBalance).toBeCloseTo(0)
  })

  test('investment grows with extra payments', () => {
    const baseSchedule = generateSchedule(baseParams)
    const schedule = generateSchedule({
      ...baseParams,
      plans: [{ type: 'mensal', amount: 1000 }],
    })
    const result = calculateInvestment({
      schedule,
      baseSchedule,
      investmentRate: 0.01,
      includeMonthly: false,
    })
    expect(result.invested).toBeGreaterThan(0)
    expect(result.finalBalance).toBeGreaterThan(result.invested)
    expect(result.profit).toBeGreaterThan(0)
  })

  test('total patrimony includes FGTS balance', () => {
    const baseSchedule = generateSchedule(baseParams)
    const schedule = generateSchedule({
      ...baseParams,
      plans: [
        { type: 'mensal', amount: 500 },
        { type: 'fgts_parcela', amount: 12000, month: 1, amortizeDiscount: false },
      ],
    })
    const result = calculateInvestment({
      schedule,
      baseSchedule,
      investmentRate: 0.01,
      includeMonthly: false,
    })
    expect(result.totalPatrimony).toBe(result.finalBalance + result.fgtsFinalBalance)
  })

  test('FGTS grows at 3% annual rate', () => {
    const baseSchedule = generateSchedule(baseParams)
    const schedule = generateSchedule({
      ...baseParams,
      plans: [{ type: 'fgts_parcela', amount: 12000, month: 1, amortizeDiscount: false }],
    })
    const result = calculateInvestment({
      schedule,
      baseSchedule,
      investmentRate: 0.01,
      includeMonthly: false,
    })
    expect(result.fgtsInvested).toBeGreaterThan(0)
    expect(result.fgtsFinalBalance).toBeGreaterThan(result.fgtsInvested)
  })

  test('includeMonthly invests payment savings', () => {
    const baseSchedule = generateSchedule(baseParams)
    const schedule = generateSchedule({
      ...baseParams,
      plans: [{ type: 'mensal', amount: 1000 }],
    })
    const withMonthly = calculateInvestment({
      schedule,
      baseSchedule,
      investmentRate: 0.01,
      includeMonthly: true,
    })
    const withoutMonthly = calculateInvestment({
      schedule,
      baseSchedule,
      investmentRate: 0.01,
      includeMonthly: false,
    })
    expect(withMonthly.invested).toBeGreaterThanOrEqual(withoutMonthly.invested)
  })

  test('compounds remaining months when schedule ends early', () => {
    const baseSchedule = generateSchedule(baseParams)
    const shortSchedule = generateSchedule({
      ...baseParams,
      plans: [{ type: 'mensal', amount: 5000 }],
    })
    // shortSchedule should be shorter than baseSchedule
    expect(shortSchedule.length).toBeLessThan(baseSchedule.length)

    const result = calculateInvestment({
      schedule: shortSchedule,
      baseSchedule,
      investmentRate: 0.01,
      includeMonthly: false,
    })
    // Should have compounded extra months
    expect(result.finalBalance).toBeGreaterThan(result.invested)
  })
})
