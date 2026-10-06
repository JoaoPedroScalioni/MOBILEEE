# -*- coding: utf-8 -*-
import re

file_path = 'c:/PROJETOMOBILE/apresentacao.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def make_callout(importancia, onde_esta):
    return f'''
            <!-- Destaque: Por que é importante & Onde está no app -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-left">
                <div class="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-start space-x-2.5 shadow-sm">
                    <div class="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-base flex-shrink-0">🎯</div>
                    <div>
                        <div class="text-[10.5px] font-mono font-bold uppercase tracking-wider text-amber-400">Por que é importante ter isso?</div>
                        <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">{importancia}</p>
                    </div>
                </div>
                <div class="bg-blue-950/40 border border-blue-600/40 rounded-xl p-3 flex items-start space-x-2.5 shadow-sm">
                    <div class="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-base flex-shrink-0">📂</div>
                    <div>
                        <div class="text-[10.5px] font-mono font-bold uppercase tracking-wider text-blue-400">Onde está no nosso app?</div>
                        <p class="text-xs text-slate-300 mt-0.5 font-mono leading-relaxed">{onde_esta}</p>
                    </div>
                </div>
            </div>'''

# -------------------------------------------------------------
# SLIDE 1: CAPA
# -------------------------------------------------------------
slide1_callout = make_callout(
    'Blindar as regras de negócio centrais da colheita cafeeira antes de acoplar qualquer banco físico ou framework de UI. Evita retrabalho estrutural e garante domínio puro 100% testável.',
    'Raiz arquitetural: <code>src/domain/</code>, <code>src/usecases/</code>, <code>src/adapters/</code>, <code>src/infra/</code>, <code>src/factory/container.ts</code> e suíte em <code>tests/</code>.'
)

content = re.sub(
    r'(<section id="slide1"[^>]*>[\s\S]*?<div class="text-center max-w-4xl mx-auto space-y-4">[\s\S]*?<p class="text-xs sm:text-sm font-mono text-emerald-400 font-bold uppercase tracking-wider">)([\s\S]*?)(</p>)',
    r'\1Projeto SafraCafé — Gestão Offline-First da Colheita Cafeeira (Domínio e Interface Primeiro)\3',
    content
)

# Insert callout into slide 1 right below the title/subtitle if not already there
if 'Por que é importante ter isso?' not in content[content.find('id="slide1"'):content.find('id="slide2"')]:
    needle = '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">'
    replacement = slide1_callout + '\n            ' + needle
    # Replace only in slide 1
    pos1 = content.find('id="slide1"')
    pos2 = content.find('id="slide2"')
    slide1_text = content[pos1:pos2]
    slide1_text = slide1_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide1_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 2: TELAS GERAL
# -------------------------------------------------------------
slide2_callout = make_callout(
    'A experiência mobile no cafezal precisa ser ágil, com botões amplos, alto contraste sob sol direto e resposta imediata sem travar mesmo sem nenhum sinal de rede móvel (offline-first).',
    'Rotas do Expo Router em <code>app/(drawer)/(tabs)/</code> e componentes de navegação em <code>app/</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide2"'):content.find('id="slide3"')]:
    needle = '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 max-w-6xl mx-auto mb-4">'
    replacement = slide2_callout + '\n            ' + needle
    pos1 = content.find('id="slide2"')
    pos2 = content.find('id="slide3"')
    slide2_text = content[pos1:pos2]
    slide2_text = slide2_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide2_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 3: LOGIN
# -------------------------------------------------------------
slide3_callout = make_callout(
    'Garante a autenticação segura do operador rural com tokens criptografados no hardware nativo do smartphone, mantendo o acesso ativo mesmo quando o celular perde sinal no meio da lavoura.',
    'Tela: <code>app/login.tsx</code> · Casos de Uso: <code>src/usecases/AuthenticateUser.ts</code>, <code>RestoreSession.ts</code> · Teste: <code>tests/screens/LoginScreen.test.tsx</code>.'
)
# Fix TokenSupervisor in Slide 3
content = content.replace('<code>Session</code>, <code>TokenSupervisor</code>', '<code>Session</code>, <code>User</code>')

if 'Por que é importante ter isso?' not in content[content.find('id="slide3"'):content.find('id="slide4"')]:
    needle = '<!-- Destaques Operacionais -->'
    replacement = slide3_callout + '\n\n                ' + needle
    pos1 = content.find('id="slide3"')
    pos2 = content.find('id="slide4"')
    slide3_text = content[pos1:pos2]
    slide3_text = slide3_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide3_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 4: APONTAMENTO
# -------------------------------------------------------------
slide4_callout = make_callout(
    'É o coração operacional da colheita cafeeira. Registra a pesagem/balaios em litros, lê o QR Code do apanhador e vincula as coordenadas GPS para rastreabilidade auditável de cada talhão.',
    'Tela: <code>app/(drawer)/(tabs)/apontamento.tsx</code> · Entidades: <code>Apontamento</code>, <code>QuantidadeBalaio</code> · Testes: <code>tests/domain/Apontamento.test.ts</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide4"'):content.find('id="slide5"')]:
    needle = '<!-- Destaques -->'
    replacement = slide4_callout + '\n\n                ' + needle
    pos1 = content.find('id="slide4"')
    pos2 = content.find('id="slide5"')
    slide4_text = content[pos1:pos2]
    slide4_text = slide4_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide4_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 5: TRABALHADORES
# -------------------------------------------------------------
slide5_callout = make_callout(
    'Identificação nominal e serial unívoca de cada apanhador (TRAB-001, TRAB-002) com CPF validado e valor de diária fixado, eliminando confusões no fechamento contábil e pagamentos.',
    'Tela: <code>app/(drawer)/(tabs)/trabalhadores.tsx</code> · Entidade: <code>src/domain/entities/Trabalhador.ts</code> · Testes: <code>tests/domain/Trabalhador.test.ts</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide5"'):content.find('id="slide6"')]:
    needle = '<!-- Destaques -->'
    replacement = slide5_callout + '\n\n                ' + needle
    pos1 = content.find('id="slide5"')
    pos2 = content.find('id="slide6"')
    slide5_text = content[pos1:pos2]
    slide5_text = slide5_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide5_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 6: DESPESAS
# -------------------------------------------------------------
slide6_callout = make_callout(
    'Controle minucioso de custos de safra (combustível, lubrificantes de derriçadoras, insumos) com comprovante fotográfico e GPS do local de compra, prevenindo fraudes e perda de notas.',
    'Tela: <code>app/(drawer)/(tabs)/despesas.tsx</code> · Entidade: <code>src/domain/entities/Despesa.ts</code> · Testes: <code>tests/domain/Despesa.test.ts</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide6"'):content.find('id="slide7"')]:
    needle = '<!-- Destaques -->'
    replacement = slide6_callout + '\n\n                ' + needle
    pos1 = content.find('id="slide6"')
    pos2 = content.find('id="slide7"')
    slide6_text = content[pos1:pos2]
    slide6_text = slide6_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide6_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 7: MAPA
