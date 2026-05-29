-- Adiciona a coluna original_value na tabela de vagas (jobs) para acompanhar histórico de aumentos de orçamento
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS original_value text;
