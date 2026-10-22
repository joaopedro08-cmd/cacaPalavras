# Projeto técnico — Deduzi

**Referência de produto:** `PRD.md`  
**Design escolhido:** `mockups/01-ux-clareza.html` — Design 01, foco em clareza e UX  
**Status:** proposta técnica para implementação do MVP  
**Data:** 2026-10-20

## 1. Objetivo

Este documento descreve como transformar o Design 01 em um jogo web responsivo, instalável como PWA e utilizável offline. O produto terá dois modos independentes — WordGuess e Forca — com navegação simples, regras visíveis, suporte a teclado, tema claro/escuro e compartilhamento de resultados.

O mockup é a fonte de verdade visual e de fluxo: cabeçalho compacto, marca Deduzi, tela inicial com dois modos, telas de jogo sem distrações, modal “Como jogar”, feedback junto à ação, cartões de resultado e tema persistente. Este documento complementa o protótipo com requisitos de produção do PRD, sem incorporar a linguagem visual dos Designs 02 e 03.

## 2. Escopo e premissas

### Incluído no MVP

- Home com acesso direto aos modos WordGuess e Forca.
- WordGuess com grade fixa de 5 letras por 6 tentativas, validação de palpites e feedback de posição.
- Modo difícil opcional no WordGuess, com obrigação de respeitar as pistas reveladas.
- Forca com palavras de 4 a 8 letras, seis vidas, teclado de letras e chute opcional da palavra inteira.
- Dicionário PT-BR curado, separado entre palavras-resposta e palavras aceitas como palpite.
- Regras acessíveis em modal, teclado virtual e teclado físico no WordGuess.
- Tema claro/escuro, preferência de daltonismo e movimento reduzido.
- Resultado com opção de copiar/compartilhar, sem cadastro ou telemetria.
- PWA com recursos do jogo disponíveis offline.
- Preferências e histórico anti-repetição locais no dispositivo.

### Fora do MVP

Contas, sincronização, estatísticas entre dispositivos, placar, palavra diária comum, multiplayer, Dueto/Quarteto, monetização, dicas, idiomas além de PT-BR e comprimentos variáveis no WordGuess.

### Premissas técnicas

O workspace ainda não contém aplicação ou framework. A recomendação é iniciar uma aplicação estática com **TypeScript e Vite**, sem framework de UI. O mockup já é uma SPA pequena baseada em HTML/CSS/JavaScript; manter essa forma reduz dependências, facilita o carregamento inicial e permite preservar o comportamento existente. Se a equipe já tiver decidido usar um framework antes da implementação, a separação entre domínio e interface descrita adiante continua aplicável.

## 3. Experiência e navegação

### Telas

1. **Início:** marca, frase de contexto, informações “Grátis / Sem conta / Partidas de 3–8 min”, dica de primeira visita, cartões de modo e princípios do produto.
2. **WordGuess:** instruções, indicador de tentativa, tabuleiro 6×5, mensagens acessíveis, legenda de cores, teclado e resultado pós-partida.
3. **Forca:** contador visual e textual de vidas, palavra com lacunas, metadados de comprimento, teclado, ação de chutar palavra e resultado.
4. **Como jogar:** diálogo modal com regras dos dois modos, exemplos visuais, dica de início e botão de fechamento.

### Transições

- A home abre um modo por meio do botão do respectivo cartão.
- “Início” e a marca retornam à home sem descartar o estado em andamento.
- “Jogar de novo” inicia uma nova rodada do mesmo modo e evita a repetição recente.
- A conclusão da partida troca a área de controles pelo resultado, anuncia o desfecho e move o foco para o título do resultado.
- O modal pode ser aberto no cabeçalho ou na tela de jogo. `Escape`, clique no backdrop e botão de fechar encerram o diálogo; o foco retorna ao acionador.
- Rotas sem recarregamento: `#home`, `#wordguess` e `#forca`. Mudanças de hash precisam ser sincronizadas com as telas, inclusive navegação voltar/avançar.

A tela de jogo não deve reiniciar apenas porque o jogador voltou à home e entrou novamente. Cada modo conserva sua partida em memória até reinício explícito ou recarga; persistência de partida após recarga não é requisito do MVP.

## 4. Arquitetura proposta