# -------------------------------------------------------------
slide7_callout = make_callout(
    'Monitoramento geoespacial dos talhões da fazenda cafeeira no Sul de Minas, permitindo identificar onde a colheita está concentrada e otimizar rotas de tratores e transporte de café.',
    'Tela: <code>app/(drawer)/(tabs)/mapa.tsx</code> · Gateway: <code>src/domain/gateways/LocationGateway.ts</code> · VO: <code>src/domain/value-objects/Coordinates.ts</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide7"'):content.find('id="slide-checklist"')]:
    needle = '<!-- Destaques -->'
    replacement = slide7_callout + '\n\n                ' + needle
    pos1 = content.find('id="slide7"')
    pos2 = content.find('id="slide-checklist"')
    slide7_text = content[pos1:pos2]
    slide7_text = slide7_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide7_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE CHECKLIST: 8 PASSOS 100% SAFRACAFÉ
# -------------------------------------------------------------
slide_checklist_callout = make_callout(
    'Estabelece o fluxo metódico de engenharia de software da equipe no SafraCafé: construir regras puras primeiro, orquestração depois, adaptadores de hardware e por fim telas RNTL, tudo orientado a TDD.',
    'Distribuição nas camadas: <code>src/domain/</code> → <code>src/usecases/</code> → <code>src/adapters/</code> → <code>src/factory/container.ts</code> → <code>tests/</code>.'
)

new_checklist_slide = f'''        <!-- ========================================================================= -->
        <!-- SLIDE CHECKLIST: 7. CHECKLIST SEQUENCIAL DE CONSTRUÇÃO (8 PASSOS SAFRACAFÉ) -->
        <!-- ========================================================================= -->
        <section id="slide-checklist">
            <div class="text-center mb-5">
                <span class="inline-block py-1 px-3 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase tracking-widest mb-2">Item 7 · Planejamento Oficial de Engenharia</span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">Checklist Sequencial de Construção</h2>
                <p class="mt-2 text-slate-400 text-sm md:text-base max-w-3xl mx-auto">
                    A ordem exata de implementação adotada pela equipe no <strong class="text-emerald-400">SafraCafé</strong>: Domínio → Use Cases → Context API / Sessão Segura → Telas RNTL com Fakes, 100% orientada a TDD (ciclo Red-Green-Refactor).
                </p>
            </div>

            {slide_checklist_callout}

            <!-- Grid com os 8 Passos Oficiais SafraCafé -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto w-full">
                
                <!-- Passo 1 -->
                <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Passo 1</span>
                            <span class="text-[11px] text-emerald-400 font-mono">100% Coberto</span>
                        </div>
                        <h3 class="text-base font-bold text-white mb-1.5">Value Objects (Imutáveis)</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            <code>QuantidadeBalaio</code> (volume > 0 litros colhidos no cafezal), <code>ValorMonetario</code> (diárias em R$ 60,00 e despesas ≥ 0), <code>Coordinates</code> (latitude [-90, 90] e longitude [-180, 180] GPS) e <code>SyncStatus</code> (PENDING, SYNCED, ERROR).
                        </p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>🧪 Testes Puros</span>
                        <a href="#slide8" class="text-emerald-400 hover:underline">Ver Código ➔</a>
                    </div>
                </div>

                <!-- Passo 2 -->
                <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Passo 2</span>
                            <span class="text-[11px] text-emerald-400 font-mono">Invariantes OK</span>
                        </div>
                        <h3 class="text-base font-bold text-white mb-1.5">Entities & Aggregates</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            <code>Trabalhador</code> (Aggregate Root com CPF 11 dígitos, crachá TRAB-001/002 e diária), <code>Apontamento</code> (lançamento da colheita vinculando colhedor, balaios e GPS), <code>Despesa</code> (registro com foto do comprovante), <code>SyncQueueItem</code> e <code>Session</code>.
                        </p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>🛡️ Invariantes Blindadas</span>
                        <a href="#slide9" class="text-emerald-400 hover:underline">Ver Código ➔</a>
                    </div>
                </div>

                <!-- Passo 3 -->
                <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Passo 3</span>
                            <span class="text-[11px] text-emerald-400 font-mono">Regras Cruzadas</span>
                        </div>
                        <h3 class="text-base font-bold text-white mb-1.5">Domain Services</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            <code>SincronizacaoService</code> (resolução determinística de conflitos na fila offline-first via comparação Last-Write-Wins com timestamps) e Regras de Fechamento de Colheita (apuração diária de balaios colhidos sem perda de dados na roça).
                        </p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>⚙️ Domínio Puro</span>
                        <a href="#slide10" class="text-emerald-400 hover:underline">Ver Código ➔</a>
                    </div>
                </div>

                <!-- Passo 4 -->
                <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Passo 4</span>
                            <span class="text-[11px] text-emerald-400 font-mono">DIP Estrito</span>
                        </div>
                        <h3 class="text-base font-bold text-white mb-1.5">Repository & Gateway Interfaces</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            Contratos puros definidos no domínio: <code>TrabalhadorRepository</code>, <code>ApontamentoRepository</code>, <code>DespesaRepository</code>, <code>SyncQueueGateway</code>, <code>CameraGateway</code>, <code>LocationGateway</code> e <code>AuthGateway</code>.
                        </p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>🔌 Zero Infra no Domínio</span>
                        <a href="#slide11" class="text-emerald-400 hover:underline">Ver Código ➔</a>
                    </div>
                </div>

                <!-- Passo 5 -->
                <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Passo 5</span>
                            <span class="text-[11px] text-emerald-400 font-mono">10 Use Cases</span>
                        </div>
                        <h3 class="text-base font-bold text-white mb-1.5">Use Cases (TDD & Fakes)</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            Orquestração com fakes em memória (ciclo <strong>Red-Green-Refactor</strong>): <code>RegistrarApontamento</code>, <code>CadastrarTrabalhador</code>, <code>RegistrarDespesa</code>, <code>AuthenticateUser</code>, <code>SyncPendingQueue</code>, <code>ListarApontamentos</code> e <code>ListarTrabalhadores</code>.
                        </p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>🔄 Red-Green-Refactor</span>
                        <a href="#slide12" class="text-emerald-400 hover:underline">Ver Código ➔</a>
                    </div>
                </div>

                <!-- Passo 6 -->
                <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Passo 6</span>
                            <span class="text-[11px] text-emerald-400 font-mono">Sem Prop Drilling</span>
                        </div>
                        <h3 class="text-base font-bold text-white mb-1.5">Context API & Custom Hooks</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            <code>AuthContext.tsx</code> provê a sessão do operador cafeeiro (<code>pesquisador@ecofield.app</code>). Custom Hooks de ponte como <code>useAuth</code>, <code>useApontamentos</code> e <code>useTrabalhadores</code> gerenciam os estados reativos isolando as telas.
                        </p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>⚓ React Hooks Puros</span>
                        <a href="#slide15" class="text-emerald-400 hover:underline">Ver Código ➔</a>
                    </div>
                </div>

                <!-- Passo 7 -->
                <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Passo 7</span>
                            <span class="text-[11px] text-emerald-400 font-mono">RNTL + Fakes</span>
                        </div>
                        <h3 class="text-base font-bold text-white mb-1.5">Telas RNTL & Expo Router</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            Fronteira visual Boundary em <code>app/</code> com telas <code>LoginScreen</code>, <code>ApontamentoScreen</code> (leitura de QR Code e balaios), <code>TrabalhadoresScreen</code> e <code>DespesasScreen</code> testadas via RNTL.
                        </p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>📱 Sem Emulador Físico</span>
                        <a href="#slide16" class="text-emerald-400 hover:underline">Ver Código ➔</a>
                    </div>
                </div>

                <!-- Passo 8 -->
                <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Passo 8</span>
                            <span class="text-[11px] text-emerald-400 font-mono">Hardware Mock</span>
                        </div>
                        <h3 class="text-base font-bold text-white mb-1.5">Sessão Segura (Keychain/Keystore)</h3>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            Adaptador <code>SessionStorageSecureStore</code> encapsula a biblioteca nativa <code>expo-secure-store</code>. Proteção de tokens com criptografia no hardware do aparelho (chave <code>safracafe.session</code>), 100% mockado nos testes.
                        </p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>🔒 Criptografia Segura</span>
                        <a href="#slide17" class="text-emerald-400 hover:underline">Ver Código ➔</a>
                    </div>
                </div>

            </div>

            <!-- Barra inferior do checklist -->
            <div class="mt-6 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl max-w-7xl mx-auto w-full text-xs">
                <div class="flex items-center space-x-2 text-slate-300">
                    <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Status de Conformidade: <strong>100% dos 8 passos implementados e aprovados com 234 testes automatizados do SafraCafé</strong></span>
                </div>
                <a href="#slide8" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition inline-flex items-center space-x-1">
                    <span>Avançar para Códigos do Domínio (Passo 1)</span> ➔
                </a>
            </div>
        </section>'''

