# SafraCafé — Gestão Offline-First da Colheita Cafeeira

Aplicativo mobile **offline-first** construído com **Expo SDK 58 / React Native 0.88 / Expo Router** para a **gestão operacional e financeira da colheita cafeeira**: cadastro de trabalhadores com **crachá QR Code 100% offline**, leitura de QR Code pela câmera, apontamento georreferenciado de balaios, despesas com foto do recibo enviada ao Bucket S3, controle de trechos em **mapa interativo estilo Google Maps** e sincronização assíncrona com o **Supabase**.

Arquitetado com **DDD + Clean Architecture + TDD** · `TypeScript ~6.0` · `Jest + jest-expo + RNTL` · `SQLite + ORM próprio` · `Supabase (Auth, PostgreSQL, Storage S3)` · `EAS Build (.apk) + OTA Interativo`

---

## Documentação Completa e Apresentação

- **Documentação Técnica Completa do Sistema (tudo o que usamos e como funciona):** [`docs/DOCUMENTACAO_COMPLETA_SISTEMA.md`](docs/DOCUMENTACAO_COMPLETA_SISTEMA.md)
- **Apresentação Interativa em Slides (12 tópicos da prova + APK + OTA):** [`apresentacao_roteiro_prova.html`](apresentacao_roteiro_prova.html)

---

## Principais Funcionalidades

- **Autenticação & Sessão Segura**: Supabase Auth (`SupabaseAuthGateway`) com sessão persistida criptografada no hardware via `expo-secure-store` (`SessionStorageSecureStore`) e restauração automática no boot.
- **Trabalhadores & Crachás QR Code 100% Offline**: CRUD completo com autovalidação de CPF/diária e geração local de matriz QR (`qrcode`) no app (`CrachaModal`) e em SVG vetorial para impressão/PDF (`expo-print` + `expo-sharing`), sem depender de internet.
- **Apontamento de Balaios com Câmera & GPS Eco**: leitura rápida de QR Code (`expo-camera`) ou seleção por chips, volume em litros e captura pontual de GPS (`expo-location` com timeout 4s e fallback seguro). Filtros de **Hoje vs. Todos/Arquivados** (`DD/MM/AAAA às HH:MM`).
- **Despesas com Foto de Recibo no S3**: cadastro por categoria com captura de nota fiscal (`expo-image-picker`), armazenamento local (`LocalReceiptStorage`) e upload binário para o bucket `recibos` do Supabase Storage.
- **Mapa da Lavoura & Pontos da Colheita**: marcação de **Ponto Inicial** e **Ponto Final** com cálculo de distância por **Haversine** (`trechosStorage.ts`), renderizado em `@expo/dom-webview` via motor Web Mercator próprio (`mapHtmlBuilder.ts`) exibindo camadas **Satélite Híbrido**, **Padrão** e **Terreno** (tiles Google Maps + backup Esri/OSM + grade offline integrada) e atalho para o Google Maps externo.
- **Sincronização Offline-First Resiliente**: fila transacional `sync_queue` (Outbox) no SQLite (`safracafe.db`), resolução de conflitos **Last-Write-Wins (LWW)**, Soft Delete (`deleted_at`), upload de recibos S3, espelhamento de `trechos_colheita` e disparo automático ao gravar, ao retornar ao app (`AppState`) e a cada 15s (`autoSync.ts`).
- **Atualizações Over-the-Air (OTA) Interativas**: componente `OtaUpdatePrompt` com `expo-updates` exibindo o modal **"Atualização do Sistema"** para aplicar a nova versão com 1 toque em **"OK, Atualizar"**.

---

## Arquitetura de Pastas

```text
app/                      Telas e rotas Expo Router (Login, Drawer, Tabs, Detalhes, Modal)
src/
  domain/                 Entidades, Value Objects, Serviços e Contratos (100% puro, sem SDK)
  usecases/               13 Casos de Uso com injeção de dependências via construtor
  infra/
    sqlite/               DatabaseClient, OrmSchema, OrmClient e repositórios SQLite
    supabase/             SupabaseAuthGateway, SupabaseSyncGateway, SupabaseStorageGateway
    filesystem/           LocalReceiptStorage (comprovantes locais)
  adapters/auth/          AuthContext (useAuth) e SessionStorageSecureStore
  factory/                container.ts (Singleton de composição de dependências)
  features/mapas/         MapaLavoura (.native/.web), mapHtmlBuilder e trechosStorage
  shared/                 Componentes reutilizáveis (CrachaModal, OtaUpdatePrompt) e utilitários
supabase/                 Scripts SQL de schema, tabelas, bucket 'recibos' e políticas RLS
tests/                    39 suítes com 146 testes automatizados
docs/                     Documentação completa do sistema e especificações de engenharia
```

---

## Comandos Úteis

```bash
npm install            # Instala as dependências
npx expo start -c      # Inicia o Metro Bundler
npx tsc --noEmit       # Validação de tipos TypeScript (0 erros)
npm run lint           # Expo Lint / ESLint (0 erros e 0 avisos)
npx expo-doctor        # Diagnóstico oficial Expo (20/20 checks)
npm test               # Suíte Jest + RNTL (39 suítes / 146 testes)
npm run db:check       # Verifica registros e arquivos S3 no Supabase
```

**Conta oficial de campo configurada:** `joao@safracafe.com`
