# SPECS — Deduzi

**Produto:** jogo casual de palavras em português brasileiro  
**Design selecionado:** Design 01 — foco em UX e clareza (`mockups/01-ux-clareza.html`)  
**Base funcional:** `PRD.md` e implementação em `src/`  
**Estado:** especificação do MVP e registro das lacunas atuais  
**Data:** 2026-10-22

## 1. Objetivo do produto

Implementar um jogo web responsivo, gratuito e sem cadastro, com partidas sem limite de tempo e dois modos: WordGuess, de dedução por posição, e Forca, de adivinhação de letras. A interface deve tornar cada regra, pista e estado visível sem exigir que o jogador conheça jogos semelhantes.

A aplicação final usa exclusivamente a direção visual do Design 01: identidade Deduzi, fundo de papel e terracota, cartões de escolha de modo, telas de jogo focadas, corações para as vidas da Forca e instruções em diálogo. O hub em `mockups/index.html` serve apenas para comparar os protótipos; não é uma tela do jogo. Os Designs 02 e 03 não são referências visuais de implementação.

## 2. Escopo

### Incluído no MVP

- Home com entrada direta para WordGuess ou Forca e ação “Como jogar”.
- WordGuess com resposta de cinco letras, até seis tentativas e estado de teclado acumulativo.
- Validação do palpite em lista PT-BR; palpite inválido não consome tentativa.
- Modo difícil opcional: letras verdes permanecem na posição e letras amarelas precisam ser reutilizadas em outra posição.
- Forca com resposta de quatro a oito letras, seis vidas, teclado de letras e chute da palavra inteira.
- Letra correta revela todas as ocorrências; letra repetida não custa vida novamente; chute inteiro errado custa uma vida.
- Mensagem de vitória/derrota, palavra revelada, reinício e retorno à home.
- Tema claro/escuro e modo para daltonismo.
- Compartilhamento explícito via Web Share, cópia ou texto selecionável de fallback.
- Preferências e até 50 palavras recentes por modo persistidas localmente.
- PWA com manifest e cache inicial dos recursos da aplicação.

### Fora do MVP

Conta, sincronização, métricas pessoais, streaks, placares, palavra diária comum, multiplayer, Dueto/Quarteto, monetização, novos idiomas, pistas/definições e tamanhos alternativos do WordGuess.

## 3. Fluxos de UX

### Início

1. Apresentar a marca e uma frase curta que explica os dois estilos de jogo.
2. Mostrar atributos do produto: gratuito, sem conta e sem cronômetro.
3. Apresentar a dica de primeira visita, dispensável e persistida.
4. Oferecer cartões separados com nome, descrição, exemplo visual e chamada de ação para WordGuess e Forca.
5. Disponibilizar no cabeçalho ajuda, tema e preferência de daltonismo.

### WordGuess

- Mostrar instrução de cinco letras e seis tentativas, grade 6×5, progresso, legenda de estados e teclado QWERTY virtual.
- Aceitar letras do teclado virtual ou físico; Enter envia e Backspace remove uma letra no teclado físico.
- Uma tentativa incompleta ou fora do dicionário mostra erro no contexto e não altera o número de tentativas.
- Ao fim, ocultar teclado, revelar resposta, exibir resultado e compartilhar/reiniciar.

### Forca

- Mostrar vidas como seis corações e também como contador textual; exibir o comprimento da palavra.
- Aceitar letras pelo teclado virtual e pelo teclado físico quando o foco não estiver em um controle.
- Oferecer campo com botão para chutar a palavra inteira. Exigir o mesmo número de letras da resposta; erro custa uma vida.
- Ao vencer ou perder, exibir resposta e resultado, ocultar controles e oferecer compartilhar/reiniciar.

### Ajuda e navegação

- O diálogo de instruções explica os dois modos com exemplos e dicas breves.
- `Escape`, botão de fechar e clique no backdrop fecham o diálogo. O foco deve retornar ao controle que o abriu.
- A navegação interna usa `#home`, `#wordguess` e `#forca`; voltar/avançar do navegador deve manter a tela sincronizada.
- Retornar à home preserva em memória a partida existente. “Jogar de novo” substitui a rodada e escolhe nova resposta.