# Replace slide-checklist
content = re.sub(
    r'<section id="slide-checklist">[\s\S]*?</section>',
    lambda m: new_checklist_slide,
    content
)

# -------------------------------------------------------------
# SLIDE 8: VALUE OBJECTS (QuantidadeBalaio & ValorMonetario)
# -------------------------------------------------------------
slide8_callout = make_callout(
    'Elimina Primitive Obsession. Garante que nenhum volume negativo de balaio ou coordenada fora dos limites do globo terrestre seja instanciado, validando tudo de forma imutável no construtor.',
    'Arquivos: <code>src/domain/value-objects/QuantidadeBalaio.ts</code>, <code>ValorMonetario.ts</code>, <code>Coordinates.ts</code>, <code>SyncStatus.ts</code> · Testes: <code>tests/domain/QuantidadeBalaio.test.ts</code>.'
)

new_slide8 = f'''        <!-- SLIDE 8: VALUE OBJECTS -->
        <section id="slide8" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-5 space-y-4">
                <div>
                    <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Passo 1</span>
                    <h2 class="text-3xl font-extrabold text-white mt-1">Value Objects (Imutáveis)</h2>
                    <p class="text-sm text-slate-300 mt-2">
                        Objetos sem identidade própria definidos apenas por seus atributos. São imutáveis e se auto-validam de forma defensiva no construtor.
                    </p>
                </div>

                {slide8_callout}

                <div class="space-y-2 text-xs">
                    <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <strong class="text-white text-xs">QuantidadeBalaio:</strong>
                        <span class="text-[11px] text-slate-400 block mt-0.5">Volume em litros de café colhido no cafezal. Valida se é número finito e estritamente &gt; 0.</span>
                    </div>
                    <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <strong class="text-white text-xs">ValorMonetario:</strong>
                        <span class="text-[11px] text-slate-400 block mt-0.5">Diária do apanhador (R$ 60,00) ou gastos com óleo/ferramentas. Garante valor ≥ 0 e formatação BRL.</span>
                    </div>
                    <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <strong class="text-white text-xs">Coordinates:</strong>
                        <span class="text-[11px] text-slate-400 block mt-0.5">Latitude [-90, 90] e Longitude [-180, 180] para georreferenciamento compulsório no cafezal.</span>
                    </div>
                    <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <strong class="text-white text-xs">SyncStatus:</strong>
                        <span class="text-[11px] text-slate-400 block mt-0.5">Estados formais do ciclo offline-first: PENDING, SYNCED e ERROR.</span>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div class="flex space-x-2">
                        <button onclick="switchTab('vo', 'code')" id="vo-btn-code" class="tab-btn active text-xs font-mono px-3 py-1.5 rounded border border-slate-700">src/domain/value-objects/QuantidadeBalaio.ts</button>
                        <button onclick="switchTab('vo', 'test')" id="vo-btn-test" class="tab-btn text-xs font-mono px-3 py-1.5 rounded border border-slate-700">tests/domain/QuantidadeBalaio.test.ts</button>
                    </div>
                    <span class="text-xs text-emerald-400 font-mono font-semibold">Cobertura: 100%</span>
                </div>
                <div id="vo-tab-code" class="code-container bg-slate-950">
<pre><code class="language-typescript">export class QuantidadeBalaio {{
    constructor(public readonly litros: number) {{
        this.validate(); // Auto-validação defensiva no construtor (imutável)
    }}

    private validate(): void {{
        // Um balaio na colheita precisa ter volume finito maior que zero
        if (!Number.isFinite(this.litros) || this.litros <= 0) {{
            throw new Error('Quantidade de balaio inválida');
        }}
    }}
}}

// src/domain/value-objects/ValorMonetario.ts
export class ValorMonetario {{
    constructor(public readonly valor: number) {{
        this.validate();
    }}

    private validate(): void {{
        if (!Number.isFinite(this.valor) || this.valor < 0) {{
            throw new Error('Valor monetário inválido');
        }}
    }}

    public formatar(): string {{
        return this.valor.toLocaleString('pt-BR', {{ style: 'currency', currency: 'BRL' }});
    }}
}}</code></pre>
                </div>
                <div id="vo-tab-test" class="code-container bg-slate-950 hidden">
<pre><code class="language-typescript">describe('QuantidadeBalaio Value Object (TDD)', () => {{
    it('cria balaio válido com volume positivo em litros', () => {{
        const balaio = new QuantidadeBalaio(60);
        expect(balaio.litros).toBe(60);
    }});

    it('lança erro ao tentar criar balaio com volume zero ou negativo', () => {{
        expect(() => new QuantidadeBalaio(0)).toThrow('Quantidade de balaio inválida');
        expect(() => new QuantidadeBalaio(-15)).toThrow('Quantidade de balaio inválida');
        expect(() => new QuantidadeBalaio(NaN)).toThrow('Quantidade de balaio inválida');
    }});

    it('valida valor monetário da diária de colheita', () => {{
        const diaria = new ValorMonetario(60.0);
        expect(diaria.valor).toBe(60.0);
        expect(diaria.formatar()).toContain('60,00');
    }});
}});</code></pre>
                </div>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide8"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide8,
    content
)

# -------------------------------------------------------------
# SLIDE 9: ENTIDADES & AGREGADOS (Trabalhador & Apontamento)
# -------------------------------------------------------------
slide9_callout = make_callout(
    'Raízes de Agregação controlam a consistência dos dados do cafezal. Um apontamento não pode ser criado sem apanhador ou coordenadas válidas, e um trabalhador exige CPF de 11 dígitos e crachá unívoco.',
    'Arquivos: <code>src/domain/entities/Trabalhador.ts</code>, <code>Apontamento.ts</code>, <code>Despesa.ts</code>, <code>SyncQueueItem.ts</code> · Testes: <code>tests/domain/Trabalhador.test.ts</code>.'
)

new_slide9 = f'''        <!-- SLIDE 9: ENTIDADES E AGREGADOS -->
        <section id="slide9" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-5 space-y-4">
                <div>
                    <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Passo 2</span>
                    <h2 class="text-3xl font-extrabold text-white mt-1">Entidades & Agregados</h2>
                    <p class="text-sm text-slate-300 mt-2">
                        O <strong>Trabalhador</strong> e o <strong>Apontamento</strong> são as Raízes de Agregação da colheita cafeeira. Protegem as invariantes de negócio contra estados ilegais.
                    </p>
                </div>

                {slide9_callout}

                <div class="space-y-2 text-xs text-slate-300">
                    <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-0.5">Trabalhador (Aggregate Root)</strong>
                        Cadastro único com validação estrita de CPF (11 dígitos), crachá serializado (TRAB-001/002) impresso no QR Code e diária fixa em <code>ValorMonetario</code>.
                    </div>
                    <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-0.5">Apontamento (Aggregate Root de Colheita)</strong>
                        Vincula o colhedor aos balaios aferidos (<code>QuantidadeBalaio</code>), data/timestamp e fixação compulsória de coordenadas GPS no cafezal.
                    </div>
                    <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-0.5">Despesa & Fila Outbox</strong>
                        Registro georreferenciado de custos com foto do recibo via câmera nativa e enfileiramento em <code>SyncQueueItem</code> para sync offline-first.
                    </div>
                </div>
            </div>
            <div class="lg:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div class="flex space-x-2">
                        <button onclick="switchTab('entity', 'code')" id="entity-btn-code" class="tab-btn active text-xs font-mono px-3 py-1.5 rounded border border-slate-700">src/domain/entities/Trabalhador.ts</button>
                        <button onclick="switchTab('entity', 'test')" id="entity-btn-test" class="tab-btn text-xs font-mono px-3 py-1.5 rounded border border-slate-700">tests/domain/Trabalhador.test.ts</button>
                    </div>
                    <span class="text-xs text-emerald-400 font-mono font-semibold">Invariantes Blindadas</span>
                </div>
                <div id="entity-tab-code" class="code-container bg-slate-950">
