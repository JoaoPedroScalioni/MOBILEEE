# -*- coding: utf-8 -*-
import re

file_path = 'c:/PROJETOMOBILE/apresentacao.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add CSS rules in <style>
css_patch = '''
        /* Prevenção total de overflow nas caixas de destaque */
        .callout-box {
            min-width: 0 !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
        }
        .callout-box code {
            white-space: normal !important;
            word-break: break-all !important;
            overflow-wrap: anywhere !important;
            display: inline !important;
            background: rgba(15, 23, 42, 0.7) !important;
            padding: 1px 4px !important;
            border-radius: 4px !important;
            font-size: 0.78rem !important;
        }
        .callout-box p {
            min-width: 0 !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
        }
'''

if 'Prevenção total de overflow nas caixas de destaque' not in html:
    html = html.replace('</style>', css_patch + '\n    </style>', 1)

def make_callout(importancia, onde_esta, is_column=False):
    grid_cls = "grid grid-cols-1 gap-2.5 mb-4 text-left w-full min-w-0" if is_column else "grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-left w-full max-w-6xl mx-auto min-w-0"
    return f'''
            <!-- Destaque: Por que é importante & Onde está no app -->
            <div class="{grid_cls}">
                <div class="callout-box bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-start space-x-2.5 shadow-sm min-w-0 w-full overflow-hidden">
                    <div class="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-base flex-shrink-0">🎯</div>
                    <div class="min-w-0 flex-1">
                        <div class="text-[10.5px] font-mono font-bold uppercase tracking-wider text-amber-400">Por que é importante ter isso?</div>
                        <p class="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">{importancia}</p>
                    </div>
                </div>
                <div class="callout-box bg-blue-950/40 border border-blue-600/40 rounded-xl p-3 flex items-start space-x-2.5 shadow-sm min-w-0 w-full overflow-hidden">
                    <div class="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-base flex-shrink-0">📂</div>
                    <div class="min-w-0 flex-1">
                        <div class="text-[10.5px] font-mono font-bold uppercase tracking-wider text-blue-400">Onde está no nosso app?</div>
                        <p class="text-xs text-slate-300 mt-0.5 font-mono leading-relaxed break-words">{onde_esta}</p>
                    </div>
                </div>
            </div>'''

# Now let's replace all callouts in the HTML
# Slide 1 (Full)
s1_callout = make_callout(
    'Blindar as regras centrais da colheita cafeeira antes de acoplar qualquer banco físico ou framework de UI. Evita retrabalho estrutural e garante domínio puro 100% testável.',
    'Raiz arquitetural: <code>src/domain/</code>, <code>src/usecases/</code>, <code>src/adapters/</code>, <code>src/infra/</code>, <code>src/factory/container.ts</code> e suíte em <code>tests/</code>.',
    is_column=False
)

# Slide 2 (Full)
s2_callout = make_callout(
    'A experiência mobile no cafezal precisa ser ágil, com botões amplos, alto contraste sob sol direto e resposta imediata sem travar mesmo sem nenhum sinal de rede móvel (offline-first).',
    'Rotas do Expo Router em <code>app/(drawer)/(tabs)/</code> e componentes de navegação em <code>app/</code>.',
    is_column=False
)

# Slide 3 (Column)
s3_callout = make_callout(
    'Garante a autenticação segura do operador rural com tokens criptografados no hardware nativo do smartphone, mantendo o acesso ativo mesmo quando o celular perde sinal no meio da lavoura.',
    'Tela: <code>app/login.tsx</code> · Casos de Uso: <code>src/usecases/AuthenticateUser.ts</code>, <code>RestoreSession.ts</code> · Teste: <code>tests/screens/LoginScreen.test.tsx</code>.',
    is_column=True
)

# Slide 4 (Column)
s4_callout = make_callout(
    'É o coração operacional da colheita cafeeira. Registra a pesagem/balaios em litros, lê o QR Code do apanhador e vincula as coordenadas GPS para rastreabilidade auditável de cada talhão.',
    'Tela: <code>app/(drawer)/(tabs)/apontamento.tsx</code> · Entidades: <code>Apontamento</code>, <code>QuantidadeBalaio</code> · Testes: <code>tests/domain/Apontamento.test.ts</code>.',
    is_column=True
)

# Slide 5 (Column)
s5_callout = make_callout(
    'Identificação nominal e serial unívoca de cada apanhador (TRAB-001, TRAB-002) com CPF validado e valor de diária fixado, eliminando confusões no fechamento contábil e pagamentos.',
    'Tela: <code>app/(drawer)/(tabs)/trabalhadores.tsx</code> · Entidade: <code>src/domain/entities/Trabalhador.ts</code> · Testes: <code>tests/domain/Trabalhador.test.ts</code>.',
    is_column=True
)