## 4. Regras de domínio

### WordGuess

Estado: resposta normalizada, entrada atual, palpites submetidos (palavra e estado por posição), melhor estado conhecido de cada tecla e status (`playing`, `won`, `lost`).

Para avaliar um palpite:

1. Marcar primeiro cada letra na posição exata como `correct`.
2. Contabilizar, para as demais posições, as ocorrências ainda disponíveis na resposta.
3. Percorrer as letras restantes do palpite e marcar `present` somente enquanto houver ocorrência disponível; as demais ficam `absent`.
4. Atualizar o teclado sem rebaixar estado: `correct` > `present` > `absent`.
5. Vencer se o palpite normalizado for igual à resposta; perder depois da sexta tentativa não vencedora.

No modo difícil, uma tentativa só é aceita se mantiver todas as letras corretas em suas posições, reutilizar as letras presentes e não usar letra amarela na posição já rejeitada. Uma falha nessa regra não consome tentativa.

### Forca

Estado: resposta normalizada, letras tentadas únicas, erros acumulados e status. Uma letra válida já tentada é ignorada sem penalidade. Acerto revela todas as ocorrências. Erro incrementa o contador; seis erros encerram a partida. Chute inteiro correto revela todas as letras e vence; chute incorreto incrementa um erro.

### Normalização e acentos

`normalizeWord` decompõe Unicode, remove diacríticos e converte para maiúsculas em `pt-BR`. Assim, `Á` e `A` são equivalentes para comparação. Entradas de teclado devem resultar em A–Z depois da normalização. O conjunto de respostas deve seguir a mesma regra e registrar palavras sem diacríticos, para que a forma revelada e o tamanho sejam coerentes.

## 5. Dados e seleção de palavras

Manter coleções distintas:

- **Respostas WordGuess:** palavras comuns, válidas e apropriadas de cinco letras.
- **Palpites aceitos:** vocabulário mais amplo, restrito a cinco letras após normalização.
- **Respostas Forca:** palavras de quatro a oito letras, sem espaços.

A seleção usa palavras recentes específicas por modo. Excluir até as últimas 50 respostas da rodada seguinte; se o conjunto elegível acabar, permitir fallback para o conjunto completo. A fonte aleatória pode ser `Math.random`, pois não há prêmio nem segurança baseada em imprevisibilidade.

**Estado do conteúdo:** as listas em `src/domain/words.ts` são pequenas listas demonstrativas. Não atendem aos volumes de aproximadamente 5 mil respostas e 15 mil palpites propostos no PRD e ainda não têm origem, licença ou processo formal de curadoria registrados. Não publicar o MVP como vocabulário final antes de resolver essa pendência.

## 6. Arquitetura e estrutura de código

A arquitetura é uma aplicação estática em TypeScript, Vite, HTML semântico e CSS próprio, sem framework de UI. As regras do domínio não dependem do DOM nem das APIs do navegador.

```text
index.html                   # shell de produção esperada; ver lacuna atual abaixo
src/
  main.ts                    # inicialização, telas, eventos, renderização e persistência
  styles.css                 # tokens, componentes, estados e responsividade
  vite-env.d.ts              # tipos do Vite/PWA
  domain/
    game.ts                  # estado e regras puras de WordGuess e Forca
    words.ts                 # normalização, dados e escolha de respostas
    game.test.ts             # testes unitários do domínio
public/
  favicon.svg
vite.config.ts               # build Vite, manifest e service worker
package.json                 # scripts e dependências
```

`main.ts` conecta eventos e estado às telas. `game.ts` contém funções puras como `scoreGuess`, `submitWordGuess`, `guessHangmanLetter` e `guessHangmanWord`. `words.ts` normaliza entradas e seleciona resposta evitando palavras recentes. A interface renderiza a partir do estado; não usar atributos HTML como segunda fonte de verdade do jogo.

### Inicialização e comandos

- `npm install`: instalar as dependências declaradas.
- `npm run dev`: iniciar o servidor Vite.
- `npm test`: executar Vitest.
- `npm run build`: executar verificação TypeScript e build de produção.
- `npm run preview`: servir localmente o build de produção.