<pre><code class="language-typescript">import {{ ValorMonetario }} from '../value-objects/ValorMonetario';

const CPF_REGEX = /^\\d{{11}}$/;

export class Trabalhador {{
    private _id: string;
    private _nome: string;
    private _cpf: string;
    private _cracha: string;
    private _diaria: ValorMonetario;

    constructor(id: string, nome: string, cpf: string, cracha: string, diaria: ValorMonetario) {{
        this._id = id;
        this._nome = nome;
        this._cpf = cpf;
        this._cracha = cracha;
        this._diaria = diaria;
        this.validate(); // Invariantes verificadas no construtor
    }}

    get id(): string {{ return this._id; }}
    get nome(): string {{ return this._nome; }}
    get cpf(): string {{ return this._cpf; }}
    get cracha(): string {{ return this._cracha; }}
    get diaria(): ValorMonetario {{ return this._diaria; }}

    private validate(): void {{
        if (!this._id || !this._id.trim()) throw new Error('Id de trabalhador inválido');
        if (!this._nome || !this._nome.trim()) throw new Error('Nome de trabalhador inválido');
        if (!CPF_REGEX.test(this._cpf)) throw new Error('CPF de trabalhador inválido');
        if (!this._cracha || !this._cracha.trim()) throw new Error('Código de crachá inválido');
    }}
}}</code></pre>
                </div>
                <div id="entity-tab-test" class="code-container bg-slate-950 hidden">
<pre><code class="language-typescript">describe('Trabalhador Entity & Invariantes', () => {{
    it('cria trabalhador válido com CPF de 11 dígitos e diária', () => {{
        const trab = new Trabalhador('t1', 'José da Silva', '12345678901', 'TRAB-001', new ValorMonetario(60));
        expect(trab.nome).toBe('José da Silva');
        expect(trab.cracha).toBe('TRAB-001');
    }});

    it('bloqueia trabalhador com CPF fora do padrão numérico de 11 dígitos', () => {{
        expect(() => new Trabalhador('t1', 'José', '123', 'TRAB-001', new ValorMonetario(60)))
            .toThrow('CPF de trabalhador inválido');
    }});

    it('bloqueia trabalhador sem código de crachá para QR Code', () => {{
        expect(() => new Trabalhador('t1', 'José', '12345678901', '', new ValorMonetario(60)))
            .toThrow('Código de crachá inválido');
    }});
}});</code></pre>
                </div>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide9"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide9,
    content
)

# -------------------------------------------------------------
# SLIDE 10: DOMAIN SERVICES (SincronizacaoService LWW)
# -------------------------------------------------------------
slide10_callout = make_callout(
    'Regras de negócio que cruzam o estado de múltiplas entidades. Na lavoura sem internet, quando dois operadores sincronizam o mesmo registro, o Last-Write-Wins (LWW) resolve conflitos de forma matemática sem travar a fila.',
    'Arquivo: <code>src/domain/services/SincronizacaoService.ts</code> · Teste: <code>tests/domain/SincronizacaoService.test.ts</code> (100% de Cobertura).'
)

