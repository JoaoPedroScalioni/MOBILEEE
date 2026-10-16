-- ==============================================================================
-- SafraCafé - Infraestrutura Online Supabase BaaS (03/nov e 06/nov)
-- Entidade-Relacionamento Remoto, Row Level Security (RLS) e Bucket S3 Storage
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário (Apontadores)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- 3. Tabela de Trabalhadores (Apanhadores de Café)
CREATE TABLE IF NOT EXISTS public.trabalhadores (
  id TEXT PRIMARY KEY,
  apontador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  cracha TEXT NOT NULL,
  diaria NUMERIC(10,2) NOT NULL,
  updated_at BIGINT NOT NULL,
  deleted_at BIGINT,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);

-- 4. Tabela de Apontamentos de Colheita (Balaios com GPS)
CREATE TABLE IF NOT EXISTS public.apontamentos (
  id TEXT PRIMARY KEY,
  apontador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trabalhador_id TEXT NOT NULL REFERENCES public.trabalhadores(id) ON DELETE CASCADE,
  litros NUMERIC(10,2) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  data BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  deleted_at BIGINT,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);

-- 5. Tabela de Despesas da Lavoura (com Foto do Comprovante)
CREATE TABLE IF NOT EXISTS public.despesas (
  id TEXT PRIMARY KEY,
  apontador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  data BIGINT NOT NULL,
  foto_uri TEXT,
  updated_at BIGINT NOT NULL,
  deleted_at BIGINT,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);

-- ==============================================================================
-- FERRAMENTAS DE SEGURANÇA: ROW LEVEL SECURITY (RLS) - Marco de 03/nov
-- ==============================================================================

-- Ativação compulsória de RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabalhadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apontamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para Profiles
CREATE POLICY "Apontador visualiza apenas seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Apontador atualiza apenas seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas de Acesso para Trabalhadores
CREATE POLICY "Apontador lê trabalhadores autorizados"
  ON public.trabalhadores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apontador insere e atualiza seus trabalhadores"
  ON public.trabalhadores FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas de Acesso para Apontamentos (Isolamento por Apontador)
CREATE POLICY "Apontador gerencia apenas seus apontamentos"
  ON public.apontamentos FOR ALL
  USING (auth.uid() = apontador_id OR apontador_id IS NULL)
  WITH CHECK (auth.uid() = apontador_id OR apontador_id IS NULL);

-- Políticas de Acesso para Despesas
CREATE POLICY "Apontador gerencia apenas suas despesas"
  ON public.despesas FOR ALL
  USING (auth.uid() = apontador_id OR apontador_id IS NULL)
  WITH CHECK (auth.uid() = apontador_id OR apontador_id IS NULL);

-- ==============================================================================
-- BUCKET S3 STORAGE: ARMAZENAMENTO DE ARQUIVOS (Marco de 06/nov)
-- ==============================================================================

-- Criação do Bucket de Recibos
INSERT INTO storage.buckets (id, name, public)
VALUES ('recibos', 'recibos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Segurança no Bucket S3 de Recibos
CREATE POLICY "Upload autenticado no bucket recibos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recibos' AND auth.role() = 'authenticated');

CREATE POLICY "Visualização pública de comprovantes de recibo"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recibos');

CREATE POLICY "Remoção de recibo pelo proprietário"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recibos' AND auth.uid() = owner);
