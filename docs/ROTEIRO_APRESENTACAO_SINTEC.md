# ☕ SafraCafé — Roteiro Oficial de Apresentação e Gravação de Vídeo (SINTEC)

> **Evento:** SINTEC — Simpósio de Inovação, Tecnologia, Empreendedorismo e Ciências Computacionais  
> **Instituição:** CEFET-MG — Campus Varginha | Bacharelado em Sistemas de Informação (BSI)  
> **Projeto:** SafraCafé — Sistema Móvel Offline-First para Gestão Operacional e Rastreabilidade da Colheita Cafeeira  
> **Autor / Apresentador:** João Pedro Scalioni  
> **Orientador(a):** [Nome do Orientador]  
> **Área Temática:** Projeto de Iniciação Científica *(ou Projeto de Extensão)*  
> **Duração do Vídeo:** 5 a 10 minutos (Alvo planejado: **07:30 a 08:30 min**)

---

## ⏱️ Grade de Planejamento de Tempo

| # | Slide / Seção Oficial SINTEC | Tempo Estimado | Tempo Acumulado |
|---|---|---|---|
| **1** | Capa (Identificação institucional e título) | 00:40 min | 00:40 |
| **2** | Objetivo (Geral e Específicos) | 00:45 min | 01:25 |
| **3** | Justificativa (Problema no Cafezal & Relevância) | 01:00 min | 02:25 |
| **4** | Metodologia (DDD, Clean Arch, TDD, Offline-First) | 01:00 min | 03:25 |
| **5.1** | Descrição do Projeto: Arquitetura & Fila Outbox | 00:50 min | 04:15 |
| **5.2** | Descrição do Projeto: Módulos Centrais (Colheita/RH/Custos) | 00:50 min | 05:05 |
| **6.1** | Fotos/Prints de Tela: Login & Apontamento no Eito | 01:00 min | 06:05 |
| **6.2** | Fotos/Prints de Tela: Trabalhadores, Despesas e Mapa GPS | 01:00 min | 07:05 |
| **7** | Considerações Finais & Resultados (125 testes 100%) | 00:50 min | 07:55 |
| **8** | Referências Bibliográficas & Encerramento | 00:20 min | **~08:15** |

---

## 🎬 Slide a Slide: Conteúdo Visual e Roteiro de Fala

---

### Slide 1: Capa (Template SINTEC)

#### O que colocar no Slide
* **Título do Trabalho:**
  > **SafraCafé: Sistema Móvel Offline-First para Gestão Operacional e Rastreabilidade da Colheita Cafeeira**
* **Área Temática:**
  > Projeto de Iniciação Científica *(ou Projeto de Extensão)*
* **Autores:**
  > **João Pedro Scalioni** (Apresentador / Autor)  
  > **[Nome do Orientador]** (Orientador)
* **Instituição:** CEFET-MG — Campus Varginha | Bacharelado em Sistemas de Informação
* **Rodapé:** Logotipos oficiais dos Realizadores (CEFET-MG Varginha, BSI, SITE) e Apoiadores (DEDC, Porto Inovação, Nascente Incubadora, Trens Dê, SEBRAE).

#### Roteiro de Fala (Script do Vídeo) — [00:00 - 00:40]
> *"Olá a todos! Meu nome é João Pedro Scalioni, graduando em Sistemas de Informação pelo CEFET-MG Campus Varginha. Sob orientação do(a) professor(a) [Nome do Orientador], apresento ao SINTEC o projeto **SafraCafé: Sistema Móvel Offline-First para Gestão Operacional e Rastreabilidade da Colheita Cafeeira**.*  
> *Este trabalho propõe uma solução de engenharia de software desenhada especificamente para os desafios da cafeicultura no Sul de Minas, levando tecnologia móvel de ponta para a beira do eito da lavoura, onde a internet celular quase nunca está disponível."*

---

### Slide 2: OBJETIVO

#### O que colocar no Slide
* **Objetivo Geral:**
  * Desenvolver e validar um aplicativo mobile com arquitetura estritamente **Offline-First**, permitindo a apuração operacional da colheita cafeeira, controle de equipe e lançamento de despesas sem qualquer dependência de conectividade imediata.
* **Objetivos Específicos:**
  * **Identificação Óptica Ágil:** Identificar trabalhadores via leitura de **QR Code** impresso em crachás físicos;
  * **Rastreabilidade Espacial Auditável:** Vincular a coordenada **GPS sob demanda** a cada balaio de café registrado;
  * **Gestão de Custos de Campo:** Capturar despesas operacionais com fotografia do comprovante fiscal;
  * **Confiabilidade Arquitetural:** Construir o sistema aplicando **Clean Architecture, Domain-Driven Design (DDD) e TDD**, garantindo testabilidade e integridade matemática das regras.

