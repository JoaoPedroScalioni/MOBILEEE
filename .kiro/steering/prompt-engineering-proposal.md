---
inclusion: manual
name: prompt-proposal
description: Regras de engenharia de prompts para a fase de criação de propostas estruturadas e specs
---

# Regras de Engenharia de Prompts — Criação de Proposta

Use este steering file quando a ideia já está definida e o objetivo é **transformá-la em uma proposta sólida, rastreável e implementável**. O foco muda de criatividade para controle, precisão e estrutura.

---

## 1. Instrução Altamente Estruturada (Anti-ambiguidade)

Todo prompt de proposta deve seguir este framework. Ambiguidade aqui gera specs incompletas.

```
OBJETIVO:    [A tarefa específica a ser realizada — 1 frase]
CONTEXTO:    [Background relevante do projeto — estado atual + motivação]
RESTRIÇÕES:  [O que não pode mudar — contratos, versões, padrões arquiteturais]
FORMATO:     [A estrutura exata esperada no output — seções, tipos de artefato]
TOM:         [Direto e técnico | Didático | Formal]
```

**Exemplo aplicado ao SafraCafé — nova entidade "Talhão":**
```
OBJETIVO:    Criar a proposta de design para uma nova entidade Talhao no domínio do SafraCafé.
CONTEXTO:    O SafraCafé registra Apontamentos de balaio (litros + GPS) por trabalhador. 
             Precisamos associar cada apontamento a um talhão da lavoura. Já existem 
             Trabalhador.ts, Apontamento.ts (com trabalhadorId, quantidade, coordenadas, data) 
             e repos InMemory (Singleton).
RESTRIÇÕES:  Clean Architecture: domínio não pode importar infra. Interfaces 
             (TrabalhadorRepository/ApontamentoRepository/DespesaRepository) não podem quebrar. 
             Expo SDK 54. TypeScript strict.
FORMATO:     1. Value Objects necessários, 2. Mudanças na entidade Apontamento, 
             3. Novo contrato de repositório, 4. Casos de uso afetados, 
             5. Testes unitários obrigatórios.
TOM:         Técnico e direto.
```

---

## 2. Encadeamento de Prompts (Prompt Chaining)

Propostas complexas **nunca são geradas em um único prompt**. Decomponha em etapas sequenciais onde o output de cada uma é o input da próxima.

**Fluxo padrão para uma nova feature no SafraCafé:**

```
Prompt 1 — Análise de Impacto
  → Input: descrição da feature
  → Output: lista de arquivos afetados + camadas impactadas (domínio/infra/usecase/ui)

Prompt 2 — Design do Domínio  [recebe output do Prompt 1]
  → Input: lista de impactos
  → Output: novos Value Objects, mudanças em entidades, novos contratos

Prompt 3 — Design dos Casos de Uso  [recebe output do Prompt 2]
  → Input: design do domínio
  → Output: DTOs, assinaturas dos use cases, sequência de operações

Prompt 4 — Spec de Testes  [recebe outputs 2 e 3]
  → Input: entidades + use cases definidos
  → Output: lista de describe/it com casos felizes e casos de erro

Prompt 5 — Tasks de Implementação  [recebe todos os outputs anteriores]
  → Input: design completo
  → Output: lista ordenada de tasks para o Spec do Kiro
```

**Regra:** nunca pule uma etapa. Se o design do domínio não estiver fechado, o design dos casos de uso será instável.

---

## 3. Few-Shot para Formato Consistente

Quando o output precisa de formato preciso (ex: tasks do Kiro Spec, estrutura de entidade), inclua **2 a 5 exemplos** de entrada e saída esperadas.

**Exemplo — Few-Shot para criar um Value Object no padrão do projeto:**
```
Exemplo 1:
  Input:  "Preciso de um VO para altitude em metros"
  Output: 
    export class Altitude {
      constructor(public readonly meters: number) {
        this.validate();
      }
      private validate(): void {
        if (this.meters < -500 || this.meters > 9000)
          throw new Error('Altitude inválida');
      }
    }

Exemplo 2:
  Input:  "Preciso de um VO para nome de espécie"
  Output:
    export class SpeciesName {
      constructor(public readonly value: string) {
        this.validate();
      }
      private validate(): void {
        if (!this.value || this.value.trim().length < 2)
          throw new Error('Nome de espécie inválido');
      }
    }

Agora crie: [sua nova solicitação aqui]
```

Limite: 2–5 exemplos. Mais de 10 raramente melhora qualidade e consome contexto desnecessariamente.

---

## 4. Injeção de Fatos (RAG — Retrieval-Augmented Generation)

Quando a proposta depende de **dados externos** (docs de API, versões de libs, esquemas existentes), injete-os explicitamente. Nunca confie na memória estática do modelo para dados que podem mudar.

**Fontes a injetar no contexto para o SafraCafé:**
- `#File src/domain/entities/Apontamento.ts` — estado atual da entidade
- `#File src/domain/repositories/ApontamentoRepository.ts` — contrato vigente
- `#File src/factory/container.ts` — wiring atual do DI
- Trecho relevante da doc do Expo: https://docs.expo.dev/versions/v54.0.0/

**Template de injeção:**
```
Contexto dos arquivos atuais:
[cole aqui o conteúdo dos arquivos relevantes]

Com base nesses contratos existentes, proponha [feature].
Cite explicitamente quais partes do código atual são afetadas.
```

---

## 5. Self-Correction Loop (Auto-Revisão)

Ao final de qualquer proposta gerada, adicione sempre este prompt de revisão antes de aceitar o resultado:

```
Revise a proposta acima respondendo:
1. Todos os contratos existentes (TrabalhadorRepository, ApontamentoRepository, DespesaRepository, Coordinates) são preservados?
2. Alguma camada está importando de uma camada superior (violação de Clean Architecture)?
3. Os casos de uso propostos têm injeção de dependência via construtor?
4. Existe algum caso de erro não coberto na spec de testes?
5. Há alguma inconsistência lógica ou passo faltando na sequência de implementação?

Corrija qualquer problema encontrado antes de prosseguir.
```

**Este passo é obrigatório** antes de criar um Spec no Kiro ou iniciar implementação.

---

## 6. Saída Esperada de uma Proposta Aprovada

Uma proposta está pronta para virar Spec quando contém:

- [ ] Objetivo claro em 1 frase
- [ ] Lista de arquivos novos e modificados
- [ ] Design das entidades/VOs/repositórios
- [ ] Assinaturas dos casos de uso com DTOs
- [ ] Pelo menos 3 cenários de teste (happy path + 2 erros)
- [ ] Tasks ordenadas e sem dependências circulares
- [ ] Self-correction loop executado e aprovado
