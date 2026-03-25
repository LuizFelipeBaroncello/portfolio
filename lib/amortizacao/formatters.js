function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatMonth(date) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

module.exports = { formatBRL, formatDate, formatMonth, addMonths }