Separar regras do jogo, dados, persistência e apresentação. A lógica de domínio não deve ler o DOM, acessar `localStorage` nem depender de APIs do navegador. Isso permite testar regras com testes unitários e manter a interface fiel ao mockup.

```text
src/
  app/
    main.ts                 # ponto de entrada, inicialização e rotas
    navigation.ts           # telas, hash e foco de navegação
  domain/
    wordguess.ts            # estado e regras do WordGuess
    hangman.ts              # estado e regras da Forca
    words.ts                # escolha e validação no dicionário
    normalize.ts            # normalização PT-BR e contagem de letras
    share.ts                # serialização de resultados
  data/
    answers-wordguess.json  # respostas de 5 letras
    answers-hangman.json   # respostas de 4 a 8 letras
    valid-guesses.json     # vocabulário aceito para palpites
  ui/
    home.ts
    wordguess-view.ts
    hangman-view.ts
    help-dialog.ts
    preferences.ts
    sharing.ts
    announcements.ts
  styles/
    tokens.css
    base.css
    layout.css
    game.css
    responsive.css
  tests/
    wordguess.test.ts
    hangman.test.ts
    normalize.test.ts
    words.test.ts
public/
  manifest.webmanifest
  icons/
  offline.html             # opcional, caso uma navegação falhe offline
```

`src/domain` recebe entradas explícitas e retorna novo estado ou resultado da ação. Os módulos `ui` renderizam o estado, ligam eventos e enviam ações ao domínio. Evitar estado de jogo distribuído por atributos HTML: cada modo deve ter uma única estrutura tipada como fonte de verdade.

### Tecnologias

- TypeScript em modo estrito e Vite para desenvolvimento/build.
- HTML semântico e CSS próprio, com tokens correspondentes ao Design 01.
- Vitest para testes unitários do domínio e das funções de dados.
- Playwright para fluxos críticos em navegadores desktop/mobile e verificação de PWA.
- Service worker via API nativa ou plugin Vite PWA, escolhendo uma única estratégia de geração e atualização.
- Sem biblioteca de componentes ou runtime adicional no MVP.

## 5. Modelo de estado

### WordGuess

```ts
type TileState = 'correct' | 'present' | 'absent';
type Guess = { word: string; states: TileState[] };
type WordGuessState = {
  answer: string;
  current: string;
  guesses: Guess[];
  keyStates: Record<string, TileState>;
  status: 'playing' | 'won' | 'lost';
};
```

Ações: `addLetter`, `removeLetter`, `submitGuess`, `startNewRound`. A camada de domínio rejeita ações após o fim da partida. O envio valida, nesta ordem: partida ativa, exatamente cinco letras, palavra presente no conjunto de validação. Um palpite inválido não consome tentativa; a mensagem é anunciada em região `aria-live`.

### Forca

```ts
type HangmanState = {
  answer: string;
  guessedLetters: string[];
  wrongGuesses: number;
  status: 'playing' | 'won' | 'lost';
};
```

Ações: `guessLetter`, `guessWord`, `startNewRound`. Letras já tentadas não custam vida. Uma letra correta revela todas as ocorrências. Uma letra incorreta custa uma vida. Chute de palavra inteira correto vence; incorreto custa uma vida, não encerra a rodada imediatamente. Ao atingir seis erros, derrota e revelação da palavra.

## 6. Regras do domínio

### WordGuess

- Resposta fixa com cinco letras e seis tentativas.
- Todas as letras certas são avaliadas antes das letras presentes. As ocorrências certas são removidas da contagem; letras amarelas consomem apenas ocorrências restantes. Isso evita feedback excedente em palavras com letras repetidas.
- Estado de tecla mantém o melhor resultado conhecido: `correct` > `present` > `absent`.
- No modo difícil opcional, toda letra verde permanece na posição revelada e letras amarelas precisam ser reutilizadas em posições diferentes.
- A grade mantém as tentativas submetidas e a tentativa corrente. A interface não escreve diretamente nos tiles como estado independente.

### Forca

- Palavra-resposta de 4 a 8 letras, sem espaços no MVP.
- O indicador de vidas é o elemento visual do Design 01: seis corações; o contador textual continua sempre visível e é a alternativa não cromática.
- Letras repetidas revelam todas as posições correspondentes.
- Chute de palavra inteira disponível por campo e botão com rótulo explícito; erro custa uma vida. O campo só aceita uma palavra do comprimento da resposta e ignora espaços externos.
- Uma rodada termina ao revelar todas as letras ou ao perder seis vidas.