# Slide 6 (Column)
s6_callout = make_callout(
    'Controle minucioso de custos de safra (combustível, lubrificantes de derriçadoras, insumos) com comprovante fotográfico e GPS do local de compra, prevenindo fraudes e perda de notas.',
    'Tela: <code>app/(drawer)/(tabs)/despesas.tsx</code> · Entidade: <code>src/domain/entities/Despesa.ts</code> · Testes: <code>tests/domain/Despesa.test.ts</code>.',
    is_column=True
)

# Slide 7 (Column)
s7_callout = make_callout(
    'Monitoramento geoespacial dos talhões da fazenda cafeeira no Sul de Minas, permitindo identificar onde a colheita está concentrada e otimizar rotas de tratores e transporte de café.',
    'Tela: <code>app/(drawer)/(tabs)/mapa.tsx</code> · Gateway: <code>src/domain/gateways/LocationGateway.ts</code> · VO: <code>src/domain/value-objects/Coordinates.ts</code>.',
    is_column=True
)

# Slide Checklist (Full)
s_chk_callout = make_callout(
    'Estabelece o fluxo metódico de engenharia de software da equipe no SafraCafé: construir regras puras primeiro, orquestração depois, adaptadores de hardware e por fim telas RNTL, tudo orientado a TDD.',
    'Distribuição nas camadas: <code>src/domain/</code> → <code>src/usecases/</code> → <code>src/adapters/</code> → <code>src/factory/container.ts</code> → <code>tests/</code>.',
    is_column=False
)

# Slide 8 (Column)
s8_callout = make_callout(
    'Elimina Primitive Obsession. Garante que nenhum volume negativo de balaio ou coordenada fora dos limites do globo terrestre seja instanciado, validando tudo de forma imutável no construtor.',
    'Arquivos: <code>src/domain/value-objects/QuantidadeBalaio.ts</code>, <code>ValorMonetario.ts</code>, <code>Coordinates.ts</code>, <code>SyncStatus.ts</code> · Testes: <code>tests/domain/QuantidadeBalaio.test.ts</code>.',
    is_column=True
)

# Slide 9 (Column)
s9_callout = make_callout(
    'Raízes de Agregação controlam a consistência dos dados do cafezal. Um apontamento não pode ser criado sem apanhador ou coordenadas válidas, e um trabalhador exige CPF de 11 dígitos e crachá unívoco.',
    'Arquivos: <code>src/domain/entities/Trabalhador.ts</code>, <code>Apontamento.ts</code>, <code>Despesa.ts</code>, <code>SyncQueueItem.ts</code> · Testes: <code>tests/domain/Trabalhador.test.ts</code>.',
    is_column=True
)

# Slide 10 (Column)
s10_callout = make_callout(
    'Regras de negócio que cruzam o estado de múltiplas entidades. Na lavoura sem internet, quando dois operadores sincronizam o mesmo registro, o Last-Write-Wins (LWW) resolve conflitos de forma matemática sem travar a fila.',
    'Arquivo: <code>src/domain/services/SincronizacaoService.ts</code> · Teste: <code>tests/domain/SincronizacaoService.test.ts</code> (100% de Cobertura).',
    is_column=True
)

# Slide 11 (Column)
s11_callout = make_callout(
    'Princípio da Inversão de Dependência (DIP). O domínio declara contratos puros em TypeScript. A infraestrutura cumpre esses contratos. Assim, podemos trocar memória RAM por SQLite e Supabase sem tocar em uma linha de regra de negócio.',
    'Contratos em: <code>src/domain/repositories/ApontamentoRepository.ts</code>, <code>TrabalhadorRepository.ts</code>, <code>DespesaRepository.ts</code>, <code>CameraGateway.ts</code>, <code>LocationGateway.ts</code>.',
    is_column=True
)

# Slide 12 (Column)
s12_callout = make_callout(
    'Orquestram as intenções do usuário recebendo DTOs e coordenando repositórios e serviços. A adoção do ciclo TDD Red-Green-Refactor garante que 100% dos fluxos de colheita foram especificados antes da codificação.',
    'Casos de uso em: <code>src/usecases/RegistrarApontamento.ts</code>, <code>CadastrarTrabalhador.ts</code>, <code>SyncPendingQueue.ts</code>, etc. 24 suítes em <code>tests/usecases/</code>.',
    is_column=True
)

# Slide 13 (Full)
s13_callout = make_callout(
    'Permite testar a leitura de QR Code, fotografia de cupons fiscais e fixação de GPS instantaneamente em memória, sem depender de câmera física ou sinal real de satélite durante os testes automatizados.',
    'Interfaces: <code>src/domain/gateways/CameraGateway.ts</code>, <code>LocationGateway.ts</code> · Fakes em memória: <code>src/infra/InMemoryCameraGateway.ts</code>, <code>InMemoryLocationGateway.ts</code>.',
    is_column=False
)