O ponto de entrada Vite é `index.html` na raiz. **No estado observado em 2026-10-22, esse arquivo não existe**, então o build não consegue resolver `index.html` até a shell da aplicação ser restaurada. O conteúdo compilado anteriormente estava em `dist/`, mas é artefato gerado e não deve ser usado como fonte de manutenção.

## 7. Contrato de interface

A shell HTML deve fornecer os alvos usados pela aplicação: `#screen-home`, `#screen-wordguess`, `#screen-forca`, `#wg-board`, `#wg-keyboard`, `#forca-keyboard`, `#forca-word`, `#forca-lives`, `#help-modal`, `#toast`, resultados de cada modo e controles de preferência. IDs e seletores são contrato interno entre `index.html` e `src/main.ts`; alterações devem ser sincronizadas e verificadas pelo build.

Regras de apresentação:

- Usar headings semânticos, botões para ações e links apenas para navegação real.
- Manter foco visível, link “Pular para o conteúdo” e foco nos títulos de tela/resultado após transições.
- Anunciar instruções, erros e resultados por regiões `aria-live`; não anunciar repetidamente a cada tecla digitada.
- Modal com `role="dialog"`, `aria-modal="true"`, nome/descrição acessíveis, contenção de foco e bloqueio do conteúdo de fundo.
- Mostrar estado do tabuleiro por texto acessível, além da cor.
- Usar marca visual não cromática no modo para daltonismo para correto, presente e ausente/errado.
- Respeitar `prefers-reduced-motion`; não depender de animação para comunicar uma regra.
- Manter alvos principais de pelo menos 44×44 CSS px. Em teclado compacto, preservar largura, altura e espaçamento que permitam selecionar letras sem overflow em telas estreitas.

## 8. Sistema visual — Design 01

- **Tema claro:** fundo `#f6f4ee`, superfície `#fffcf7`, texto `#1e1c18`, texto secundário `#625e55`, linha `#ddd7cb` e acento terracota `#9a3b26`.
- **Tema escuro:** fundo `#141512`, superfície `#1c1d19`, texto claro e acento terracota claro, definidos por tokens CSS.
- **Tipografia:** pilha sans-serif de sistema, sem fontes remotas.
- **Estrutura:** largura central máxima aproximada de 1120 px, cabeçalho compacto, home editorial e cartões de modo; em desktop, jogo pode usar colunas; em mobile, empilhar conteúdo.
- **WordGuess:** tiles quadrados, paleta de correto/presente/ausente, legenda permanente e teclado QWERTY.
- **Forca:** vidas em corações, palavra sublinhada, rótulo de comprimento e teclado visual.
- **Movimento:** transições curtas para entrada/feedback e animação de erro; reduzir ou desativar movimento quando solicitado pelo sistema.

As cores de daltonismo são uma preferência sobre os estados do jogo, não uma direção visual alternativa. Não importar identidade, paleta ou composição dos Designs 02/03.

## 9. Preferências e privacidade

Chaves locais implementadas:

```text
deduzi:preferences:v1 -> { theme, colorblind, welcomeDismissed, hardMode }
deduzi:recent:v1      -> { wordguess: string[], forca: string[] }
```

Todas as leituras/escritas em `localStorage` devem tolerar JSON inválido, armazenamento indisponível e modo privado. Se a persistência falhar, a rodada continua em memória. Aplicar o tema salvo antes da primeira pintura para evitar flash de tema. Sem conta, cookies de rastreamento, analytics ou transmissão de dados de jogo sem ação explícita do jogador.

## 10. Compartilhamento

Gerar texto diretamente do estado final:

- **WordGuess:** nome do jogo, placar `n/6` ou `X/6` e linhas de emojis correspondentes aos estados das tentativas, sem incluir a resposta.
- **Forca:** vitória/fim de jogo, vidas restantes e marcas de acertos/erros, sem incluir a resposta para evitar spoiler.

Fluxo: tentar `navigator.share`; se não disponível, tentar `navigator.clipboard.writeText` em contexto seguro; em falha, exibir uma área de texto selecionável. Informar sucesso, cancelamento ou fallback por mensagem acessível.

## 11. PWA e offline

