const { toMonthlyRate } = require('./rates')
const { addMonths } = require('./formatters')

function generateSchedule({ loanAmount, startDate, system, interestRate, rateType, installments, plans, correction, insurance }) {
  const monthlyRate = toMonthlyRate(interestRate, rateType)
  const correctionMonthlyRate = correction.enabled ? toMonthlyRate(correction.rate, correction.rateType) : 0

  // FGTS plans
  const fgtsParcela = plans.filter(p => p.type === 'fgts_parcela')
  const fgtsSaldo = plans.filter(p => p.type === 'fgts_saldo')

  const schedule = []
  let balance = loanAmount

  // Price: fixed payment (before extras)
  const pricePayment = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1)
    : loanAmount / installments

  for (let i = 1; i <= installments; i++) {
    if (balance <= 0.01) break

    // Apply correction to balance
    const correctionAmount = balance * correctionMonthlyRate
    balance += correctionAmount

    // Interest on current balance
    const interest = balance * monthlyRate

    // Base amortization
    let baseAmort
    if (system === 'sac') {
      baseAmort = loanAmount / installments
    } else {
      baseAmort = pricePayment - interest
    }

    // Extra payments from plans (excluding FGTS parcela)
    let extraPayment = 0
    let fgtsSaldoAmount = 0
    for (const plan of plans) {
      if (plan.type === 'fgts_parcela' || plan.type === 'fgts_saldo') continue
      if (plan.type === 'unico' && i === plan.month) {
        extraPayment += plan.amount
      } else if (plan.type === 'mensal') {
        extraPayment += plan.amount
      } else if (plan.type === 'periodico' && plan.frequency > 0 && i % plan.frequency === 0) {
        extraPayment += plan.amount
      }
    }

    // FGTS Saldo: abate do saldo devedor no mes especifico (com recorrencia a cada 24 meses)
    for (const fp of fgtsSaldo) {
      if (fp.recurring) {
        if (i >= fp.month && (i - fp.month) % 24 === 0) {
          fgtsSaldoAmount += fp.amount
        }
      } else if (i === fp.month) {
        fgtsSaldoAmount += fp.amount
      }
    }
    extraPayment += fgtsSaldoAmount

    // Insurance
    let insuranceAmount = 0
    if (insurance.enabled) {
      if (insurance.type === 'fixo') {
        insuranceAmount = insurance.value
      } else {
        insuranceAmount = balance * (insurance.value / 100)
      }
    }

    // Limit base amortization to balance
    let effectiveBaseAmort = Math.min(baseAmort, balance)
    // Extra amortization limited to remaining balance after base
    let effectiveExtra = Math.min(extraPayment, balance - effectiveBaseAmort)
    let totalAmort = effectiveBaseAmort + effectiveExtra

    // Payment = base installment (without extra amortization)
    let payment = interest + effectiveBaseAmort + insuranceAmount + correctionAmount
    // Total = payment + extra amortization
    let total = payment + effectiveExtra

    // FGTS Parcela: divide equally across 12 months, cap at 80% of base payment (com recorrencia a cada 12 meses)
    let fgtsDiscount = 0
    let fgtsAmortExtra = 0
    for (const fp of fgtsParcela) {
      let isActive = false
      if (fp.recurring) {
        // Recurring: check if month i falls within any 12-month window starting at fp.month, fp.month+12, fp.month+24, etc.
        if (i >= fp.month) {
          const elapsed = i - fp.month
          const cyclePos = elapsed % 12
          isActive = true // every 12-month cycle
          // cyclePos is position within the current 12-month window
          void cyclePos // used implicitly: if i >= fp.month, it's always within some 12-month window
        }
      } else {
        isActive = i >= fp.month && i < fp.month + 12
      }
      if (isActive) {
        const monthlyFgts = fp.amount / 12
        const maxDiscount = payment * 0.8
        const discount = Math.min(monthlyFgts, maxDiscount)
        fgtsDiscount += discount
        if (fp.amortizeDiscount) {
          fgtsAmortExtra += discount
        }
      }
    }

    // Add FGTS amort extra (paid out of pocket) to amortization
    effectiveExtra += Math.min(fgtsAmortExtra, Math.max(balance - totalAmort, 0))
    totalAmort = effectiveBaseAmort + effectiveExtra
    total = payment + effectiveExtra

    balance = Math.max(balance - totalAmort, 0)

    const paymentDate = addMonths(new Date(startDate), i)

    schedule.push({
      month: i,
      date: paymentDate,
      balance: balance,
      amortization: effectiveBaseAmort,
      extraAmortization: effectiveExtra,
      interest,
      correction: correctionAmount,
      insurance: insuranceAmount,
      fgtsDiscount,
      fgtsSaldoAmount: Math.min(fgtsSaldoAmount, effectiveExtra),
      payment,
      total,
      totalWithFgts: total - fgtsDiscount,
    })
  }

  return schedule
}

module.exports = { generateSchedule }
