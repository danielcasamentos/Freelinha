-- ====================================================
-- Freelinha: Job Archival System
-- Vagas expiradas/deletadas são soft-deleted.
-- Matches e mensagens são preservadas (histórico).
-- ====================================================

-- 1. Adiciona coluna de soft-delete na tabela jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- 2. Quebrar o cascade de jobs→matches para preservar histórico de conversas
--    Precisamos recriar a FK sem ON DELETE CASCADE

-- Primeiro, descobre o nome da constraint (pode variar)
-- Remove a FK atual e recria com SET NULL para preservar matches
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_job_id_fkey;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_job_id_fkey
  FOREIGN KEY (job_id)
  REFERENCES public.jobs(id)
  ON DELETE SET NULL;

-- 3. Permite job_id ser NULL em matches (histórico arquivado)
ALTER TABLE public.matches
  ALTER COLUMN job_id DROP NOT NULL;

-- 4. Habilita que autores excluam suas próprias vagas (soft delete via update)
--    A política existente já permite update pelo autor.
--    Mas também precisamos de uma política de DELETE real para limpeza
--    (opcional — usaremos apenas soft delete pelo frontend).

-- 5. View opcional: vagas ativas (não deletadas e não expiradas)
CREATE OR REPLACE VIEW public.active_jobs AS
  SELECT *
  FROM public.jobs
  WHERE
    deleted_at IS NULL
    AND (date IS NULL OR date >= CURRENT_DATE);
