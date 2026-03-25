const { formatBRL } = require('./formatters')

function planTypeLabel(type) {
  const map = {
    unico: 'Pagamento Unico',
    mensal: 'Pagamento Mensal',
    periodico: 'Pagamento Periodico',
    fgts_parcela: 'FGTS - Parcelas',
    fgts_saldo: 'FGTS - Saldo Devedor',
  }
  return map[type] || type
}

function planDescription(plan) {
  if (plan.type === 'unico') return `${formatBRL(plan.amount)} no mes ${plan.month}`
  if (plan.type === 'mensal') return `${formatBRL(plan.amount)} por mes`
  if (plan.type === 'periodico') return `${formatBRL(plan.amount)} a cada ${plan.frequency} meses`
  if (plan.type === 'fgts_parcela') {
    const base = `${formatBRL(plan.amount)} em 12x de ${formatBRL(plan.amount / 12)} a partir do mes ${plan.month} (ate 80%)`
    const withAmort = plan.amortizeDiscount ? `${base} + amortizacao` : base
    return plan.recurring ? `${withAmort} (recorrente a cada 12 meses)` : withAmort
  }
  if (plan.type === 'fgts_saldo') {
    const base = `${formatBRL(plan.amount)} abatido do saldo no mes ${plan.month}`
    return plan.recurring ? `${base} (recorrente a cada 24 meses)` : base
  }
  return ''
}

module.exports = { planTypeLabel, planDescription }
