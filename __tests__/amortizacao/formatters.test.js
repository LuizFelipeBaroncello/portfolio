const { formatBRL, formatDate, formatMonth, addMonths } = require('../../lib/amortizacao/formatters')

describe('formatBRL', () => {
  test('formats positive value', () => {
    const result = formatBRL(1234.56)
    expect(result).toMatch(/1\.234,56/)
  })

  test('formats zero', () => {
    const result = formatBRL(0)
    expect(result).toMatch(/0,00/)
  })

  test('formats negative value', () => {
    const result = formatBRL(-500)
    expect(result).toMatch(/500,00/)
  })

  test('formats large value', () => {
    const result = formatBRL(1000000)
    expect(result).toMatch(/1\.000\.000,00/)
  })
})

describe('formatDate', () => {
  test('formats date in pt-BR', () => {
    const result = formatDate(new Date(2024, 0, 15))
    expect(result).toBe('15/01/2024')
  })
})

describe('formatMonth', () => {
  test('formats January', () => {
    expect(formatMonth(new Date(2024, 0, 1))).toBe('Jan 2024')
  })

  test('formats December', () => {
    expect(formatMonth(new Date(2024, 11, 1))).toBe('Dez 2024')
  })

  test('formats June', () => {
    expect(formatMonth(new Date(2025, 5, 15))).toBe('Jun 2025')
  })
})

describe('addMonths', () => {
  test('adds months to date', () => {
    const result = addMonths(new Date(2024, 0, 1), 3)
    expect(result.getMonth()).toBe(3) // April
    expect(result.getFullYear()).toBe(2024)
  })

  test('crosses year boundary', () => {
    const result = addMonths(new Date(2024, 10, 1), 3)
    expect(result.getMonth()).toBe(1) // February
    expect(result.getFullYear()).toBe(2025)
  })

  test('adds zero months', () => {
    const date = new Date(2024, 5, 15)
    const result = addMonths(date, 0)
    expect(result.getMonth()).toBe(5)
  })

  test('does not mutate original date', () => {
    const original = new Date(2024, 0, 1)
    const originalTime = original.getTime()
    addMonths(original, 6)
    expect(original.getTime()).toBe(originalTime)
  })
})
