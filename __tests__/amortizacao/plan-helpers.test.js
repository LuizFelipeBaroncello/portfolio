const { planTypeLabel, planDescription } = require('../../lib/amortizacao/plan-helpers')

describe('planTypeLabel', () => {
  test('returns correct label for each type', () => {
    expect(planTypeLabel('unico')).toBe('Pagamento Unico')
    expect(planTypeLabel('mensal')).toBe('Pagamento Mensal')
    expect(planTypeLabel('periodico')).toBe('Pagamento Periodico')
    expect(planTypeLabel('fgts_parcela')).toBe('FGTS - Parcelas')
    expect(planTypeLabel('fgts_saldo')).toBe('FGTS - Saldo Devedor')
  })

  test('returns type itself for unknown type', () => {
    expect(planTypeLabel('unknown')).toBe('unknown')
  })
})

describe('planDescription', () => {
  test('unico plan', () => {
    const desc = planDescription({ type: 'unico', amount: 10000, month: 5 })
    expect(desc).toContain('10.000')
    expect(desc).toContain('mes 5')
  })

  test('mensal plan', () => {
    const desc = planDescription({ type: 'mensal', amount: 500 })
    expect(desc).toContain('500')
    expect(desc).toContain('por mes')
  })

  test('periodico plan', () => {
    const desc = planDescription({ type: 'periodico', amount: 2000, frequency: 6 })
    expect(desc).toContain('2.000')
    expect(desc).toContain('a cada 6 meses')
  })

  test('fgts_parcela plan', () => {
    const desc = planDescription({ type: 'fgts_parcela', amount: 12000, month: 3, amortizeDiscount: false })
    expect(desc).toContain('12.000')
    expect(desc).toContain('12x')
    expect(desc).toContain('mes 3')
    expect(desc).toContain('80%')
    expect(desc).not.toContain('amortizacao')
  })

  test('fgts_parcela plan with amortize', () => {
    const desc = planDescription({ type: 'fgts_parcela', amount: 12000, month: 3, amortizeDiscount: true })
    expect(desc).toContain('amortizacao')
  })

  test('fgts_parcela recurring', () => {
    const desc = planDescription({ type: 'fgts_parcela', amount: 12000, month: 3, amortizeDiscount: false, recurring: true })
    expect(desc).toContain('recorrente a cada 12 meses')
  })

  test('fgts_saldo plan', () => {
    const desc = planDescription({ type: 'fgts_saldo', amount: 30000, month: 12 })
    expect(desc).toContain('30.000')
    expect(desc).toContain('saldo')
    expect(desc).toContain('mes 12')
  })

  test('fgts_saldo recurring', () => {
    const desc = planDescription({ type: 'fgts_saldo', amount: 30000, month: 12, recurring: true })
    expect(desc).toContain('recorrente a cada 24 meses')
  })

  test('unknown type returns empty string', () => {
    expect(planDescription({ type: 'unknown' })).toBe('')
  })
})
