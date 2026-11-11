-- ==============================================================================
-- SafraCafé - Correção de Permissões RLS, Bucket S3 e Carga de Dados no Supabase
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

-- 5. Tabela e Políticas para Pontos / Trechos de Colheita (Mapa GPS)
CREATE TABLE IF NOT EXISTS public.trechos_colheita (
  id TEXT PRIMARY KEY,
  talhao TEXT NOT NULL,
  trabalhador_nome TEXT NOT NULL,
  inicio_lat DOUBLE PRECISION NOT NULL,
  inicio_lng DOUBLE PRECISION NOT NULL,
  inicio_data BIGINT NOT NULL,
  fim_lat DOUBLE PRECISION,
  fim_lng DOUBLE PRECISION,
  fim_data BIGINT,
  distancia_metros INTEGER,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  updated_at BIGINT NOT NULL
);

ALTER TABLE public.trechos_colheita ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir sincronizacao trechos_colheita" ON public.trechos_colheita;
CREATE POLICY "Permitir sincronizacao trechos_colheita"
  ON public.trechos_colheita FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Políticas de Upload e Acesso para o Bucket S3 'recibos'
DROP POLICY IF EXISTS "Upload autenticado no bucket recibos" ON storage.objects;
DROP POLICY IF EXISTS "Visualização pública de comprovantes de recibo" ON storage.objects;
DROP POLICY IF EXISTS "Remoção de recibo pelo proprietário" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload e visualizacao recibos" ON storage.objects;

CREATE POLICY "Permitir upload e visualizacao recibos"
  ON storage.objects FOR ALL
  TO anon, authenticated
  USING (bucket_id = 'recibos')
  WITH CHECK (bucket_id = 'recibos');

-- ==============================================================================
-- 7. Carga de Dados Oficiais (Alinhada aos Crachás QR Code do SafraCafé)
-- ==============================================================================

-- Inserir Trabalhadores Oficiais (Cleiton e Ana)
INSERT INTO public.trabalhadores (id, nome, cpf, cracha, diaria, updated_at, deleted_at, sync_status)
VALUES 
  ('3c00a58e-29a9-4832-89be-7f06bef09351', 'Cleiton', '64638659195', 'TRAB-01', 100.00, (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced'),
  ('7d8ca412-cc0e-4e9d-8fba-dda3cfaaf650', 'Ana', '64646562929', 'TRAB-2', 120.00, (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced')
ON CONFLICT (id) DO UPDATE 
  SET nome = EXCLUDED.nome, cracha = EXCLUDED.cracha, diaria = EXCLUDED.diaria, sync_status = 'synced';
