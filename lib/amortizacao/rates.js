function toMonthlyRate(rate, type) {
  const r = rate / 100
  if (type === 'mensal') return r
  return Math.pow(1 + r, 1 / 12) - 1
}

module.exports = { toMonthlyRate }