new_slide10 = f'''        <!-- SLIDE 10: DOMAIN SERVICES -->
        <section id="slide10" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-5 space-y-4">
                <div>
                    <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Passo 3 · Regras Cruzadas</span>
                    <h2 class="text-3xl font-extrabold text-white mt-1">Domain Services</h2>
                    <p class="text-sm text-slate-300 mt-2">
                        Regras de negócio que cruzam o estado de mais de uma entidade ou validam sincronizações complexas sem acoplamento a banco físico ou rede.
                    </p>
                </div>

                {slide10_callout}

                <div class="space-y-2.5 text-xs text-slate-300">
                    <div class="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-1">1. SincronizacaoService (LWW)</strong>
                        Resolução determinística de conflitos na fila offline-first comparando timestamps <em>Last-Write-Wins</em>.
                    </div>
                    <div class="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-1">2. Fechamento de Colheita</strong>
                        Apuração e totalização diária de balaios colhidos por apanhador no talhão versus valor fixado da diária.
                    </div>
                </div>
            </div>
            <div class="lg:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span class="text-xs font-mono text-slate-400">src/domain/services/SincronizacaoService.ts</span>
                    <span class="text-xs text-emerald-400 font-mono font-semibold">Cobertura: 100.00%</span>
                </div>
                <div class="code-container bg-slate-950">
<pre><code class="language-typescript">export type ConflitoResultado = 'local' | 'remoto';

export class SincronizacaoService {{
  resolverConflito(updatedAtLocal: number, updatedAtRemoto: number): ConflitoResultado {{
    // Resolução determinística no cafezal: timestamp mais recente vence (Last-Write-Wins)
    if (updatedAtRemoto > updatedAtLocal) {{
      return 'remoto';
    }}
    return 'local';
  }}
}}</code></pre>
                </div>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide10"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide10,
    content
)

# -------------------------------------------------------------
# SLIDE 11: CONTRATOS & INTERFACES (DIP)
# -------------------------------------------------------------
slide11_callout = make_callout(
    'Princípio da Inversão de Dependência (DIP). O domínio declara contratos puros em TypeScript. A infraestrutura cumpre esses contratos. Assim, podemos trocar memória RAM por SQLite e Supabase sem tocar em uma linha de regra de negócio.',
    'Contratos em: <code>src/domain/repositories/ApontamentoRepository.ts</code>, <code>TrabalhadorRepository.ts</code>, <code>DespesaRepository.ts</code>, <code>CameraGateway.ts</code>, <code>LocationGateway.ts</code>.'
)

new_slide11 = f'''        <!-- SLIDE 11: CONTRATOS & INTERFACES (DIP) -->
        <section id="slide11" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-5 space-y-4">
                <div>
                    <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Passo 4</span>
                    <h2 class="text-3xl font-extrabold text-white mt-1">Contratos e Interfaces (DIP)</h2>
                    <p class="text-sm text-slate-300 mt-2">
                        O <strong>Princípio da Inversão de Dependência</strong>: o Domínio dita os contratos (interfaces). A infraestrutura externa apenas cumpre esses contratos.
                    </p>
                </div>

                {slide11_callout}

                <div class="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                    <p class="text-emerald-400 font-bold uppercase text-[11px]">Contratos Declarados no Domínio:</p>
                    <p>• <code>ApontamentoRepository</code>: Persistência de colheita e balaios</p>
                    <p>• <code>TrabalhadorRepository</code>: Cadastro e busca por crachá (QR Code)</p>
                    <p>• <code>DespesaRepository</code>: Registro de custos operacionais</p>
                    <p>• <code>CameraGateway</code>: Leitor óptico de QR e foto de recibos</p>
                    <p>• <code>LocationGateway</code>: Fixação de coordenadas GPS do cafezal</p>
                    <p>• <code>AuthGateway</code>: Autenticação de operador de campo</p>
                </div>
            </div>
            <div class="lg:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div class="text-xs font-mono text-slate-400 border-b border-slate-800 pb-2 mb-3">src/domain/repositories/ApontamentoRepository.ts</div>
                <div class="code-container bg-slate-950">
<pre><code class="language-typescript">import {{ Apontamento }} from '../entities/Apontamento';

export interface ApontamentoRepository {{
    save(apontamento: Apontamento): Promise<void>;
    findById(id: string): Promise<Apontamento | null>;
    findByTrabalhadorId(trabalhadorId: string): Promise<Apontamento[]>;
    findAll(): Promise<Apontamento[]>;
}}

// src/domain/repositories/TrabalhadorRepository.ts
import {{ Trabalhador }} from '../entities/Trabalhador';

export interface TrabalhadorRepository {{
    save(trabalhador: Trabalhador): Promise<void>;
    findById(id: string): Promise<Trabalhador | null>;
    findByCracha(cracha: string): Promise<Trabalhador | null>;
    findAll(): Promise<Trabalhador[]>;
    delete(id: string): Promise<void>;
}}</code></pre>
                </div>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide11"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide11,
    content
)

# -------------------------------------------------------------
# SLIDE 12: CASOS DE USO & TDD RED-GREEN-REFACTOR
# -------------------------------------------------------------
slide12_callout = make_callout(
    'Orquestram as intenções do usuário recebendo DTOs e coordenando repositórios e serviços. A adoção do ciclo TDD Red-Green-Refactor garante que 100% dos fluxos de colheita foram especificados antes da codificação.',
    'Casos de uso em: <code>src/usecases/RegistrarApontamento.ts</code>, <code>CadastrarTrabalhador.ts</code>, <code>SyncPendingQueue.ts</code>, etc. 24 suítes em <code>tests/usecases/</code>.'
)