### Normalização e acentuação

Adotar a recomendação do PRD: acentos não criam uma letra diferente para a comparação do jogo. Normalizar em Unicode NFC, converter para maiúsculas e produzir uma forma de comparação sem diacríticos (`Á`→`A`, `Ç`→`C`). Contar **letras percebidas** (clusters de grafema), nunca bytes UTF-8. A interface pode mostrar a grafia original curada quando revela a resposta; palpites digitados seguem o teclado A–Z. Aplicar exatamente a mesma função ao carregamento do dicionário, à entrada e à comparação. Rejeitar caracteres que não resultem em A–Z após normalização.

### Escolha de palavras

Manter conjuntos distintos: respostas comuns e seguras para exibição, e vocabulário mais amplo aceito como palpite. Normalizar e validar os arquivos no build: sem entradas vazias, duplicadas após normalização, fora do tamanho, com nomes próprios marcados ou termos excluídos. Selecionar a resposta usando fonte aleatória do navegador; não há adversário ou prêmio que exija aleatoriedade criptográfica.

Guardar por modo até 50 respostas recentes no armazenamento local. Na escolha, filtrar essas respostas; se o conjunto disponível ficar vazio, limpar o histórico daquele modo e sortear novamente. Ao iniciar uma nova rodada, adicionar a resposta anterior ao histórico. O histórico reduz repetições, mas não garante impossibilidade matemática quando a lista for pequena.

## 7. Interface visual e responsividade

### Direção visual a preservar

- Fundo de papel claro `#f6f4ee`, superfícies quentes `#fffcf7`, tinta quase preta `#1e1c18` e acento terracota `#9a3b26` no tema claro.
- Tema escuro com fundo `#141512`, superfícies grafite-esverdeadas, texto claro e acento terracota claro.
- Fonte de interface sans-serif do sistema como no protótipo; sem dependência de fonte remota.
- Contêiner central de até 1120 px, cabeçalho aderente, borda fina, botões arredondados e cartões de modo com raio amplo do mockup.
- Grade de WordGuess com tiles quadrados e estados corretos/presentes/ausentes; teclado inspirado em QWERTY; Forca com corações, palavra sublinhada e estado de vitória/erro.
- Movimento curto para entrada de tela, avaliação das letras e feedback inválido, sempre respeitando `prefers-reduced-motion`.

Extrair cores, raios, sombras e dimensões para propriedades CSS. O tema é aplicado no elemento raiz via `data-theme="light|dark"`; os componentes consomem tokens, sem cores literais espalhadas. O modo daltonismo usa atributo separado, por exemplo `data-colorblind="true"`, alterando paleta e acrescentando marcas/símbolos aos estados; cor nunca deve ser o único canal de informação.

### Layout adaptável

- Mobile primeiro, largura mínima de conteúdo compatível com aparelhos estreitos; tabuleiro e teclado permanecem dentro da viewport sem rolagem horizontal.
- Em telas largas, home pode exibir os dois cartões lado a lado e jogo organiza tabuleiro e controles em colunas.
- Em telas estreitas, empilhar as colunas; manter status e vidas antes do tabuleiro e os controles próximos à área de interação.
- Ações principais com pelo menos 44×44 CSS px; as teclas alfabéticas do teclado compacto mantêm altura mínima de 44 px, largura mínima de 24 px e espaçamento entre alvos.
- Ao abrir resultado ou modal, rolar apenas o necessário e não ocultar conteúdo atrás do cabeçalho fixo.

## 8. Acessibilidade

Meta: WCAG 2.1 AA nos fluxos principais.

