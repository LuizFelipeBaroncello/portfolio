const { formatBRL, formatDate, formatMonth, addMonths } = require('./formatters')
const { toMonthlyRate } = require('./rates')
const { generateSchedule } = require('./schedule')
const { calculateInvestment } = require('./investment')
const { calcSummary } = require('./summary')
const { planTypeLabel, planDescription } = require('./plan-helpers')

module.exports = {
  formatBRL,
  formatDate,
  formatMonth,
  addMonths,
  toMonthlyRate,
  generateSchedule,
  calculateInvestment,
  calcSummary,
  planTypeLabel,
  planDescription,
}
