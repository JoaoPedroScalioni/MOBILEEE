-- ==============================================================================
-- SafraCafé - Correção de Permissões RLS e Bucket S3 no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/ruujrkumwobhuzmwsqrp/sql
-- ==============================================================================

-- 1. Criação do Bucket S3 de Recibos como Público (caso não exista)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recibos', 'recibos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Habilitar sincronização da tabela 'trabalhadores'
ALTER TABLE public.trabalhadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Apontador lê trabalhadores autorizados" ON public.trabalhadores;
DROP POLICY IF EXISTS "Apontador insere e atualiza seus trabalhadores" ON public.trabalhadores;
DROP POLICY IF EXISTS "Permitir sincronizacao trabalhadores" ON public.trabalhadores;
CREATE POLICY "Permitir sincronizacao trabalhadores"
  ON public.trabalhadores FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Habilitar sincronização da tabela 'apontamentos'
ALTER TABLE public.apontamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Apontador gerencia apenas seus apontamentos" ON public.apontamentos;
DROP POLICY IF EXISTS "Permitir sincronizacao apontamentos" ON public.apontamentos;
CREATE POLICY "Permitir sincronizacao apontamentos"
  ON public.apontamentos FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Habilitar sincronização da tabela 'despesas'
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Apontador gerencia apenas suas despesas" ON public.despesas;
DROP POLICY IF EXISTS "Permitir sincronizacao despesas" ON public.despesas;
CREATE POLICY "Permitir sincronizacao despesas"
  ON public.despesas FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Políticas de Upload e Acesso para o Bucket S3 'recibos'
DROP POLICY IF EXISTS "Upload autenticado no bucket recibos" ON storage.objects;
DROP POLICY IF EXISTS "Visualização pública de comprovantes de recibo" ON storage.objects;
DROP POLICY IF EXISTS "Remoção de recibo pelo proprietário" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload e visualizacao recibos" ON storage.objects;

CREATE POLICY "Permitir upload e visualizacao recibos"
  ON storage.objects FOR ALL
  TO anon, authenticated
  USING (bucket_id = 'recibos')
  WITH CHECK (bucket_id = 'recibos');

