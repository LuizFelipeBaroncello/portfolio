export interface ValidationResult {
  valid: boolean
  message?: string
}

export function validateLoanAmount(v: number): ValidationResult {
  if (!v || v <= 0) {
    return { valid: false, message: 'O valor do emprestimo deve ser maior que zero.' }
  }
  return { valid: true }
}

export function validateRate(v: number): ValidationResult {
  if (v < 0) {
    return { valid: false, message: 'A taxa de juros nao pode ser negativa.' }
  }
  if (v > 30) {
    return { valid: true, message: 'Aviso: taxa muito alta (acima de 30% a.a.).' }
  }
  return { valid: true }
}

export function validateTerm(v: number): ValidationResult {
  if (!v || v <= 0) {
    return { valid: false, message: 'O prazo deve ser maior que zero.' }
  }
  if (!Number.isInteger(v)) {
    return { valid: false, message: 'O prazo deve ser um numero inteiro.' }
  }
  return { valid: true }
}

export function validateFgts(v: number, loanAmount: number): ValidationResult {
  if (v < 0) {
    return { valid: false, message: 'O valor do FGTS nao pode ser negativo.' }
  }
  if (v >= loanAmount) {
    return { valid: false, message: 'O valor do FGTS deve ser menor que o valor financiado.' }
  }
  return { valid: true }
}

export function validateExtraPayment(v: number): ValidationResult {
  if (v < 0) {
    return { valid: false, message: 'O pagamento extra nao pode ser negativo.' }
  }
  return { valid: true }
}