- Usar `header`, `nav`, `main`, `section`, headings em ordem e botões nativos.
- Link “Pular para o conteúdo”, foco visível e foco programático em títulos ao mudar de tela.
- Modal com `role="dialog"`, `aria-modal="true"`, nome/descrição acessíveis, contenção do foco, fechamento por `Escape`, bloqueio do conteúdo de fundo e restauração do foco.
- Mensagens e resultados com regiões `aria-live="polite"`; erros imediatos podem usar assertividade apropriada sem anunciar cada tecla digitada.
- Tabuleiro com rótulos por tentativa/posição e estado; teclado com nomes acessíveis e estado textual (“lugar certo”, “em outra posição”, “não aparece”).
- Forca anuncia vidas restantes e resumo da palavra revelada/oculta; corações decorativos são ignorados pelo leitor de tela.
- Preferência de daltonismo altera cores e adiciona forma, padrão ou símbolo para correto/presente/ausente; estado continua com rótulo acessível.
- Suportar zoom/reflow, contraste de texto e controles; honrar movimento reduzido.
- Não capturar teclas quando o foco estiver em campos, controles do navegador, modal ou atalhos com Ctrl/Command/Alt.

## 9. Preferências, persistência e privacidade

Persistir somente preferências e anti-repetição, sem identificadores:

```text
deduzi:preferences:v1  -> { theme, colorblind, welcomeDismissed }
deduzi:recent:v1       -> { wordguess: string[], forca: string[] }
```

Ler e validar JSON em `try/catch`; valores inválidos voltam aos padrões. Se `localStorage` falhar, o jogo continua normalmente em memória. Aplicar o tema antes da primeira pintura, como no protótipo, para evitar flash visual. Tema padrão respeita `prefers-color-scheme`; escolha explícita do usuário prevalece. A preferência de daltonismo e a dispensa da dica também persistem.

Não usar cookies, analytics, telemetria ou coleta de dados pessoais no MVP. O botão de compartilhamento só envia texto após ação explícita do jogador. O conteúdo compartilhado não deve incluir dados pessoais.

## 10. Compartilhamento

Gerar texto determinístico a partir do estado final, e não a partir do DOM. Tentar `navigator.share` quando disponível e apropriado; oferecer copiar para área de transferência como fallback. A API Clipboard requer contexto seguro, portanto incluir fallback visível com texto selecionável se a cópia automática falhar. Anunciar sucesso/falha em toast acessível.

- **WordGuess:** identificação “Deduzi · WordGuess”, placar `n/6` ou `X/6` e uma linha de emojis por tentativa (verde, amarelo, cinza), sem revelar a resposta.
- **Forca:** identificação do modo, vitória/derrota, sequência de acertos/erros e vidas restantes. O protótipo inclui a palavra no texto compartilhado; para evitar spoiler, a implementação recomendada omite a resposta do compartilhamento e mantém a palavra somente no resultado privado da tela. Se fidelidade literal ao mockup for prioritária, essa decisão precisa ser revertida conscientemente.

Não apresentar o botão antes do fim da rodada. Proteger contra clique duplo e manter o rótulo do botão após a tentativa de compartilhamento conforme o estado.

## 11. PWA e comportamento offline

- `manifest.webmanifest` com nome, nome curto, cores do tema e ícones instaláveis.
- HTTPS em produção; service worker registrado apenas em build de produção.
- Pré-cache da shell (HTML, CSS, JavaScript, fontes locais/ícones e arquivos JSON do dicionário).
- Estratégia cache-first para shell e dicionário versionados; atualização oferece nova versão sem apagar preferências/histórico.
- O jogo inteiro, incluindo seleção de resposta e validação, funciona sem rede após o primeiro carregamento bem-sucedido.
- Exibir estado de atualização sem interromper partida em andamento. Não depender de API remota para sortear palavras.
- Conferir limites de bundle do PRD: inicial abaixo de 200 KB gzip e FCP abaixo de 1,5 s em cenário 4G de referência.

## 12. Testes e critérios de aceite

### Testes unitários

- Normalização: maiúsculas, acentos, cedilha, Unicode composto/decomposto e contagem de grafemas.
- WordGuess: verde/amarelo/cinza, letras repetidas no palpite e na resposta, vitória, derrota, limite de seis tentativas, palpite curto/longo/inválido e prioridade de estado no teclado.
- Forca: letra duplicada, repetição de palpite sem perda de vida, seis erros, vitória por revelação completa e chute inteiro certo/incorreto.
- Dicionário: validação dos tamanhos, normalização e rejeição de entradas inválidas; seleção exclui histórico recente e recupera corretamente quando esgota opções.
- Persistência: JSON corrompido, armazenamento indisponível, preferência salva e lista recente por modo.
- Compartilhamento: conteúdo por modo, vitória/derrota, APIs indisponíveis e fallback de cópia.