#### Roteiro de Fala (Script do Vídeo) — [00:40 - 01:25]
> *"O objetivo central do projeto é entregar ao gestor da fazenda e ao apontador de campo uma ferramenta ágil, que funcione em modo 100% offline — tratando a falta de sinal de rede como a condição normal de trabalho, e não como uma falha.*  
> *Dentre os objetivos específicos, o aplicativo agiliza a pesagem da safra com leitura de QR Code dos crachás dos colhedores, fixa a coordenada geográfica do talhão onde o café foi colhido, registra despesas operacionais com fotos dos recibos e enfileira tudo para sincronização automática com a nuvem assim que houver sinal de internet."*

---

### Slide 3: JUSTIFICATIVA

#### O que colocar no Slide
* **Importância do Agronegócio Cafeeiro:**
  * O Sul de Minas é referência global na produção de café arábica de alta qualidade, movimentando milhões de reais e mobilizando milhares de apanhadores durante a safra.
* **Gargalos do Método Convencional (Cadernos de Papel):**
  * **Vulnerabilidade física:** Chuva, poeira e danos mecânicos destroem anotações no campo;
  * **Erros e contestações:** Divergências na contagem manual de balaios e no cálculo de diárias;
  * **Retrabalho:** Horas perdidas redigitando dados em planilhas ao final do dia;
  * **Inviabilidade de softwares comuns:** Soluções genéricas travam ao perder sinal 3G/4G.
* **Impacto Social & Econômico:**
  * Transparência para o trabalhador rural no acerto financeiro;
  * Segurança fiscal e controle de estoque de grãos em tempo real para o produtor.

#### Roteiro de Fala (Script do Vídeo) — [01:25 - 02:25]
> *"Por que este projeto é tão urgente? Quem conhece a rotina da colheita de café sabe que ela ocorre em talhões montanhosos e afastados. Historicamente, essa apuração é feita em folhas de papel e cadernetas.*  
> *Isso traz três grandes problemas: primeiro, o risco físico — um temporal ou uma folha rasgada podem apagar o trabalho de uma semana inteira; segundo, a margem para fraudes ou discussões no momento de pagar os colhedores; e terceiro, a lentidão no fechamento contábil.*  
> *Aplicativos móveis comuns falham no campo porque dependem da nuvem para abrir telas ou registrar itens. O SafraCafé resolve essa dor ao garantir persistência local imediata e sincronização resiliente em segundo plano."*

---

### Slide 4: METODOLOGIA

#### O que colocar no Slide
* **Princípios de Engenharia de Software:**
  * **Domain-Driven Design (DDD):** Modelagem com Entidades (*Trabalhador, Apontamento, Despesa*), Value Objects imutáveis (*Coordinates, QuantidadeBalaio, ValorMonetario*) e Serviços de Domínio;
  * **Clean Architecture:** Desacoplamento absoluto (*Domain ➔ Use Cases ➔ Adapters/Infra ➔ UI*);
  * **Test-Driven Development (TDD):** Código construído orientado por testes unitários e de integração com Jest e RNTL.
* **Stack Tecnológica Mobile:**
  * **Framework:** React Native + Expo SDK 57 (TypeScript);
  * **Navegação:** Expo Router (roteamento declarativo com Bottom Tabs e Drawer);
  * **Hardware & Sensores:** `expo-camera` (QR Code), `expo-location` (GPS sob demanda), `expo-image-picker` (recibos) e `expo-secure-store` (tokens protegidos em hardware seguro);
  * **Persistência Local & Nuvem:** SQLite local ACID e backend Supabase BaaS (PostgreSQL).

#### Roteiro de Fala (Script do Vídeo) — [02:25 - 03:25]
> *"Na metodologia, aplicamos as melhores práticas de Engenharia de Software: Domain-Driven Design e Clean Architecture. Isso significa que o 'coração' do sistema — as regras da colheita, cálculos de volume e validação de documentos — reside em uma camada de domínio 100% pura, que não depende de bibliotecas visuais ou de banco de dados.*  
> *Todo o desenvolvimento seguiu o TDD (Test-Driven Development). Utilizamos React Native com o Expo SDK 57 e TypeScript. Para interagir com o dispositivo de forma eficiente, isolamos o acesso à câmera para leitura do QR Code, acionamos o GPS apenas no clique da pesagem para poupar bateria e persistimos as credenciais de acesso no chip de segurança do aparelho via SecureStore."*

---

### Slide 5.1: DESCRIÇÃO DO PROJETO — Arquitetura e Engenharia Offline-First

#### O que colocar no Slide
* **Padrão Arquitetural Outbox (Fila de Sincronização):**
  * `Ação na Tela` ➔ `Validação de Negócio` ➔ `Gravação Atômica no SQLite` + `Enfileiramento na SyncQueue` ➔ `Retorno Imediato ao Usuário`.
