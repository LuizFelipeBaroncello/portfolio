-- Run this in your Supabase SQL Editor to create the RPC function
-- that powers the /api/ev-stats endpoint.
-- Returns raw numeric values (not formatted strings).

DROP FUNCTION IF EXISTS get_ev_stats();

CREATE OR REPLACE FUNCTION get_ev_stats()
RETURNS TABLE (
  mes TEXT,
  custo_carro NUMERIC,
  combustivel_energia NUMERIC,
  tag_estacionamento NUMERIC,
  limpeza NUMERIC,
  documentos_seguro NUMERIC,
  outros NUMERIC,
  total_geral NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'finance'
AS $$
  WITH transacoes_classificadas AS (
    SELECT
      date_trunc('month', t.date) as mes_data,
      ABS(t.amount) as amount,
      CASE
        WHEN t.description ILIKE ANY (ARRAY['%AYMORE%', '%DVA AUTO IMPORT%', '%DVA AUTO%', '%SANTANDER SOCIEDADE DE CREDITO  FINANCIA%']) OR ABS(t.amount) > 5000
          THEN 'custo_carro'
        WHEN t.description ILIKE ANY (ARRAY['%SHELL%', '%RECARGA%', '%ELETRO%', '%POSTO%', '%IPIRANGA%', '%PETROBRAS%', '%TUPINAMBA%', '%EZVOLT%', '%CIA CHARGE%', '%WECHARGE%', '%ONCHARGE%', '%WEMOB%', '%CELESC%', '%GRAAL%', '%ONCHARGER%', '%RS INSTALACOES%', '%CARREGAMENTO CARRO LAGES%'])
          THEN 'combustivel_energia'
        WHEN t.description ILIKE ANY (ARRAY['%ULTRAP%', '%CONECTCAR%', '%ALLPARK%', '%ESTACIONAMENTO%', '%CONTINENTE PARK%', '%PROPARK%'])
          THEN 'tag_estacionamento'
        WHEN t.description ILIKE ANY (ARRAY['%DANIEL DAVID%', '%DIAMOND%', '%ANTOS LAVACAO%', '%BLACK BOX%', '%NP CAR DETAIL%'])
          THEN 'limpeza'
        WHEN t.description ILIKE ANY (ARRAY['%SEINFRA%', '%SEFAZ SANTA%', '%SEFAZ SANTA CATARINA%', '%PORTOSEG%', '%PORTO SEGURO%', '%EV COMERCIO DE VEICULOS%', '%Transferência enviada pelo Pix - SECRETARIA DE ESTADO DA FAZENDA - 82.951.310/0001-56 - BCO DO BRASIL S.A. (0001) Agência: 3582 Conta: 1004-9%'])
          THEN 'documentos_seguro'
        ELSE 'outros'
      END as classificacao
    FROM finance.transaction t
    JOIN finance.re_category_transaction rct ON t.trans_id = rct.trans_id
    JOIN finance.category c ON rct.category_id = c.category_id
    WHERE (c.category_name ILIKE '%carro%' OR c.category_name ILIKE '%veículo%')
      AND t.type = 'debit'
  )
  SELECT
    TO_CHAR(mes_data, 'YYYY-MM') as mes,
    COALESCE(SUM(CASE WHEN classificacao = 'custo_carro' THEN amount ELSE 0 END), 0) as custo_carro,
    COALESCE(SUM(CASE WHEN classificacao = 'combustivel_energia' THEN amount ELSE 0 END), 0) as combustivel_energia,
    COALESCE(SUM(CASE WHEN classificacao = 'tag_estacionamento' THEN amount ELSE 0 END), 0) as tag_estacionamento,
    COALESCE(SUM(CASE WHEN classificacao = 'limpeza' THEN amount ELSE 0 END), 0) as limpeza,
    COALESCE(SUM(CASE WHEN classificacao = 'documentos_seguro' THEN amount ELSE 0 END), 0) as documentos_seguro,
    COALESCE(SUM(CASE WHEN classificacao = 'outros' THEN amount ELSE 0 END), 0) as outros,
    COALESCE(SUM(amount), 0) as total_geral
  FROM transacoes_classificadas
  GROUP BY mes_data
  ORDER BY mes_data ASC;
$$;
