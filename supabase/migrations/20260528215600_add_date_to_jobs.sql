-- Adiciona a coluna date na tabela de vagas (jobs)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS date date;