new_slide12 = f'''        <!-- SLIDE 12: CASOS DE USO -->
        <section id="slide12" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-5 space-y-4">
                <div>
                    <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Passo 5</span>
                    <h2 class="text-3xl font-extrabold text-white mt-1">Casos de Uso (Application Layer)</h2>
                    <p class="text-sm text-slate-300 mt-2">
                        Orquestram as operações de colheita recebendo DTOs e injetando repositórios e gateways via construtor.
                    </p>
                </div>

                {slide12_callout}

                <div class="grid grid-cols-2 gap-1.5 text-[10.5px] text-slate-300 font-mono">
                    <span class="p-1.5 bg-slate-900 rounded border border-slate-800 truncate">1. RegistrarApontamento</span>
                    <span class="p-1.5 bg-slate-900 rounded border border-slate-800 truncate">2. CadastrarTrabalhador</span>
                    <span class="p-1.5 bg-slate-900 rounded border border-slate-800 truncate">3. RegistrarDespesa</span>
                    <span class="p-1.5 bg-slate-900 rounded border border-slate-800 truncate">4. AuthenticateUser</span>
                    <span class="p-1.5 bg-slate-900 rounded border border-slate-800 truncate">5. SyncPendingQueue</span>
                    <span class="p-1.5 bg-slate-900 rounded border border-slate-800 truncate">6. ListarApontamentos</span>
                    <span class="p-1.5 bg-slate-900 rounded border border-slate-800 truncate">7. ListarTrabalhadores</span>
                    <span class="p-1.5 bg-slate-900 rounded border border-slate-800 truncate">8. ListarDespesas</span>
                </div>
                <div class="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                    <strong class="text-emerald-400">Testes com Fakes In-Memory:</strong> Validados via TDD com <code>InMemoryApontamentoRepository</code> e <code>InMemoryTrabalhadorRepository</code> (usando <code>Map</code>), cobrindo caminho feliz, erros de validação e GPS.
                </div>
            </div>
            <div class="lg:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div class="flex space-x-2">
                        <button onclick="switchTab('usecase', 'code')" id="usecase-btn-code" class="tab-btn active text-xs font-mono px-3 py-1.5 rounded border border-slate-700">src/usecases/RegistrarApontamento.ts</button>
                        <button onclick="switchTab('usecase', 'test')" id="usecase-btn-test" class="tab-btn text-xs font-mono px-3 py-1.5 rounded border border-slate-700">🔄 Ciclo Red-Green-Refactor (TDD)</button>
                    </div>
                    <span class="text-xs text-emerald-400 font-mono font-semibold">TDD Red-Green-Refactor</span>
                </div>
                <div id="usecase-tab-code" class="code-container bg-slate-950">
<pre><code class="language-typescript">export interface RegistrarApontamentoDTO {{
    trabalhadorId: string;
    litros: number;
    latitude: number;
    longitude: number;
}}

export class RegistrarApontamento {{
    constructor(
        private readonly apontamentoRepository: ApontamentoRepository,
        private readonly trabalhadorRepository: TrabalhadorRepository,
        private readonly syncQueueRepository?: SyncQueueRepository,
    ) {{}}

    public async execute(input: RegistrarApontamentoDTO, agora: number = Date.now()) {{
        const trabalhador = await this.trabalhadorRepository.findById(input.trabalhadorId);
        if (!trabalhador) {{
            throw new Error('Trabalhador não encontrado');
        }}

        const coordenadas = new Coordinates(input.latitude, input.longitude);
        const quantidade = new QuantidadeBalaio(input.litros);
        const id = Crypto.randomUUID();
        const apontamento = new Apontamento(id, input.trabalhadorId, quantidade, coordenadas, agora);

        await this.apontamentoRepository.save(apontamento);

        if (this.syncQueueRepository) {{
            const item = new SyncQueueItem(
                Crypto.randomUUID(),
                'Apontamento',
                id,
                'INSERT',
                agora,
                agora,
            );
            await this.syncQueueRepository.enqueue(item);
        }}

        return apontamento;
    }}
}}</code></pre>
                </div>
                <div id="usecase-tab-test" class="code-container bg-slate-950 hidden">
<pre><code class="language-typescript">// =========================================================================
// DEMONSTRAÇÃO PRÁTICA DO CICLO TDD: RED-GREEN-REFACTOR NO SAFRACAFÉ
// =========================================================================

// 🔴 FASE 1: RED (Escrever o teste ANTES do código de produção)
// O teste define a invariante. Ao executar, FALHA porque a regra ainda não existe.
describe('RegistrarApontamento — Ciclo Red-Green-Refactor', () => {{
  it('🔴 RED: deve falhar quando o trabalhador do crachá não for encontrado', async () => {{
    const apontRepo = new InMemoryApontamentoRepository();
    const trabRepo = new InMemoryTrabalhadorRepository(); // Inicia com Map vazio
    const useCase = new RegistrarApontamento(apontRepo, trabRepo);

    // Asserção que falhará antes da implementação
    await expect(useCase.execute({{ trabalhadorId: 'inexistente', litros: 60, latitude: -21.2, longitude: -45.0 }}))
      .rejects.toThrow('Trabalhador não encontrado');
  }});
  // ➜ Terminal (RED): FAIL tests/usecases/RegistrarApontamento.test.ts
  // ✖ Error: Received function did not throw (ou Cannot read properties of undefined)
}});

// 🟢 FASE 2: GREEN (Implementar o CÓDIGO MÍNIMO para o teste passar)
// Escreve-se apenas a lógica necessária para satisfazer a asserção do teste.
export class RegistrarApontamento {{
  async execute(input: RegistrarApontamentoDTO) {{
    const trabalhador = await this.trabalhadorRepository.findById(input.trabalhadorId);
    if (!trabalhador) throw new Error('Trabalhador não encontrado'); // Código mínimo para GREEN
    // ...
  }}
}}
// ➜ Terminal (GREEN): PASS tests/usecases/RegistrarApontamento.test.ts
// ✔ deve falhar quando o trabalhador do crachá não for encontrado (4 ms)

// 🔵 FASE 3: REFACTOR (Melhorar o design mantendo 100% dos testes verdes)
// Extrai-se Value Objects (QuantidadeBalaio, Coordinates), enfileira-se na Outbox e protege-se a Raiz.
// ➜ Suíte Completa: 57 Test Suites Aprovadas (100% PASS) | 234 Testes | 91.82% de Cobertura!</code></pre>
                </div>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide12"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide12,
    content
)

# -------------------------------------------------------------
# SLIDE 13: HARDWARE DESACOPLADO
# -------------------------------------------------------------
slide13_callout = make_callout(
    'Permite testar a leitura de QR Code, fotografia de cupons fiscais e fixação de GPS instantaneamente em memória, sem depender de câmera física ou sinal real de satélite durante os testes automatizados.',
    'Interfaces: <code>src/domain/gateways/CameraGateway.ts</code>, <code>LocationGateway.ts</code> · Fakes em memória: <code>src/infra/InMemoryCameraGateway.ts</code>, <code>InMemoryLocationGateway.ts</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide13"'):content.find('id="slide14"')]:
    needle = '<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">'
    replacement = slide13_callout + '\n            ' + needle
    pos1 = content.find('id="slide13"')
    pos2 = content.find('id="slide14"')
    slide13_text = content[pos1:pos2]
    slide13_text = slide13_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide13_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 14: PERSISTÊNCIA OFFLINE-FIRST
# -------------------------------------------------------------
slide14_callout = make_callout(
    'No cafezal não há garantia de sinal 4G/5G. Todas as pesagens e despesas entram na fila Outbox local em memória e são despachadas atomicamente para o servidor com resolução LWW assim que a conexão retorna.',
    'Caso de Uso: <code>src/usecases/SyncPendingQueue.ts</code> · Entidade: <code>src/domain/entities/SyncQueueItem.ts</code> · Fakes com Map em <code>src/infra/</code>.'
)

new_slide14 = f'''        <!-- SLIDE 14: PERSISTÊNCIA OFFLINE-FIRST -->
        <section id="slide14" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-5 space-y-4">
                <div>
                    <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Passo 7</span>
                    <h2 class="text-3xl font-extrabold text-white mt-1">Persistência Offline-First</h2>
                    <p class="text-sm text-slate-300 mt-2">
                        Por que zero banco físico agora? Persistência é detalhe de I/O em Clean Architecture. Banco físico acopla o domínio e deixa a suíte de testes lenta.
                    </p>
                </div>

                {slide14_callout}

                <div class="space-y-2 text-xs text-slate-300">
                    <div class="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-1">Repositórios Fake em Memória:</strong>
                        Estruturas <code>Map&lt;string, T&gt;</code> reproduzindo métodos <code>save</code>, <code>findById</code> e <code>findPending</code> com alta velocidade.
                    </div>
                    <div class="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-1">Fila de Sincronização Outbox:</strong>
                        Apontamentos e despesas gravados na roça entram na fila outbox e são despachados para a nuvem via <code>SyncPendingQueue</code> com resolução LWW.
                    </div>
                </div>
            </div>
            <div class="lg:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div class="text-xs font-mono text-slate-400 border-b border-slate-800 pb-2 mb-3">src/usecases/SyncPendingQueue.ts</div>
                <div class="code-container bg-slate-950">
