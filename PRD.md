# PRD — Jogo Casual de Adivinhação de Palavras

**Versão:** 0.1  
**Data:** 2026-10-15  
**Status:** Rascunho — aprovado para kickoff  
**Autor:** Equipe do projeto *cacaPalavras*

---

## 1. Resumo da Pesquisa (base de design)

Estudo comparativo dos jogos casuais de adivinhação de palavras mais bem-sucedidos:

| Jogo | Mecânica-chave | Lições aplicáveis |
|---|---|---|
| **Wordle** (Josh Wardle) | 6 tentativas, 5 letras, feedback por cores (verde/amarelo/cinza), 1 palavra por dia igual para todos, compartilhamento por emoji, modo "difícil", temas claro/escuro + alto contraste. | Formato clássico de feedback por posição; escassez/viralidade via compartilhamento; acessibilidade (colorblind). |
| **Termo** (BR, Fernando Serboncini) | Clone lusófono (PT-BR), ~18.000 palavras curadas (exclui palavrões, nomes próprios, termos obscuros), variantes **Dueto/Quarteto**, colorblind mode, **sem ads/IAP/notificações**, gratuito. | Curar dicionário PT-BR; base BR não serve automaticamente para pt-PT; valor de variantes simultâneas (futuro). |
| **Hangman (Forca)** | Adivinhação letra a letra com limite de erros; variantes por número de erros; palavras com letras raras são "difíceis"; controvérsia da imagem de enforcado. | Usar visual não-violento (vidas/corações/árvore); definir número de erros e tratamento de acentos. |
| **Lingo** | 5 letras com pista opcional; timer de segundos por tentativa; modos com pontuação; variações 2023 focadas em palavras. | Timer pode criar "modo rápido" opcional; pista opcional para rações futuras. |
| **Variantes virais** (Absurdle, Quordle, Squabble) | Múltiplas palavras simultâneas, adversário adaptativo, realtime. | Escopo fase 2+ (Dueto/Quarteto, multiplayer). |

**Princípios de design extraídos:**
- Sessão curta (3–10 min), sem barreiras de entrada.
- Feedback instantâneo e claro ("palavra inválida", cores estáveis).
- Compartilhamento por grade de emojis funciona mesmo em single-player e sem conta.
- Acessibilidade mínima: tema escuro, modo daltonismo (verde/amarelo → azul/laranja), foco visível, teclado.
- Monetização agressiva em jogos "minimalistas" gera backlash (Wordle/Termo são gratuitos).
- Replicar mecânica é permitido, mas nome/UI devem ser distintos para evitar issues de IP (NYT registrou "Wordle").

---

## 2. Visão e Objetivos

Entregar um **jogo casual web (PWA) gratuito**, em **português (BR)**, com **dois modos selecionáveis** (Wordle e Forca), jogável à vontade (sem limite diário), sem contas nem monetização no v1.

**Objetivo do MVP:** experiência jogável, leve, acessível e viralizável (compartilhamento por emoji), com identidade visual própria.

---

## 3. Público-alvo

- **Primário:** jogador casual (18–45) que busca entretenimento rápido no celular/desktop, sem cadastro nem compromisso.
- **Secundário:** quem prefere "tentativa e erro" (Forca) versus "dedução por posições" (Wordle).

---

## 4. Escopo

### 4.1 In (v1 / MVP)
- Dois modos no menu inicial: **WordGuess (Wordle)** e **Forca (Hangman)**.
- **WordGuess:** palavra fixa de 5 letras, 6 tentativas, feedback por cores (🟩/🟨/⬜), teclado virtual refletindo estado, validação de palavra, modo "difícil" opcional.
- **Forca:** palavra de comprimento variável (4–8), 6 erros permitidos, adivinhação de letras, revelação progressiva, possibilidade de chutar a palavra inteira.
- Lista curada PT-BR (~5–15k) sem palavrões, nomes próprios e termos muito obscuros.
- Compartilhamento de resultado (grade de emojis copiada para área de transferência + Web Share API).
- Temas claro/escuro e **modo daltonismo**.
- PWA com cache offline (app + dicionário).
- Sem repetição imediata de palavras (anti-repetição de N=50).
- Onboarding rápido ("Como jogar", 1 tela).

### 4.2 Out (v1 → fases futuras)
- Contas/login, estatísticas persistidas, streaks, leaderboards (F3).
- Palavra diária igual para todos / Dueto / Quarteto / multiplayer realtime (F2+).
- Monetização (ads/IAP/subscription) (F3+).
- Outros idiomas; i18n do UI (F2).
- Pistas/definições por palavra (F2).
- Comprimentos variáveis no WordGuess (F2).

---

## 5. Mecânicas de Jogo

### 5.1 Modo WordGuess (Wordle-style)
- Grade 5×6; tentativa validada contra o dicionário (palavra completa de 5 letras) antes de submeter.
- Feedback: 🟩 letra certa no lugar; 🟨 presente em outro lugar; ⬜ ausente (com tratamento de letras repetidas, conforme Wordle).
- Teclado on-screen exibindo estado por letra (cinza/amarelo/verde).
- Teclado físico (Enter/Backspace/letras) no desktop; input virtual no mobile.
- **Modo "difícil" opcional:** obriga a reutilizar todas as letras reveladas como 🟩/🟨 nas tentativas seguintes.
- Sem tempo limite por tentativa (casual).

