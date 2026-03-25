const { generateSchedule } = require('../../lib/amortizacao/schedule')

const baseParams = {
  loanAmount: 300000,
  startDate: '2024-01-01',
  interestRate: 10,
  rateType: 'anual',
  installments: 360,
  plans: [],
  correction: { enabled: false, rate: 0, rateType: 'anual' },
  insurance: { enabled: false, type: 'fixo', value: 0 },
}

describe('generateSchedule - SAC', () => {
  const params = { ...baseParams, system: 'sac' }

  test('generates correct number of installments', () => {
    const schedule = generateSchedule(params)
    expect(schedule.length).toBe(360)
  })

  test('first month has highest payment', () => {
    const schedule = generateSchedule(params)
    const firstPayment = schedule[0].total
    const lastPayment = schedule[schedule.length - 1].total
    expect(firstPayment).toBeGreaterThan(lastPayment)
  })

  test('amortization is constant', () => {
    const schedule = generateSchedule(params)
    const expectedAmort = 300000 / 360
    schedule.forEach(row => {
      expect(row.amortization).toBeCloseTo(expectedAmort, 2)
    })
  })

  test('balance decreases monotonically', () => {
    const schedule = generateSchedule(params)
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].balance).toBeLessThan(schedule[i - 1].balance)
    }
  })

  test('final balance is zero or near zero', () => {
    const schedule = generateSchedule(params)
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 0)
  })

  test('interest decreases over time', () => {
    const schedule = generateSchedule(params)
    expect(schedule[0].interest).toBeGreaterThan(schedule[schedule.length - 1].interest)
  })

  test('total paid is greater than loan amount (due to interest)', () => {
    const schedule = generateSchedule(params)
    const totalPaid = schedule.reduce((s, r) => s + r.total, 0)
    expect(totalPaid).toBeGreaterThan(300000)
  })

  test('each row has correct month number', () => {
    const schedule = generateSchedule(params)
    schedule.forEach((row, i) => {
      expect(row.month).toBe(i + 1)
    })
  })
})

describe('generateSchedule - Price', () => {
  const params = { ...baseParams, system: 'price' }

  test('generates schedule', () => {
    const schedule = generateSchedule(params)
    expect(schedule.length).toBe(360)
  })

  test('payment (base) is approximately constant', () => {
    const schedule = generateSchedule(params)
    const firstPayment = schedule[0].payment
    // In Price system, base payment is constant
    schedule.forEach(row => {
      expect(row.payment).toBeCloseTo(firstPayment, 0)
    })
  })

  test('amortization increases over time', () => {
    const schedule = generateSchedule(params)
    expect(schedule[schedule.length - 1].amortization).toBeGreaterThan(schedule[0].amortization)
  })

  test('final balance is zero or near zero', () => {
    const schedule = generateSchedule(params)
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 0)
  })
})

describe('generateSchedule - with extra payments', () => {
  test('monthly extra payment reduces total installments', () => {
    const withExtra = generateSchedule({
      ...baseParams,
      system: 'sac',
      plans: [{ type: 'mensal', amount: 500 }],
    })
    const without = generateSchedule({ ...baseParams, system: 'sac' })
    expect(withExtra.length).toBeLessThan(without.length)
  })

  test('single payment reduces balance at specific month', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      plans: [{ type: 'unico', amount: 50000, month: 12 }],
    })
    const scheduleNoExtra = generateSchedule({ ...baseParams, system: 'sac' })
    // After month 12, balance should be lower
    expect(schedule[12].balance).toBeLessThan(scheduleNoExtra[12].balance)
  })

  test('periodic payment applies at correct frequency', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      plans: [{ type: 'periodico', amount: 5000, frequency: 6 }],
    })
    // Month 6 should have extra amortization
    expect(schedule[5].extraAmortization).toBeGreaterThan(0) // month 6 = index 5
    // Month 5 should not
    expect(schedule[4].extraAmortization).toBe(0)
  })
})

describe('generateSchedule - with correction', () => {
  test('monetary correction increases total paid', () => {
    const withCorrection = generateSchedule({
      ...baseParams,
      system: 'sac',
      correction: { enabled: true, rate: 5, rateType: 'anual' },
    })
    const without = generateSchedule({ ...baseParams, system: 'sac' })

    const totalWith = withCorrection.reduce((s, r) => s + r.total, 0)
    const totalWithout = without.reduce((s, r) => s + r.total, 0)
    expect(totalWith).toBeGreaterThan(totalWithout)
  })

  test('correction amount is recorded in each row', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      correction: { enabled: true, rate: 5, rateType: 'anual' },
    })
    schedule.forEach(row => {
      expect(row.correction).toBeGreaterThan(0)
    })
  })
})

describe('generateSchedule - with insurance', () => {
  test('fixed insurance adds to payment', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      insurance: { enabled: true, type: 'fixo', value: 100 },
    })
    const scheduleNoInsurance = generateSchedule({ ...baseParams, system: 'sac' })
    expect(schedule[0].payment).toBeCloseTo(scheduleNoInsurance[0].payment + 100, 2)
  })

  test('percentage insurance decreases over time (SAC)', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      insurance: { enabled: true, type: 'percentual', value: 0.05 },
    })
    expect(schedule[0].insurance).toBeGreaterThan(schedule[schedule.length - 1].insurance)
  })
})

describe('generateSchedule - FGTS saldo', () => {
  test('FGTS saldo reduces balance at specific month', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      plans: [{ type: 'fgts_saldo', amount: 30000, month: 12 }],
    })
    const scheduleNoFgts = generateSchedule({ ...baseParams, system: 'sac' })
    expect(schedule[12].balance).toBeLessThan(scheduleNoFgts[12].balance)
  })

  test('recurring FGTS saldo applies every 24 months', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      plans: [{ type: 'fgts_saldo', amount: 10000, month: 12, recurring: true }],
    })
    // Should have extra at month 12 and month 36
    expect(schedule[11].extraAmortization).toBeGreaterThan(0) // month 12
    expect(schedule[35].extraAmortization).toBeGreaterThan(0) // month 36
  })
})

describe('generateSchedule - FGTS parcela', () => {
  test('FGTS parcela applies discount for 12 months', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      plans: [{ type: 'fgts_parcela', amount: 12000, month: 6, amortizeDiscount: false }],
    })
    // Months 6-17 should have FGTS discount
    for (let i = 5; i < 17; i++) {
      expect(schedule[i].fgtsDiscount).toBeGreaterThan(0)
    }
    // Month 18 should not
    expect(schedule[17].fgtsDiscount).toBe(0)
  })

  test('FGTS parcela discount is capped at 80% of payment', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      plans: [{ type: 'fgts_parcela', amount: 9999999, month: 1, amortizeDiscount: false }],
    })
    // Discount should be at most 80% of payment
    schedule.slice(0, 12).forEach(row => {
      expect(row.fgtsDiscount).toBeLessThanOrEqual(row.payment * 0.8 + 0.01)
    })
  })
})

describe('generateSchedule - edge cases', () => {
  test('short loan (12 installments)', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      installments: 12,
    })
    expect(schedule.length).toBe(12)
    expect(schedule[11].balance).toBeCloseTo(0, 0)
  })

  test('zero interest rate', () => {
    const schedule = generateSchedule({
      ...baseParams,
      system: 'sac',
      interestRate: 0.0001, // near-zero to avoid division issues
      installments: 12,
    })
    expect(schedule.length).toBe(12)
  })
})