<pre><code class="language-typescript">export class SyncPendingQueue {{
  constructor(
    private readonly syncQueueRepository: SyncQueueRepository,
    private readonly syncGateway: SyncGateway,
    private readonly networkGateway: NetworkGateway,
    private readonly sincronizacaoService: SincronizacaoService,
  ) {{}}

  async execute(agora: number = Date.now()): Promise<SyncResult> {{
    const pendentes = await this.syncQueueRepository.findPending();
    if (!(await this.networkGateway.isConnected())) {{
      return {{ synchronized: 0, pending: pendentes.length, offline: true }};
    }}

    let synchronized = 0;
    for (const item of pendentes) {{
      item.registrarTentativa(agora);
      await this.syncQueueRepository.save(item);
      try {{
        const resultado = await this.syncGateway.push(item);
        const conflito = this.sincronizacaoService.resolverConflito(
          item.updatedAt,
          resultado.serverUpdatedAt ?? item.updatedAt,
        );
        if (conflito === 'remoto') continue;
        await this.syncQueueRepository.remove(item.id);
        synchronized += 1;
      }} catch {{
        item.marcarErro(agora);
        await this.syncQueueRepository.save(item);
      }}
    }}
    const restantes = await this.syncQueueRepository.findPending();
    return {{ synchronized, pending: restantes.length, offline: false }};
  }}
}}</code></pre>
                </div>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide14"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide14,
    content
)

# -------------------------------------------------------------
# SLIDE 15: CONTEXT API & CUSTOM HOOKS
# -------------------------------------------------------------
slide15_callout = make_callout(
    'Elimina Prop Drilling e impede que as telas de React Native importem lógica de domínio ou de casos de uso diretamente. A Context API isola o ciclo de vida reativo e provê a sessão globalmente.',
    'Localização: <code>src/adapters/auth/AuthContext.tsx</code>, <code>src/adapters/hooks/useAuth.ts</code>, <code>useApontamentos.ts</code>, <code>useTrabalhadores.ts</code>.'
)

new_slide15 = f'''        <!-- SLIDE 15: CONTEXT API & CUSTOM HOOKS -->
        <section id="slide15" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-5 space-y-4">
                <div>
                    <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Passo 8</span>
                    <h2 class="text-3xl font-extrabold text-white mt-1">Context API & Custom Hooks</h2>
                    <p class="text-sm text-slate-300 mt-2">
                        Ponte desacoplada entre os Casos de Uso e o ciclo de vida dos componentes do React Native no SafraCafé.
                    </p>
                </div>

                {slide15_callout}

                <div class="space-y-2.5 text-xs text-slate-300">
                    <div class="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-1">Localização Arquitetural: Adapters/UI</strong>
                        O domínio e os casos de uso <strong>nunca importam Context API</strong>. Apenas as telas consom o <code>AuthProvider</code> via <code>useContext</code>.
                    </div>
                    <div class="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-1">AuthContext (Sem Prop Drilling):</strong>
                        Disponibiliza a sessão do operador cafeeiro (<code>pesquisador@ecofield.app</code>) globalmente na raiz da aplicação.
                    </div>
                    <div class="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <strong class="text-emerald-400 block font-semibold mb-1">Custom Hooks de Campo (useAuth, useApontamentos):</strong>
                        Fronteira com as telas do cafezal, adaptando os Use Cases ao ciclo de vida e gerenciando estados: <code>loading</code>, <code>authenticated</code> e <code>unauthenticated</code>.
                    </div>
                </div>
            </div>
            <div class="lg:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div class="text-xs font-mono text-slate-400 border-b border-slate-800 pb-2 mb-3">src/adapters/auth/AuthContext.tsx</div>
                <div class="code-container bg-slate-950">
<pre><code class="language-typescript">export function AuthProvider({{
    children,
    authenticateUseCase,
    restoreSessionUseCase,
    signOutUseCase,
    sessionStorage,
}}: AuthProviderProps) {{
    const auth = authenticateUseCase ?? container.authenticateUser;
    const restore = restoreSessionUseCase ?? container.restoreSession;
    const clear = signOutUseCase ?? container.signOut;

    const [session, setSession] = useState&lt;Session | null&gt;(null);
    const [status, setStatus] = useState&lt;string&gt;("loading");

    useEffect(() => {{
        let active = true;
        restore
            .execute()
            .then((s) => {{
                if (!active) return;
                setSession(s);
                setStatus(s ? "authenticated" : "unauthenticated");
            }})
            .catch(() => {{
                if (!active) return;
                setSession(null);
                setStatus("unauthenticated");
            }});
        return () => {{ active = false; }};
    }}, [restore]);
    // login / logout desacoplados consumidos nas telas
}}</code></pre>
                </div>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide15"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide15,
    content
)

# -------------------------------------------------------------
# SLIDE 16: TELAS & TESTES RNTL
# -------------------------------------------------------------
slide16_callout = make_callout(
    'Permite validar renderização visual, preenchimento de inputs e navegação do operador sem necessidade de abrir emulador físico pesado ou realizar cliques manuais lentos.',
    'Telas em: <code>app/login.tsx</code>, <code>app/(drawer)/(tabs)/apontamento.tsx</code>, <code>trabalhadores.tsx</code> · Testes RNTL em: <code>tests/screens/LoginScreen.test.tsx</code>.'
)

new_slide16 = f'''        <!-- SLIDE 16: TELAS & TESTES RNTL -->
        <section id="slide16" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-5 space-y-4">
                <div>
                    <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Passo 7 · Interface & Boundary</span>
                    <h2 class="text-3xl font-extrabold text-white mt-1">Telas e Testes RNTL</h2>
                    <p class="text-sm text-slate-300 mt-2">
                        Telas do SafraCafé construídas com React Native nativo (<code class="text-emerald-300">&lt;View&gt;</code>, <code class="text-emerald-300">&lt;Text&gt;</code>, <code class="text-emerald-300">StyleSheet</code>) testadas com <strong>React Native Testing Library</strong> sem necessidade de emulador físico ou clique manual.
                    </p>
                </div>

                {slide16_callout}

                <div class="space-y-2 text-xs text-slate-300">
                    <div class="w-full text-left p-2.5 rounded-lg border bg-emerald-950/80 border-emerald-600 text-white">
                        <strong class="text-emerald-400 block font-semibold mb-0.5">1. LoginScreen (Tela 0)</strong>
                        Teste com preenchimento de credenciais, botão Entrar e injeção de fakes no AuthProvider.
                    </div>
                    <div class="w-full text-left p-2.5 rounded-lg border bg-slate-900 border-slate-800 text-slate-300">
                        <strong class="text-emerald-400 block font-semibold mb-0.5">2. ApontamentoScreen (Tela 1)</strong>
                        Contadores de balaios, entrada de litros, fixação de GPS do cafezal e feed diário reativo.
                    </div>
                    <div class="w-full text-left p-2.5 rounded-lg border bg-slate-900 border-slate-800 text-slate-300">
                        <strong class="text-emerald-400 block font-semibold mb-0.5">3. TrabalhadoresScreen (Tela 2)</strong>
                        Gestão de apanhadores com código de crachá (TRAB-001), CPF validado e busca reativa.
                    </div>
                </div>
            </div>
            <div class="lg:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span class="text-xs font-mono text-slate-400">tests/screens/LoginScreen.test.tsx (RNTL)</span>
                    <span class="text-xs text-emerald-400 font-mono font-semibold">100% Pass</span>
                </div>
                <div class="code-container bg-slate-950">
