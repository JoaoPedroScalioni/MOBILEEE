# -*- coding: utf-8 -*-
with open('apresentacao.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix subtitle in slide 1
text = text.replace(
    'Projeto <span class="text-emerald-400 font-semibold">SafraCafé</span> — Sistema de Avaliação de Estágio e Registro de Atividades Desacoplado',
    'Projeto <span class="text-emerald-400 font-semibold">SafraCafé</span> — Gestão Offline-First da Colheita Cafeeira (Domínio e Interface Primeiro)'
)

# 2. Add callout in slide 1 if missing
callout_slide1 = '''            <!-- Destaque: Por que é importante & Onde está no app -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-w-4xl mx-auto text-left">
                <div class="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-start space-x-2.5 shadow-sm">
                    <div class="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-base flex-shrink-0">🎯</div>
                    <div>
                        <div class="text-[10.5px] font-mono font-bold uppercase tracking-wider text-amber-400">Por que é importante ter isso?</div>
                        <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">Blindar as regras centrais da colheita cafeeira antes de acoplar qualquer banco físico ou framework de UI. Evita retrabalho estrutural e garante domínio puro 100% testável.</p>
                    </div>
                </div>
                <div class="bg-blue-950/40 border border-blue-600/40 rounded-xl p-3 flex items-start space-x-2.5 shadow-sm">
                    <div class="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-base flex-shrink-0">📂</div>
                    <div>
                        <div class="text-[10.5px] font-mono font-bold uppercase tracking-wider text-blue-400">Onde está no nosso app?</div>
                        <p class="text-xs text-slate-300 mt-0.5 font-mono leading-relaxed">Raiz arquitetural: <code>src/domain/</code>, <code>src/usecases/</code>, <code>src/adapters/</code>, <code>src/infra/</code>, <code>src/factory/container.ts</code> e suíte em <code>tests/</code>.</p>
                    </div>
                </div>
            </div>'''

needle_slide1 = '<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">'
if 'Blindar as regras centrais da colheita cafeeira' not in text:
    text = text.replace(needle_slide1, callout_slide1 + '\n\n            ' + needle_slide1, 1)

# 3. Fix slide 19 pyramid labels
text = text.replace('AssinaturaScreen, Atividades, Login', 'LoginScreen, Apontamento, Trabalhadores')
text = text.replace('AuthProvider, useAtividades, SessionStorage', 'AuthProvider, useAuth, useApontamentos, SessionStorage')

# 4. Remove obsolete switchServiceTab and switchRntlTab from bottom script
old_funcs = '''        // Controle de Abas de Domain Services (Slide 10)
        function switchServiceTab(service) {
            const panels = {
                pdf: document.getElementById('panel-svc-pdf'),
                devolucao: document.getElementById('panel-svc-devolucao'),
                sync: document.getElementById('panel-svc-sync'),
            };
            const buttons = {
                pdf: document.getElementById('btn-svc-pdf'),
                devolucao: document.getElementById('btn-svc-devolucao'),
                sync: document.getElementById('btn-svc-sync'),
            };
            Object.keys(panels).forEach(key => {
                if (key === service) {
                    panels[key].classList.remove('hidden');
                    buttons[key].className = 'w-full text-left p-3 rounded-lg border transition bg-emerald-950/80 border-emerald-600 text-white';
                } else {
                    panels[key].classList.add('hidden');
                    buttons[key].className = 'w-full text-left p-3 rounded-lg border transition bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300';
                }
            });
        }

        // Controle de Abas de Telas RNTL (Slide 16)
        function switchRntlTab(screen) {
            const panels = {
                assinatura: document.getElementById('panel-rntl-assinatura'),
                atividades: document.getElementById('panel-rntl-atividades'),
                historico: document.getElementById('panel-rntl-historico'),
            };
            const buttons = {
                assinatura: document.getElementById('btn-rntl-assinatura'),
                atividades: document.getElementById('btn-rntl-atividades'),
                historico: document.getElementById('btn-rntl-historico'),
            };
            Object.keys(panels).forEach(key => {
                if (key === screen) {
                    panels[key].classList.remove('hidden');
                    buttons[key].className = 'w-full text-left p-2.5 rounded-lg border transition bg-emerald-950/80 border-emerald-600 text-white';
                } else {
                    panels[key].classList.add('hidden');
                    buttons[key].className = 'w-full text-left p-2.5 rounded-lg border transition bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300';
                }
            });
        }'''

if old_funcs in text:
    text = text.replace(old_funcs, '')

with open('apresentacao.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Final presentation polish applied successfully!")
