// Illustrative data — used as fallback when the Supabase API is unavailable.
// These values are representative examples and do not reflect real expenses.

export interface FallbackRow {
  mes: string
  custo_carro: number
  combustivel_energia: number
  tag_estacionamento: number
  limpeza: number
  documentos_seguro: number
  outros: number
}

const EV_STATS_FALLBACK: FallbackRow[] = [
  {
    mes: '2024-03',
    custo_carro: 2800,
    combustivel_energia: 180,
    tag_estacionamento: 95,
    limpeza: 60,
    documentos_seguro: 350,
    outros: 40,
  },
  {
    mes: '2024-04',
    custo_carro: 2800,
    combustivel_energia: 195,
    tag_estacionamento: 110,
    limpeza: 60,
    documentos_seguro: 0,
    outros: 25,
  },
  {
    mes: '2024-05',
    custo_carro: 2800,
    combustivel_energia: 210,
    tag_estacionamento: 120,
    limpeza: 80,
    documentos_seguro: 0,
    outros: 55,
  },
  {
    mes: '2024-06',
    custo_carro: 2800,
    combustivel_energia: 185,
    tag_estacionamento: 105,
    limpeza: 60,
    documentos_seguro: 0,
    outros: 30,
  },
  {
    mes: '2024-07',
    custo_carro: 2800,
    combustivel_energia: 220,
    tag_estacionamento: 130,
    limpeza: 60,
    documentos_seguro: 0,
    outros: 45,
  },
  {
    mes: '2024-08',
    custo_carro: 2800,
    combustivel_energia: 205,
    tag_estacionamento: 115,
    limpeza: 80,
    documentos_seguro: 0,
    outros: 20,
  },
  {
    mes: '2024-09',
    custo_carro: 2800,
    combustivel_energia: 190,
    tag_estacionamento: 100,
    limpeza: 60,
    documentos_seguro: 1200,
    outros: 35,
  },
  {
    mes: '2024-10',
    custo_carro: 2800,
    combustivel_energia: 215,
    tag_estacionamento: 125,
    limpeza: 60,
    documentos_seguro: 0,
    outros: 60,
  },
  {
    mes: '2024-11',
    custo_carro: 2800,
    combustivel_energia: 230,
    tag_estacionamento: 140,
    limpeza: 80,
    documentos_seguro: 0,
    outros: 50,
  },
  {
    mes: '2024-12',
    custo_carro: 2800,
    combustivel_energia: 200,
    tag_estacionamento: 110,
    limpeza: 100,
    documentos_seguro: 0,
    outros: 90,
  },
  {
    mes: '2025-01',
    custo_carro: 2800,
    combustivel_energia: 175,
    tag_estacionamento: 95,
    limpeza: 60,
    documentos_seguro: 0,
    outros: 30,
  },
  {
    mes: '2025-02',
    custo_carro: 2800,
    combustivel_energia: 185,
    tag_estacionamento: 100,
    limpeza: 60,
    documentos_seguro: 0,
    outros: 25,
  },
]

export default EV_STATS_FALLBACK
