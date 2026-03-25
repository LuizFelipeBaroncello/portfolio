const { toMonthlyRate } = require('./rates')

function calculateInvestment({ schedule, baseSchedule, investmentRate, includeMonthly }) {
  const monthlyRate = investmentRate
  const fgtsMonthlyRate = toMonthlyRate(3, 'anual') // FGTS rende 3% a.a.
  const months = baseSchedule.length

  // Separate: investment (extra amortization) vs FGTS (cannot be freely invested)
  let invested = 0
  let balance = 0
  let fgtsInvested = 0
  let fgtsBalance = 0

  for (let i = 0; i < months; i++) {
    const extra = schedule[i] ? schedule[i].extraAmortization : 0
    const fgtsParcelaDiscount = schedule[i] ? schedule[i].fgtsDiscount : 0
    const fgtsSaldoAmt = schedule[i] ? (schedule[i].fgtsSaldoAmount || 0) : 0
    const totalFgtsThisMonth = fgtsParcelaDiscount + fgtsSaldoAmt

    // Investment: only extra amortization from pocket (exclude FGTS saldo portion)
    let monthlyInvestment = extra - fgtsSaldoAmt

    // If includeMonthly: also invest the difference in payment
    if (includeMonthly && schedule[i] && baseSchedule[i]) {
      const saving = baseSchedule[i].payment - schedule[i].payment
      if (saving > 0) monthlyInvestment += saving
    }

    invested += monthlyInvestment
    balance = (balance + monthlyInvestment) * (1 + monthlyRate)

    // FGTS (parcela + saldo devedor): rende separado a 3% a.a.
    fgtsInvested += totalFgtsThisMonth
    fgtsBalance = (fgtsBalance + totalFgtsThisMonth) * (1 + fgtsMonthlyRate)
  }

  // Continue compounding for remaining months if schedule ended early
  const remainingMonths = months - (schedule.length || 0)
  for (let i = 0; i < remainingMonths; i++) {
    balance = balance * (1 + monthlyRate)
    fgtsBalance = fgtsBalance * (1 + fgtsMonthlyRate)
  }

  return {
    invested,
    finalBalance: balance,
    profit: balance - invested,
    fgtsInvested,
    fgtsFinalBalance: fgtsBalance,
    fgtsProfit: fgtsBalance - fgtsInvested,
    totalPatrimony: balance + fgtsBalance,
  }
}

module.exports = { calculateInvestment }
