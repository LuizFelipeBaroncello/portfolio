import type { NextApiRequest, NextApiResponse } from 'next'
import { createServiceClient } from '../../lib/supabase'

const NUMERIC_FIELDS = [
  'custo_carro',
  'combustivel_energia',
  'tag_estacionamento',
  'limpeza',
  'documentos_seguro',
  'outros',
  'total_geral'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc('get_ev_stats')

  if (error) {
    console.error('Supabase RPC error:', error)
    return res.status(500).json({ error: 'Failed to fetch EV stats' })
  }

  // Normalize: ensure all numeric values are positive
  const normalized = (data || []).map((row: any) => {
    const out: Record<string, any> = { mes: row.mes }
    for (const field of NUMERIC_FIELDS) {
      out[field] = Math.abs(Number(row[field]) || 0)
    }
    return out
  })

  return res.status(200).json(normalized)
}