<pre><code class="language-typescript">describe('LoginScreen (RNTL + Fakes)', () => {{
    it('faz login com sucesso usando credenciais válidas e navega', async () => {{
        const {{ getByPlaceholderText, getByText }} = await renderScreen();

        // Simula preenchimento real de credenciais do operador
        fireEvent.changeText(getByPlaceholderText('Digite seu e-mail...'), 'pesquisador@ecofield.app');
        fireEvent.changeText(getByPlaceholderText('Digite sua senha...'), '123456');
        fireEvent.press(getByText('Entrar'));

        await waitFor(() => {{
            expect(router.replace).toHaveBeenCalledWith('/(drawer)/(tabs)');
        }});
    }});

    it('exibe alerta de erro quando as credenciais são inválidas', async () => {{
        const {{ getByPlaceholderText, getByText }} = await renderScreen();

        fireEvent.changeText(getByPlaceholderText('Digite seu e-mail...'), 'invalido@ecofield.app');
        fireEvent.changeText(getByPlaceholderText('Digite sua senha...'), 'senhaerrada');
        fireEvent.press(getByText('Entrar'));

        await waitFor(() => {{
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Credenciais inválidas');
        }});
    }});
}});</code></pre>
                </div>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide16"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide16,
    content
)

# -------------------------------------------------------------
# SLIDE 17: SESSÃO SEGURA
# -------------------------------------------------------------
slide17_callout = make_callout(
    'Nunca utilizar AsyncStorage sem criptografia para tokens. O uso de hardware criptográfico (Keychain no iOS e Keystore no Android) protege as credenciais do operador mesmo em aparelhos perdidos.',
    'Adaptador: <code>src/adapters/auth/SessionStorageSecureStore.ts</code> · Gateway: <code>src/domain/gateways/SessionStorage.ts</code> · Teste: <code>tests/adapters/SessionStorageSecureStore.test.ts</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide17"'):content.find('id="slide18"')]:
    needle = '<div class="p-3.5 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">'
    replacement = slide17_callout + '\n                ' + needle
    pos1 = content.find('id="slide17"')
    pos2 = content.find('id="slide18"')
    slide17_text = content[pos1:pos2]
    slide17_text = slide17_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide17_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 18: COMPROVAÇÃO DE ISOLAMENTO (100% MOCK)
# -------------------------------------------------------------
slide18_callout = make_callout(
    'Prova técnica de desacoplamento absoluto. Sem conexão física de banco ou hardware nos testes, a execução é 100% determinística, à prova de oscilações de rede e com execução em apenas ~5.9 segundos.',
    'Isolamento em memória configurado em: <code>tests/setup.ts</code> e implementações fake em <code>src/infra/</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide18"'):content.find('id="slide19"')]:
    needle = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">'
    replacement = slide18_callout + '\n            ' + needle
    pos1 = content.find('id="slide18"')
    pos2 = content.find('id="slide19"')
    slide18_text = content[pos1:pos2]
    slide18_text = slide18_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide18_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 19: MÉTRICAS & PIRÂMIDE DE TESTES
# -------------------------------------------------------------
slide19_callout = make_callout(
    'Comprovação matemática da qualidade do software entregue. A meta da disciplina era de 80% de cobertura, e o SafraCafé alcançou 91.82% de cobertura de linhas com 234 testes automatizados 100% aprovados.',
    'Relatório oficial Jest gerado por <code>npm test -- --coverage</code> · Configuração em <code>jest.config.js</code>.'
)
if 'Por que é importante ter isso?' not in content[content.find('id="slide19"'):content.find('id="slide20"')]:
    needle = '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mb-6">'
    replacement = slide19_callout + '\n            ' + needle
    pos1 = content.find('id="slide19"')
    pos2 = content.find('id="slide20"')
    slide19_text = content[pos1:pos2]
    slide19_text = slide19_text.replace(needle, replacement, 1)
    content = content[:pos1] + slide19_text + content[pos2:]

# -------------------------------------------------------------
# SLIDE 20: ENCERRAMENTO (5 DECISÕES ARQUITETURAIS SAFRACAFÉ)
# -------------------------------------------------------------
slide20_callout = make_callout(
    'Síntese para a banca avaliadora: o SafraCafé foi projetado desde o primeiro dia com princípios sólidos de engenharia de software corporativa, permitindo evolução contínua sem quebrar regras de negócio.',
    'Visão consolidada em <code>src/factory/container.ts</code> (wiring Singleton de toda a aplicação).'
)

new_slide20 = f'''        <!-- SLIDE 20: ENCERRAMENTO -->
        <section id="slide20">
            <div class="text-center mb-5">
                <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Encerramento</span>
                <h2 class="text-3xl font-extrabold text-white">5 Decisões Arquiteturais Fundamentais</h2>
                <p class="text-slate-400 text-sm mt-1">Conceitos consolidados do projeto SafraCafé</p>
            </div>

            {slide20_callout}

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-6xl mx-auto mb-6 text-xs">
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span class="text-emerald-400 font-bold block mb-1">1. Separação Persistência/Domínio</span>
                    <p class="text-slate-300 leading-relaxed">Substituir memória por SQLite e Supabase ocorre na camada de infraestrutura via contratos já estabelecidos, sem tocar na regra de negócio.</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span class="text-emerald-400 font-bold block mb-1">2. Invariantes Blindadas</span>
                    <p class="text-slate-300 leading-relaxed">Raízes de Agregação (<code>Trabalhador</code>, <code>Apontamento</code>) e Value Objects (<code>QuantidadeBalaio</code>, <code>ValorMonetario</code>, <code>Coordinates</code>) impedem dados ilegais na colheita.</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span class="text-emerald-400 font-bold block mb-1">3. Autenticação Segura & Modo Campo</span>
                    <p class="text-slate-300 leading-relaxed">Sessão segura cifrada via Keychain/Keystore (<code>SessionStorageSecureStore</code>) para operadores de campo, garantindo acesso offline resiliente na lavoura.</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span class="text-emerald-400 font-bold block mb-1">4. IoC Container Centralizado</span>
                    <p class="text-slate-300 leading-relaxed">O arquivo <code>src/factory/container.ts</code> é o ponto único de composição de dependências Singleton da aplicação.</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span class="text-emerald-400 font-bold block mb-1">5. Clean Architecture Estrita</span>
                    <p class="text-slate-300 leading-relaxed">O domínio é agnóstico de UI. Casos de uso só operam sobre interfaces. Os adaptadores traduzem o fluxo para o Expo/React Native sem acoplamento reverso.</p>
                </div>
                <div class="bg-emerald-950/60 p-4 rounded-xl border border-emerald-600 flex flex-col justify-center text-center">
                    <span class="text-emerald-400 font-bold text-sm block mb-1">✓ Defesa Técnica Concluída</span>
                    <p class="text-slate-300 text-xs">SafraCafé Entregue com 100% de Conformidade e 91.82% de Cobertura.</p>
                </div>
            </div>

            <div class="flex items-center justify-center space-x-4 pt-2">
                <a href="#slide1" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition">⇤ Reiniciar Apresentação</a>
                <a href="#slide19" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition">Ver Métricas Finais ➔</a>
            </div>
        </section>'''

content = re.sub(
    r'<section id="slide20"[^>]*>[\s\S]*?</section>',
    lambda m: new_slide20,
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully written updated presentation to apresentacao.html!")
