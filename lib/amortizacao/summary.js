function calcSummary(schedule, loanAmount) {
  if (schedule.length === 0) return null
  return {
    totalPaid: schedule.reduce((s, r) => s + r.total, 0),
    totalInterest: schedule.reduce((s, r) => s + r.interest, 0),
    totalExtra: schedule.reduce((s, r) => s + r.extraAmortization, 0),
    totalFgts: schedule.reduce((s, r) => s + r.fgtsDiscount, 0),
    firstPayment: schedule[0].total,
    lastPayment: schedule[schedule.length - 1].total,
    lastDate: schedule[schedule.length - 1].date,
    effectiveInstallments: schedule.length,
  }
}

module.exports = { calcSummary }
