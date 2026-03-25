const { toMonthlyRate } = require('../../lib/amortizacao/rates')

describe('toMonthlyRate', () => {
  test('monthly rate returns as-is (divided by 100)', () => {
    expect(toMonthlyRate(1, 'mensal')).toBeCloseTo(0.01)
  })

  test('annual rate converts to monthly', () => {
    // 12% annual -> ~0.9489% monthly
    const monthly = toMonthlyRate(12, 'anual')
    expect(monthly).toBeCloseTo(0.009489, 4)
  })

  test('0% annual returns 0', () => {
    expect(toMonthlyRate(0, 'anual')).toBeCloseTo(0)
  })

  test('annual conversion is correct compound formula', () => {
    const rate = 10 // 10% annual
    const monthly = toMonthlyRate(rate, 'anual')
    // Compounding monthly should give back annual
    const annualBack = Math.pow(1 + monthly, 12) - 1
    expect(annualBack).toBeCloseTo(0.10, 6)
  })

  test('100% annual rate', () => {
    const monthly = toMonthlyRate(100, 'anual')
    const annualBack = Math.pow(1 + monthly, 12) - 1
    expect(annualBack).toBeCloseTo(1.0, 6)
  })
})
