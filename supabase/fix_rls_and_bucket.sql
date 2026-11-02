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

-- ==============================================================================
-- 6. Carga de Dados Iniciais para Comprovação e Prints na Apresentação
-- ==============================================================================

-- Inserir Trabalhadores Oficiais
INSERT INTO public.trabalhadores (id, nome, cpf, cracha, diaria, updated_at, deleted_at, sync_status)
VALUES 
  ('trab-001', 'José da Silva', '52998224725', 'TRAB-001', 65.00, (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced'),
  ('trab-002', 'Maria Oliveira', '12345678909', 'TRAB-002', 70.00, (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced'),
  ('trab-003', 'Sebastião Santos', '98765432100', 'TRAB-003', 60.00, (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced')
ON CONFLICT (id) DO UPDATE 
  SET nome = EXCLUDED.nome, diaria = EXCLUDED.diaria, sync_status = 'synced';

-- Inserir Apontamentos de Colheita com Coordenadas GPS da Fazenda
INSERT INTO public.apontamentos (id, trabalhador_id, litros, latitude, longitude, data, updated_at, deleted_at, sync_status)
VALUES 
  ('apt-001', 'trab-001', 12.5, -21.2488, -44.9982, (extract(epoch from now()) * 1000)::BIGINT, (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced'),
  ('apt-002', 'trab-002', 18.0, -21.2501, -44.9975, (extract(epoch from now()) * 1000)::BIGINT, (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced'),
  ('apt-003', 'trab-001', 15.0, -21.2495, -44.9968, (extract(epoch from now()) * 1000)::BIGINT, (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced')
ON CONFLICT (id) DO UPDATE 
  SET litros = EXCLUDED.litros, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, sync_status = 'synced';

-- Inserir Despesas com Coordenadas GPS e Referência de Foto de Recibo
INSERT INTO public.despesas (id, descricao, valor, categoria, latitude, longitude, data, foto_uri, updated_at, deleted_at, sync_status)
VALUES 
  ('desp-001', 'Combustível Óleo 2T Motosserra', 140.00, 'Combustível', -21.2488, -44.9982, (extract(epoch from now()) * 1000)::BIGINT, 'https://ruujrkumwobhuzmwsqrp.supabase.co/storage/v1/object/public/recibos/comprovantes/recibo_combustivel.jpg', (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced'),
  ('desp-002', 'Limas para Afiação de Ferramentas', 65.00, 'Manutenção', -21.2505, -44.9960, (extract(epoch from now()) * 1000)::BIGINT, 'https://ruujrkumwobhuzmwsqrp.supabase.co/storage/v1/object/public/recibos/comprovantes/recibo_ferramentas.jpg', (extract(epoch from now()) * 1000)::BIGINT, NULL, 'synced')
ON CONFLICT (id) DO UPDATE 
  SET valor = EXCLUDED.valor, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, sync_status = 'synced';
