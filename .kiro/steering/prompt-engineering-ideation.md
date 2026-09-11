---
inclusion: manual
name: prompt-ideation
description: Regras de engenharia de prompts para a fase de exploração e brainstorming de ideias
---

# Regras de Engenharia de Prompts — Exploração de Ideias

Use este steering file sempre que a sessão envolver **explorar uma ideia**, **brainstorming** ou **descoberta de novos requisitos**. O objetivo é maximizar criatividade e profundidade analítica antes de qualquer comprometimento de design.

---

## 1. Atribuição de Papel (Role-Playing + Context Framing)

Sempre inicie a exploração definindo **quem você é** neste contexto. Nunca entre numa sessão de ideação sem papel definido.

**Papéis recomendados para este projeto:**
- `"Você é um arquiteto mobile sênior com 10 anos de experiência em apps de campo e coleta de dados geoespaciais."`
- `"Você é um engenheiro de domínio especialista em DDD aplicado a aplicações React Native."`
- `"Você é um product designer focado em UX para usuários de campo (pesquisadores, biólogos, técnicos ambientais)."`

Adapte o papel à natureza da ideia que está sendo explorada. Um problema de UX pede um designer; um problema de arquitetura pede um arquiteto.

---

## 2. Zero-Shot com Contexto Rico

Para tarefas de ideação criativa, **não force exemplos restritivos** que enviesem o modelo. Use zero-shot, mas sempre injete o contexto do projeto como base.

**Estrutura do prompt de ideação:**
```
Contexto: [descreva brevemente o estado atual do projeto e a área sendo explorada]
Papel: [defina o especialista]
Tarefa: [descreva o problema ou oportunidade em aberto — sem sugerir solução]
Restrições conhecidas: [liste o que não pode mudar — ex: Clean Architecture, Expo v54, TypeScript]
```

**Exemplo aplicado ao SafraCafé:**
```
Contexto: O SafraCafé é um app de gestão da colheita cafeeira (trabalhadores,
          apontamentos de balaio, despesas) com câmera + GPS + mapas, arquitetura
          limpa (DDD), repositórios em memória e Expo Router v54.
Papel: Arquiteto mobile sênior especialista em apps offline-first de campo.
Tarefa: Quais mecanismos de persistência e sincronização de dados poderiam
        substituir os InMemoryRepository sem quebrar os contratos do domínio?
Restrições: Os contratos TrabalhadorRepository/ApontamentoRepository/DespesaRepository
            (save/findById/findAll) não podem mudar.
            O projeto usa TypeScript + Expo SDK 54.
```

---

## 3. Exploração em Árvore (Tree-of-Thought — ToT)

Nunca peça ao modelo que siga um único caminho linear. Exija que ele **ramifique** o espaço de ideias e se autoavalie.

**Template obrigatório para ideação complexa:**
```
Gere 3 a 5 abordagens alternativas para [problema].
Para cada abordagem:
  - Descreva a ideia em 2-3 frases
  - Liste 2 vantagens concretas para o contexto do SafraCafé
  - Liste 2 riscos ou limitações reais
  - Dê uma nota de viabilidade de 1 a 10 considerando: Expo v54, Clean Architecture, equipe pequena
Continue desenvolvendo apenas as abordagens com nota >= 7.
```

**Por que isso funciona:** força o modelo a avaliar trade-offs reais antes de se comprometer com uma direção, evitando que a primeira ideia plausível "vença" por inércia.

---

## 4. Perguntas que Ampliam o Espaço

Durante ideação, use estas perguntas para expandir antes de convergir:

- "O que acontece se escalarmos isso para 10.000 apontamentos?"
- "Como um usuário de campo com conexão intermitente usaria isso?"
- "O que precisaria mudar na camada de domínio para suportar isso?"
- "Quais novos casos de uso isso habilita?"
- "O que isso quebra na arquitetura atual?"

---

## 5. Regra de Ouro da Ideação

> **Nesta fase, nenhuma ideia é descartada sem avaliação.** Resista à tentação de implementar. O output de uma sessão de ideação é sempre uma **lista avaliada de caminhos**, nunca código.

A transição para implementação só acontece após passar pelo fluxo de **criação de proposta** (veja `prompt-engineering-proposal.md`).