### 5.2 Modo Forca (Hangman-style)
- Visual de vidas (6 corações ou figura não-violenta, configurável).
- Acentuação: tratar vogais acentuadas como variantes da vogal base (ex.: E/É), evitando ambiguidade. Alternativa: permitir apenas palavras sem diacríticos.
- Lista de letras já tentadas com estado.
- **"Chutar palavra inteira"** a qualquer momento; erro custa 1 vida (mantém tensão).
- Permitir palavras com espaços? **Não** no v1 (somente uma palavra por rodada).

### 5.3 Dicionário e Validação
- **Conjunto solução** (~5.000 termos muito comuns) — palavra que o jogador precisa descobrir.
- **Conjunto validação** (~15.000) — palavras aceitas como palpite.
- Exclusões: profanidade, ofensas, nomes próprios, siglas, regionalismos extremos.
- Geração aleatória sem repetir as últimas 50 palavras.

### 5.4 Compartilhamento (viralidade)
- Botão "Compartilhar resultado" gera texto (ex.: `WordGuess 4/6` + grade de emojis) e copia para a área de transferência, usando Web Share API quando disponível.

---

## 6. Experiência / Fluxo (UX)

1. **Home:** logo, botões "Modo WordGuess" e "Modo Forca", toggle de tema, link "Como jogar".
2. **Onboarding:** 1 tela explicando cores/vidas (primeira visita).
3. **Jogo:** instrução curta + grade + teclado + botões ("Compartilhar", "Nova palavra", "Menu").
4. **Pós-jogo:** mensagem (vitória/derrota), palavra revelada, botão compartilhar, "Jogar de novo".

---

## 7. Requisitos Não-Funcionais

- **Plataforma:** web responsiva (PWA) para mobile/desktop; critérios de instalação (manifest + service worker).
- **Performance:** FCP < 1.5s em 4G; bundle inicial < 200KB gzipped (sem assets pesados).
- **Acessibilidade:** WCAG 2.1 AA básico; aria-labels no teclado; **modo daltonismo** (verde/amarelo → azul/laranja); foco visível; navegação por teclado.
- **Offline:** service worker cacheia app + dicionário; jogo offline parcial (sem busca de novas palavras).
- **Privacidade:** nenhum dado pessoal coletado; nenhum login; **sem analytics no v1**.
- **Compatibilidade:** Chrome/Safari/Firefox/Edge últimas 2 versões; iOS Safari.
- **I18n:** UI em PT-BR no MVP; dicionário PT-BR.

---

## 8. Monetização (v1)

- Totalmente gratuito, sem ads, IAP ou paywall.
- **Futuro (Fase 3+):** ads rewarded opcionais (ex.: dica), estatísticas premium, assinatura para modos avançados — **sem degradar o modo gratuito**.

---

## 9. Métricas de Sucesso (v1)

- Taxa de compartilhamento > 15% das partidas vencidas.
- Tempo médio de sessão 3–8 min.
- Retenção D1/D7 > 25% / > 10% (orgânico).
- Taxa de vitória no WordGuess ~60–75%.

---

## 10. Riscos

- Dicionário curado pode ser percebido como "limitado" → mitigação: coletar feedback e expandir lista gradualmente.
- Jogo livre ilimitado pode reduzir novidade (mitigação: anti-repetição de palavras).
- Sem contas: perda de progresso ao limpar cache → mitigação: export/import local (JSON) como feature barata.
- Percepção de "clone de Wordle" → mitigação: UX original, nome/identidade visual próprios, e modos Forca/híbrido.

---

## 11. Itens em Aberto (decisões pendentes)

1. **Nome do jogo** (evitar conflito de marca com "Wordle"/"Termo") — *pendente*.
2. **Visual da Forca:** boneco estilizado não-violento (figura em construção) **vs.** "vidas/corações" **vs.** "maçãs na árvore". *Recomendação: vidas/corações (mais inclusivo e simples).*
3. **Acentuação no tabuleiro:** tratar acentos como variantes (recomendado) **vs.** apenas palavras sem diacríticos.
4. **"Chutar palavra inteira" na Forca:** custa 1 vida (recomendado) **vs.** encerra a partida.
5. **Analytics anônimos:** opt-in **vs.** sem analytics no v1 (recomendado: sem analytics no v1).
6. **Export/import de progresso local:** P1 ou P2 — *recomendação P2*.
7. **Comprimentos alternativos de palavra** no WordGuess (4/6/7): — *v1 fixa 5; demais em F2*.

---

## 12. Roadmap Sugerido

- **F0 (1–2 semanas):** protótipo jogável WordGuess + Forca, com listas, validação e UI básica.
- **F1 (MVP):** temas dark/colorblind, compartilhamento, PWA/offline, polimento.
- **F2:** estatísticas locais, export/import, modo "difícil", comprimento variável no WordGuess, i18n UI.
- **F3:** desafios Dueto/Quarteto, contas opcionais, monetização leve.

---

## 13. Aprovação

- [ ] Aprovado — kickoff F0
- [ ] Ajustes solicitados: ____________________

---

*Documento gerado a partir da pesquisa de mercado e do questionário de requisitos do projeto cacaPalavras.*