* **Sincronização Resiliente em Segundo Plano:**
  * Monitoramento inteligente de rede (`NetInfo`);
  * Lotes de até 50 registros enviados de forma assíncrona;
  * Resolução de conflitos via algoritmo *Last-Write-Wins* (desempate por timestamp UTC `updatedAt`);
  * Retentativas com espera exponencial (*exponential backoff*).
* **Desacoplamento via Inversão de Dependência:**
  * Interfaces no domínio e Container de Injeção de Dependências centralizado (`container.ts`).

#### Roteiro de Fala (Script do Vídeo) — [03:25 - 04:15]
> *"Entrando nos detalhes técnicos da solução, a base do SafraCafé é o padrão de arquitetura Outbox. Quando o apontador registra um balaio, o dado é gravado no banco SQLite local e simultaneamente entra em uma fila de sincronização.*  
> *Para o operador na lavoura, a resposta é instantânea — não existe tela congelada aguardando internet. Um serviço em segundo plano observa o estado da conexão. Assim que o aparelho encontra Wi-Fi na sede da fazenda ou sinal celular, os lotes são enviados ao PostgreSQL no Supabase, com algoritmo Last-Write-Wins para desempate de concorrência e retentativas exponenciais em caso de oscilações de sinal."*

---

### Slide 5.2: DESCRIÇÃO DO PROJETO — Módulos Centrais de Negócio

#### O que colocar no Slide
* **1. Módulo Apontamento de Colheita (Operação do Eito):**
  * Aferição em litros/balaios por colhedor;
  * Leitura de QR Code do crachá do apanhador em < 1 segundo;
  * Amarração compulsória da coordenada GPS (latitude/longitude do talhão).
* **2. Módulo RH & Equipe de Colhedores:**
  * Cadastro unívoco com validação matemática de CPF e chave sequencial (`TRAB-001`, `TRAB-002`);
  * Parametrização da diária e apuração transparente de produção acumulada.
* **3. Módulo de Despesas de Campo:**
  * Lançamento de custos operacionais (combustível do trator, lubrificantes, ferramentas);
  * Anexação fotográfica do recibo fiscal e geolocalização da compra.
* **4. Módulo de Mapas & Telemetria:**
  * Visualização espacial de talhões e marcadores de apontamentos via `react-native-maps`.

#### Roteiro de Fala (Script do Vídeo) — [04:15 - 05:05]
> *"O aplicativo é estruturado em quatro módulos integrados:*  
> *O módulo de **Apontamento**, que é o motor do app: o operador aciona a câmera, lê o QR Code do crachá do trabalhador, insere a quantidade colhida em litros e o app fixa as coordenadas do GPS com precisão milimétrica.*  
> *O módulo de **Trabalhadores**, que centraliza a equipe, valida CPFs e automatiza a conferência de diárias.*  
> *O módulo de **Despesas**, permitindo fotografar notas fiscais e classificar custos de manutenção e insumos.*  
> *E o módulo de **Mapas**, que permite ao produtor visualizar a mancha geográfica da colheita nos talhões da fazenda."*

---

### Slide 6.1: FOTOS / PRINTS DE TELA — Login e Apontamento no Eito

#### O que colocar no Slide
* **Print 1: Autenticação Segura (`login.tsx`)**
  * *Legenda:* Porta de entrada com login por credenciais protegidas no hardware (`expo-secure-store`), atalho com preenchimento da conta demo e tolerância a boot sem internet.
* **Print 2: Apontamento de Colheita (`apontamento.tsx`)**
  * *Legenda:* Interface de alto contraste otimizada para o sol do campo, contadores dinâmicos ("Balaios Hoje" e "Litros Colhidos"), leitor óptico de QR Code integrado e feed dos últimos lançamentos.

#### Roteiro de Fala (Script do Vídeo) — [05:05 - 06:05]
> *"Vemos agora a interface real do SafraCafé.*  
> *À esquerda, temos a tela de autenticação segura. Toda a gestão de sessão utiliza criptografia de hardware no SecureStore do dispositivo. Isso significa que, se o aparelho descarregar ou for reiniciado no meio do cafezal, a sessão do operador se mantém ativa e autenticada sem precisar consultar a nuvem.*  
> *À direita, apresentamos a tela de Apontamento. O layout foi construído pensando nas condições severas do campo: tipografia grande, excelente legibilidade sob luz solar direta e contadores em tempo real. O apontador tem o botão de bipar o crachá via QR Code, o campo de litros e a fixação automática do GPS — um processo que leva menos de três segundos por colhedor."*

---

### Slide 6.2: FOTOS / PRINTS DE TELA — Trabalhadores, Despesas e Mapa

#### O que colocar no Slide
* **Print 3: Gestão de Trabalhadores (`trabalhadores.tsx`)**
  * *Legenda:* Busca instantânea por nome ou crachá, exibição de diárias acordadas e acesso ao cadastro de colhedores.
