# SafraCafé — Guia de Agentes, Steering e Fluxo SDD

> Leia as docs do Expo sempre na versão correta: https://docs.expo.dev/versions/v54.0.0/

---

## Visão Geral do Fluxo

O projeto usa **Spec Driven Development (SDD)** em 4 fases. Cada fase tem um instrumento dedicado:

```
[IDEIA]  →  [PROPOSTA]  →  [SPEC]  →  [IMPLEMENTAÇÃO]
   ↓              ↓            ↓              ↓
IdeaExplorer  ProposalWriter  Kiro Spec  Kiro Autopilot
(steering:    (steering:      (tasks     + hook Self-
 ideation)     proposal)       ordenadas)  Correction)
```

---

## Steering Files disponíveis

| Arquivo | Inclusão | Quando usar |
|---------|----------|-------------|
| `project-context.md` | automática (sempre) | Contexto do projeto, arquitetura, padrões |
| `prompt-engineering-ideation.md` | manual (`#prompt-ideation`) | Sessões de brainstorming e exploração |
| `prompt-engineering-proposal.md` | manual (`#prompt-proposal`) | Criação de propostas técnicas estruturadas |

Para ativar um steering manual, mencione a tag no chat:  
`#prompt-ideation` ou `#prompt-proposal`

---

## Agentes Disponíveis

### IdeaExplorer
**Quando usar:** você tem uma ideia vaga, um problema a resolver ou uma melhoria a explorar — mas ainda não sabe qual abordagem seguir.

**O que faz:**
- Assume papel de arquiteto sênior mobile + DDD
- Gera 3–5 abordagens alternativas (Tree-of-Thought)
- Avalia viabilidade de cada uma (nota 1–10)
- Aprofunda só as abordagens com nota ≥ 7
- Produz tabela comparativa + recomendação
- **Nunca implementa código** — apenas explora

**Como invocar:** abra uma sessão Vibe e diga:
> "Use o IdeaExplorer para explorar [sua ideia]"

---

### ProposalWriter
**Quando usar:** você já tem uma abordagem validada (saída do IdeaExplorer ou decisão própria) e precisa estruturá-la em uma proposta implementável.

**O que faz:**
1. Análise de impacto por camada (domínio / infra / usecase / ui)
2. Design do domínio (VOs, entidades, contratos)
3. Design dos casos de uso (DTOs, sequência de operações)
4. Spec de testes unitários (describe/it, helpers make*)
5. Tasks de implementação ordenadas (prontas para o Kiro Spec)
6. Self-Correction Loop automático antes de entregar

**Como invocar:** abra uma sessão Vibe e diga:
> "Use o ProposalWriter para criar a proposta de [feature já explorada]"

---

## Hook Automático: Self-Correction Loop

**Arquivo:** `.kiro/hooks/self-correction-post-task.json`  
**Gatilho:** `PostTaskExec` — dispara automaticamente após cada task de Spec ser marcada como concluída

**O que verifica:**
- Integridade dos contratos (`TrabalhadorRepository`, `ApontamentoRepository`, `DespesaRepository`, `Apontamento`, `Coordinates`)
- Direção das dependências (domain não importa infra)
- Injeção de dependência via construtor em todos os use cases
- Cobertura mínima de testes (VOs e entidades)
- Consistência do `container.ts`

**Resultado esperado:** `APROVADO` ou `CORRIGIDO — [descrição]` antes de iniciar a próxima task.

---

## Fluxo Completo SDD — Passo a Passo

### 1. Explorar a ideia
```
Sessão: Vibe
Steering: #prompt-ideation
Agente: IdeaExplorer

→ Output: tabela de abordagens avaliadas com viabilidade
```

### 2. Criar a proposta
```
Sessão: Vibe
Steering: #prompt-proposal
Agente: ProposalWriter

→ Output: proposta técnica com design de domínio, use cases, testes e tasks
→ Self-Correction Loop executado e aprovado
```

### 3. Criar o Spec no Kiro
```
Sessão: Spec (nova)
Título: [nome da feature]
Requisitos: cole o objetivo e contexto da proposta
Design: cole o design de domínio e use cases da proposta
Tasks: cole as tasks ordenadas da proposta

→ O Kiro gera o spec em .kiro/specs/<feature>/
```

### 4. Implementar
```
Sessão: Spec (existente)
Modo: Autopilot

→ Kiro executa cada task em ordem
→ Hook Self-Correction dispara após cada task concluída
→ Erros de arquitetura são capturados antes de avançar
```

---

## Referências de Arquitetura

Consulte `guia.md` para a explicação linha-a-linha de cada arquivo do `src/`.  
Consulte `DICAS_PROVA.md` para os padrões obrigatórios (Singleton, DTO, validate, etc.).

### Regras que nunca mudam
- `domain/` nunca importa de `infra/` ou `usecases/`
- Use cases recebem repositório via construtor (Injeção de Dependência)
- Repositórios de infra são Singleton: `private constructor` + `private static instance` + `public static getInstance()`
- Value Objects são imutáveis e se auto-validam no construtor
- Entidades se auto-validam e relançam validação em métodos `update*()`
- `container.ts` é o único ponto de wiring entre infra e use cases