# Slide 14 (Column)
s14_callout = make_callout(
    'No cafezal não há garantia de sinal 4G/5G. Todas as pesagens e despesas entram na fila Outbox local em memória e são despachadas atomicamente para o servidor com resolução LWW assim que a conexão retorna.',
    'Caso de Uso: <code>src/usecases/SyncPendingQueue.ts</code> · Entidade: <code>src/domain/entities/SyncQueueItem.ts</code> · Fakes com Map em <code>src/infra/</code>.',
    is_column=True
)

# Slide 15 (Column)
s15_callout = make_callout(
    'Elimina Prop Drilling e impede que as telas de React Native importem lógica de domínio ou de casos de uso diretamente. A Context API isola o ciclo de vida reativo e provê a sessão globalmente.',
    'Localização: <code>src/adapters/auth/AuthContext.tsx</code>, <code>src/adapters/hooks/useAuth.ts</code>, <code>useApontamentos.ts</code>, <code>useTrabalhadores.ts</code>.',
    is_column=True
)

# Slide 16 (Column)
s16_callout = make_callout(
    'Permite validar renderização visual, preenchimento de inputs e navegação do operador sem necessidade de abrir emulador físico pesado ou realizar cliques manuais lentos.',
    'Telas em: <code>app/login.tsx</code>, <code>app/(drawer)/(tabs)/apontamento.tsx</code>, <code>trabalhadores.tsx</code> · Testes RNTL em: <code>tests/screens/LoginScreen.test.tsx</code>.',
    is_column=True
)

# Slide 17 (Column)
s17_callout = make_callout(
    'Nunca utilizar AsyncStorage sem criptografia para tokens. O uso de hardware criptográfico (Keychain no iOS e Keystore no Android) protege as credenciais do operador mesmo em aparelhos perdidos.',
    'Adaptador: <code>src/adapters/auth/SessionStorageSecureStore.ts</code> · Gateway: <code>src/domain/gateways/SessionStorage.ts</code> · Teste: <code>tests/adapters/SessionStorageSecureStore.test.ts</code>.',
    is_column=True
)

# Slide 18 (Full)
s18_callout = make_callout(
    'Prova técnica de desacoplamento absoluto. Sem conexão física de banco ou hardware nos testes, a execução é 100% determinística, à prova de oscilações de rede e com execução em apenas ~5.9 segundos.',
    'Isolamento em memória configurado em: <code>tests/setup.ts</code> e implementações fake em <code>src/infra/</code>.',
    is_column=False
)

# Slide 19 (Full)
s19_callout = make_callout(
    'Comprovação matemática da qualidade do software entregue. A meta da disciplina era de 80% de cobertura, e o SafraCafé alcançou 91.82% de cobertura de linhas com 234 testes automatizados 100% aprovados.',
    'Relatório oficial Jest gerado por <code>npm test -- --coverage</code> · Configuração em <code>jest.config.js</code>.',
    is_column=False
)

# Slide 20 (Full)
s20_callout = make_callout(
    'Síntese para a banca avaliadora: o SafraCafé foi projetado desde o primeiro dia com princípios sólidos de engenharia de software corporativa, permitindo evolução contínua sem quebrar regras de negócio.',
    'Visão consolidada em <code>src/factory/container.ts</code> (wiring Singleton de toda a aplicação).',
    is_column=False
)

# Function to replace existing callout in a specific section
def replace_callout_in_section(html_text, sec_id, new_callout):
    pattern = rf'(<section[^>]*id="{sec_id}"[^>]*>[\s\S]*?)(<!-- Destaque: Por que é importante & Onde está no app -->[\s\S]*?</div>\s*</div>\s*</div>)'
    m = re.search(pattern, html_text)
    if m:
        html_text = html_text[:m.start(2)] + new_callout.strip() + html_text[m.end(2):]
    return html_text

sections_mapping = [
    ('slide1', s1_callout),
    ('slide2', s2_callout),
    ('slide3', s3_callout),
    ('slide4', s4_callout),
    ('slide5', s5_callout),
    ('slide6', s6_callout),
    ('slide7', s7_callout),
    ('slide-checklist', s_chk_callout),
    ('slide8', s8_callout),
    ('slide9', s9_callout),
    ('slide10', s10_callout),
    ('slide11', s11_callout),
    ('slide12', s12_callout),
    ('slide13', s13_callout),
    ('slide14', s14_callout),
    ('slide15', s15_callout),
    ('slide16', s16_callout),
    ('slide17', s17_callout),
    ('slide18', s18_callout),
    ('slide19', s19_callout),
    ('slide20', s20_callout)
]

for sec_id, new_c in sections_mapping:
    html = replace_callout_in_section(html, sec_id, new_c)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("All callouts updated with anti-overflow classes and column-responsive layouts!")