* **Print 4: Controle de Despesas (`despesas.tsx`)**
  * *Legenda:* Lançamento financeiro com classificação de categoria, valor monetário formatado e preview da foto do comprovante fiscal.
* **Print 5: Mapa da Lavoura (`mapas.tsx`)**
  * *Legenda:* Visualização cartográfica com marcadores interativos de colheita na região cafeeira de Varginha e rotas de escoamento.

#### Roteiro de Fala (Script do Vídeo) — [06:05 - 07:05]
> *"Nesta lâmina, apresentamos os módulos de gestão e cartografia.*  
> *Na primeira tela, a gestão de trabalhadores conta com busca instantânea e lista clara com crachá e diária acordada.*  
> *Na tela central, o controle de despesas permite anexar fotos de notas fiscais usando a câmera ou galeria, com compressão automática da imagem para otimizar o envio quando houver sinal.*  
> *E na terceira tela, temos o mapa da lavoura gerado com o react-native-maps. Ele exibe os pontos exatos de colheita georreferenciados na região do Sul de Minas, permitindo auditar o rendimento de cada talhão e planejar a logística dos caminhões de recolhimento dos grãos."*

---

### Slide 7: CONSIDERAÇÕES FINAIS E RESULTADOS

#### O que colocar no Slide
* **Qualidade e Cobertura de Testes (TDD):**
  * **100% de Sucesso:** 33 suítes de testes executadas e **125 testes automatizados aprovados**;
  * Pirâmide de testes completa: Domínio Puro, Casos de Uso com Fakes, Adapters e Componentes com RNTL.
* **Resultados & Benefícios Alcançados:**
  * Sistema 100% funcional em Modo Avião;
  * Eliminação de perdas em papel e agilização imediata no fechamento das diárias;
  * Rastreabilidade auditável da safra com coordenadas de GPS.
* **Trabalhos Futuros:**
  * Publicação do sync engine em ambiente de produção com Supabase;
  * Geração e exportação de relatórios consolidados em PDF direto pelo smartphone;
  * Parcerias com cooperativas cafeeiras locais para validação em larga escala.

#### Roteiro de Fala (Script do Vídeo) — [07:05 - 07:55]
> *"Como considerações finais, a qualidade da engenharia do SafraCafé foi comprovada na prática: nossa suíte de testes automatizados atingiu 100% de aprovação em 125 testes distribuídos em 33 suítes, cobrindo desde regras matemáticas de volume até a renderização dos componentes gráficos com a React Native Testing Library.*  
> *O aplicativo comprova que é viável entregar uma experiência mobile robusta, moderna e confiável no campo, valorizando o trabalho do apanhador de café e dando segurança ao produtor rural.*  
> *Como passos futuros, estamos finalizando a esteira de sincronização com o banco Supabase em produção e implementando a emissão de relatórios de safra em PDF direto no celular."*

---

### Slide 8: REFERÊNCIAS BIBLIOGRÁFICAS

#### O que colocar no Slide
* **EVANS, Eric.** *Domain-Driven Design: Atacando as complexidades no coração do software.* Alta Books, 2014.
* **MARTIN, Robert C.** *Clean Architecture: A Craftsman's Guide to Software Structure and Design.* Prentice Hall, 2017.
* **EXPO DOCUMENTATION.** *Expo SDK 57 & React Native Reference.* Disponível em: <https://docs.expo.dev/>. Acesso em: 2026.
* **COMPANHIA NACIONAL DE ABASTECIMENTO (CONAB).** *Acompanhamento da Safra Brasileira de Café.* Brasília: Conab, 2025.
* **KLEPPMANN, Martin.** *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems.* O'Reilly Media, 2017.

#### Roteiro de Fala (Script do Vídeo) — [07:55 - 08:15]
> *"Aqui estão as referências bibliográficas que fundamentaram este trabalho de engenharia de software e domínio cafeeiro.*  
> *Agradeço imensamente ao CEFET-MG Campus Varginha, ao curso de Sistemas de Informação, à organização do SINTEC e a todos vocês que assistiram. Muito obrigado!"*

---

## 💡 Dicas de Gravação para o seu Vídeo

1. **Software:** Use o **OBS Studio** (gratuito) gravando sua tela cheia com os slides e sua webcam pequena no canto superior/inferior direito (estilo PiP).
2. **Áudio:** Grave em local silencioso, com fone de ouvido com microfone próximo à boca para evitar eco.
3. **Iluminação:** Sente-se de frente para uma janela ou luminária (a luz deve iluminar seu rosto, nunca vir de trás).
4. **Tempo:** Coloque o cronômetro do celular visível ao lado do seu monitor para acompanhar os marcos de tempo a cada slide.