### Testes de interface e aceitação

- Escolher cada modo, jogar, terminar, compartilhar, reiniciar e voltar à home.
- Navegar integralmente por teclado; testar modal e foco com leitor de tela.
- Confirmar mensagens de tentativa inválida e anúncio da mudança de estado sem excesso de anúncios.
- Alternar claro/escuro e daltonismo; recarregar e confirmar persistência sem flash de tema.
- Verificar dimensões mobile estreitas, tablet e desktop, sem sobreposição ou rolagem horizontal.
- Instalar PWA e jogar offline após o primeiro carregamento.
- Testar Chrome, Firefox, Edge e Safari/iOS nas versões-alvo do PRD.
- Fazer auditoria automatizada de acessibilidade como apoio, complementada por teste manual.

### Critérios de aceite do MVP

- Nenhuma tentativa inválida consome jogada/vida, exceto chute inteiro errado na Forca, que custa exatamente uma vida.
- O feedback do WordGuess é correto para toda combinação de letras repetidas.
- O histórico impede repetição imediata e respeita a janela configurada de até 50 respostas.
- Preferências são preservadas localmente e o jogo permanece utilizável se o armazenamento estiver bloqueado.
- Teclado virtual funciona em telas touch; teclado físico funciona no WordGuess sem interferir em campos e navegação.
- Cada tela possui estado vazio/inicial, em andamento, erro de entrada e resultado.
- O jogo é operável offline após instalação/carregamento inicial, sem requisição obrigatória a serviços externos.

## 13. Sequência de implementação

### F0 — Base executável

1. Inicializar Vite, TypeScript, testes e estrutura de pastas.
2. Separar as regras do protótipo do DOM e cobrir os algoritmos com testes.
3. Definir e validar os arquivos de dicionário; documentar origem, licença e processo de curadoria.

### F0 — Fluxos do jogo

4. Implementar navegação/home, WordGuess, Forca e modal de instruções.
5. Reproduzir primeiro o tema claro do Design 01 e a responsividade; depois adicionar tema escuro.
6. Conectar teclado virtual/físico, foco, mensagens e resultados.

### F1 — Requisitos do MVP

7. Adicionar modo daltonismo, persistência segura, histórico anti-repetição e compartilhamento.
8. Configurar manifest, cache offline, atualização do service worker e instalação.
9. Executar testes de navegador, acessibilidade, performance e compatibilidade; corrigir antes de publicar.

## 14. Riscos e decisões abertas

- **Curadoria/licença do dicionário:** é necessário escolher uma fonte reutilizável e definir quem aprova inclusões/exclusões. Não incorporar listas sem licença compatível.
- **Acentuação:** esta proposta adota equivalência de diacríticos na comparação, conforme recomendação do PRD; confirmar que UI e vocabulário usarão a mesma regra.
- **Compartilhamento da Forca:** recomendação é omitir a resposta para evitar spoiler, divergindo do código atual do protótipo.
- **Vocabulário:** a lista incluída no protótipo é demonstrativa e não substitui a curadoria/licença dos conjuntos de aproximadamente 5 mil respostas e 15 mil palpites previstos no PRD.
- **Modo difícil:** aparece como opcional no escopo do PRD e como F2 no roadmap; esta implementação o oferece como controle opcional no WordGuess.
- **Chute de palavra na Forca:** exigido pelo PRD, mas ausente no protótipo. O controle deve ser adicionado sem alterar a hierarquia visual principal.
- **Histórico de sessão:** progresso atual não sobrevive à recarga. Persistir a rodada ativa pode ser considerado depois, mas amplia validação de estado e não é bloqueador do MVP.
- **Marca/nome:** “Deduzi” aparece no mockup; verificar disponibilidade de marca antes de lançamento público.

## 15. Referências do workspace

- `PRD.md` — escopo, requisitos, mecânicas, riscos e roadmap.
- `mockups/01-ux-clareza.html` — fonte visual e protótipo comportamental escolhido.
- `mockups/02-acessibilidade.html` — estudo de acessibilidade; consultar somente para complementar requisitos de acessibilidade do PRD, sem substituir o visual selecionado.
- `mockups/03-visual-identidade.html` — alternativa visual não selecionada.