O `vite-plugin-pwa` gera manifest e service worker no build. A estratégia de precache inclui HTML, CSS, JavaScript, SVG, JSON e manifest; o vocabulário atual está importado pelo módulo TypeScript e faz parte do JavaScript compilado. A configuração usa atualização em modo prompt para não recarregar automaticamente uma partida ativa.

Critérios de produção:

- Registrar worker somente na aplicação servida por HTTPS ou localhost.
- Validar instalação em dispositivos compatíveis e atualização da aplicação.
- Confirmar que o jogo, a seleção local de palavras e as listas funcionam após primeiro carregamento offline.
- Ter ícones instaláveis com tamanhos compatíveis com os ambientes alvo; no momento, o manifest usa o SVG `public/favicon.svg`, e a instalação precisa ser verificada.
- Não apagar preferências/histórico ao atualizar cache.

## 12. Testes e critérios de aceite

### Testes unitários

Cobrir normalização de acentos, pontuação com letras repetidas, validação de tamanho/dicionário, modo difícil, vitória/derrota, repetição de letra na Forca, vidas, chute inteiro certo/incorreto e seleção anti-repetição. A suíte atual em `src/domain/game.test.ts` cobre as regras principais do domínio.

### Testes de integração/manual

1. Abrir home e navegar para cada modo, retornar à home e confirmar que a rodada permanece ativa.
2. Concluir vitória e derrota nos dois modos; reiniciar e confirmar limpeza de estado e teclado.
3. Testar teclado físico, teclado virtual, validação, modo difícil, modal e foco.
4. Alternar tema e modo para daltonismo, recarregar e verificar persistência.
5. Testar compartilhamento em contexto com e sem Web Share/Clipboard.
6. Verificar mobile estreito, tablet e desktop, sem rolagem horizontal nem sobreposição.
7. Instalar a PWA e jogar offline depois do primeiro carregamento.
8. Cobrir Chrome, Firefox, Edge, Safari e Safari no iOS nas versões estabelecidas pelo PRD.

### Critérios de aceite

- Nenhum palpite inválido consome tentativa; cada chute incorreto de palavra na Forca custa exatamente uma vida.
- A avaliação de letras repetidas é consistente entre grade, teclado e texto compartilhado.
- Vitória por chute inteiro revela a resposta na tela e no estado final.
- Reiniciar limpa letras, estados visuais e rótulos acessíveis da partida anterior.
- Tema, daltonismo, modo difícil e dispensa do onboarding são restaurados corretamente quando o armazenamento está disponível.
- A aplicação continua jogável sem rede após primeiro carregamento, sem serviços remotos obrigatórios.
- A shell raiz existe, o build passa e as rotas de navegação têm fallback definido antes de publicar.

## 13. Situação atual e lacunas

- **Implementado no código:** mecânicas principais dos dois modos, normalização sem diacríticos, modo difícil, teclados, preferências, compartilhamento, dialog de ajuda, regras anti-repetição, CSS responsivo e configuração PWA.
- **Testes recentes:** 10 testes de domínio passaram na última execução registrada.
- **Build:** o build havia passado antes da limpeza, mas a saída `dist/` foi removida por ser gerada. No estado atual, o build depende da restauração do `index.html` da raiz.
- **Dicionário:** dados de exemplo muito menores que o volume e a curadoria do PRD; origem/licença ainda devem ser definidos.
- **Validação de navegador:** não há evidência de automação Playwright completa no ambiente por falta de Chromium instalado.
- **Instalação PWA e offline real:** configuração presente, validação em dispositivo/navegador ainda necessária.
- **Progresso em andamento:** as preferências e palavras recentes persistem; o tabuleiro atual não é restaurado após recarregar a página.

## 14. Referências

- `PRD.md` — requisitos do produto, regras e roadmap.
- `PROJETO_TECNICO.md` — proposta técnica anterior.
- `mockups/01-ux-clareza.html` — fonte visual e referência de fluxo selecionada.
- `mockups/index.html` — galeria independente para navegar entre protótipos, fora da aplicação principal.
- `src/main.ts`, `src/domain/game.ts`, `src/domain/words.ts`, `src/domain/game.test.ts` e `src/styles.css` — implementação atual.
