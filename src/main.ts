import './styles.css';
import {
  createHangman,
  createWordGuess,
  guessHangmanLetter,
  guessHangmanWord,
  submitWordGuess,
  type HangmanState,
  type WordGuessState
} from './domain/game';
import { chooseWord, FORCA_ANSWERS, normalizeWord, VALID_GUESSES, WORDGUESS_ANSWERS } from './domain/words';

type ScreenName = 'home' | 'wordguess' | 'forca';
type Preferences = { theme: 'light' | 'dark'; colorblind: boolean; welcomeDismissed: boolean; hardMode: boolean };
type RecentWords = { wordguess: string[]; forca: string[] };

const $ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
  return element;
};
const $$ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

const storage = {
  read<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      return value ? { ...fallback, ...JSON.parse(value) } : fallback;
    } catch {
      return fallback;
    }
  },
  write(key: string, value: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* O jogo segue em memória. */ }
  }
};

const preferenceDefaults: Preferences = {
  theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  colorblind: document.documentElement.dataset.colorblind === 'true',
  welcomeDismissed: false,
  hardMode: false
};
let preferences = storage.read<Preferences>('deduzi:preferences:v1', preferenceDefaults);
let recentWords = storage.read<RecentWords>('deduzi:recent:v1', { wordguess: [], forca: [] });
let activeScreen: ScreenName = 'home';
let wordGuess: WordGuessState | null = null;
let hangman: HangmanState | null = null;
let toastTimer = 0;

const screens: Record<ScreenName, HTMLElement> = {
  home: $('#screen-home'),
  wordguess: $('#screen-wordguess'),
  forca: $('#screen-forca')
};
const toast = $('#toast');
const wordBoard = $('#wg-board');
const wordKeyboard = $('#wg-keyboard');
const hangmanKeyboard = $('#forca-keyboard');
const hardModeToggle = $('#wg-hard-mode') as HTMLInputElement;

const pickForMode = (mode: 'wordguess' | 'forca'): string => {
  const pool = mode === 'wordguess' ? WORDGUESS_ANSWERS : FORCA_ANSWERS;
  const recent = recentWords[mode].slice(-50);
  const answer = chooseWord(pool, recent);
  recentWords = { ...recentWords, [mode]: [...recentWords[mode], answer].slice(-50) };
  storage.write('deduzi:recent:v1', recentWords);
  return answer;
};

function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function setTheme(theme: Preferences['theme']): void {
  preferences = { ...preferences, theme };
  document.documentElement.dataset.theme = theme;
  $('#theme-toggle').setAttribute('aria-label', theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
  $('#meta-theme').setAttribute('content', theme === 'dark' ? '#141512' : '#f6f4ee');
  storage.write('deduzi:preferences:v1', preferences);
}

function setColorblind(enabled: boolean): void {
  preferences = { ...preferences, colorblind: enabled };
  document.documentElement.dataset.colorblind = String(enabled);
  $('#colorblind-toggle').setAttribute('aria-pressed', String(enabled));
  $('#colorblind-toggle').setAttribute('aria-label', enabled ? 'Desativar modo para daltonismo' : 'Ativar modo para daltonismo');
  storage.write('deduzi:preferences:v1', preferences);
}

function startWordGuess(focus = false): void {
  wordGuess = createWordGuess(pickForMode('wordguess'));
  $('#wg-result').hidden = true;
  $('#wg-keyboard-area').hidden = false;
  hardModeToggle.checked = preferences.hardMode;
  renderWordGuess();
  setWordNote('Tente uma palavra de 5 letras. Dica: vogais diferentes revelam mais.');
  if (focus) $('#wordguess-title').focus({ preventScroll: true });
}

function startHangman(focus = false): void {
  hangman = createHangman(pickForMode('forca'));
  $('#forca-result').hidden = true;
  $('#forca-keyboard-area').hidden = false;
  ($('#forca-guess') as HTMLInputElement).value = '';
  renderHangman();
  setHangmanNote('Escolha uma letra para começar. Dica: comece pelas vogais.');
  if (focus) $('#forca-title').focus({ preventScroll: true });
}

function navigate(name: ScreenName, updateHistory = true): void {
  if (!screens[name]) return;
  if (name === 'wordguess' && !wordGuess) startWordGuess();
  if (name === 'forca' && !hangman) startHangman();
  activeScreen = name;
  Object.entries(screens).forEach(([screen, element]) => { element.hidden = screen !== name; });
  document.body.dataset.screen = name;
  document.title = name === 'home' ? 'Deduzi — jogo casual de palavras' : `${name === 'wordguess' ? 'WordGuess' : 'Forca'} — Deduzi`;
  if (updateHistory && location.hash !== `#${name}`) history.pushState(null, '', `#${name}`);
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const title = name === 'home' ? $('#home-title') : name === 'wordguess' ? $('#wordguess-title') : $('#forca-title');
  title.focus({ preventScroll: true });
}

function navigateFromLocation(): void {
  const route = location.hash.slice(1);
  navigate(route === 'wordguess' || route === 'forca' ? route : 'home', false);
}

function buildKeyboard(container: HTMLElement, actions = false): void {
  container.replaceChildren();
  ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach((letters, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'keyboard-row';
    if (rowIndex === 2 && actions) {
      const erase = document.createElement('button');
      erase.className = 'key key-action';
      erase.type = 'button';
      erase.dataset.action = 'BACKSPACE';
      erase.textContent = 'Apagar';
      erase.setAttribute('aria-label', 'Apagar última letra');
      row.append(erase);
    }
    [...letters].forEach((letter) => {
      const key = document.createElement('button');
      key.className = 'key';
      key.type = 'button';
      key.dataset.key = letter;
      key.textContent = letter;
      key.setAttribute('aria-label', `Letra ${letter}`);
      row.append(key);
    });
    if (rowIndex === 2 && actions) {
      const enter = document.createElement('button');
      enter.className = 'key key-action key-enter';
      enter.type = 'button';
      enter.dataset.action = 'ENTER';
      enter.textContent = 'Enter';
      enter.setAttribute('aria-label', 'Confirmar tentativa');
      row.append(enter);
    }
    container.append(row);
  });
}

function renderWordGuess(): void {
  if (!wordGuess) return;
  wordBoard.replaceChildren();
  const submitted = wordGuess.guesses.length;
  for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
    const row = document.createElement('div');
    row.className = 'word-row';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', `Tentativa ${rowIndex + 1}`);
    for (let col = 0; col < 5; col += 1) {
      const tile = document.createElement('div');
      const guess = wordGuess.guesses[rowIndex];
      const letter = guess?.word[col] ?? (rowIndex === submitted ? wordGuess.current[col] ?? '' : '');
      const state = guess?.states[col];
      tile.className = `word-tile${letter ? ' has-letter' : ''}${state ? ` state-${state}` : ''}`;
      tile.textContent = letter;
      const stateLabel = state === 'correct' ? 'lugar certo' : state === 'present' ? 'em outra posição' : state === 'absent' ? 'não aparece' : '';
      tile.setAttribute('aria-label', `Tentativa ${rowIndex + 1}, letra ${col + 1}: ${letter || 'vazia'}${stateLabel ? `, ${stateLabel}` : ''}`);
      row.append(tile);
    }
    wordBoard.append(row);
  }

  const progress = $('#wg-progress');
  if (wordGuess.status === 'playing') progress.innerHTML = `Tentativa <strong>${submitted + 1}</strong> de 6`;
  else if (wordGuess.status === 'won') progress.innerHTML = `<strong>${submitted}</strong> ${submitted === 1 ? 'tentativa' : 'tentativas'} até acertar`;
  else progress.textContent = 'Tentativas esgotadas';
  const dots = $('#wg-dots');
  dots.replaceChildren(...Array.from({ length: 6 }, (_, index) => {
    const dot = document.createElement('span');
    dot.className = `progress-dot${index < submitted ? ' is-used' : ''}${wordGuess?.status === 'playing' && index === submitted ? ' is-current' : ''}`;
    return dot;
  }));
  $$<HTMLButtonElement>('.key', wordKeyboard).forEach((key) => {
    const letter = key.dataset.key;
    const state = letter ? wordGuess?.keyStates[letter] : undefined;
    if (state) {
      key.dataset.state = state;
      key.setAttribute('aria-label', `${letter}, ${state === 'correct' ? 'lugar certo' : state === 'present' ? 'em outra posição' : 'não aparece na palavra'}`);
    } else if (letter) {
      delete key.dataset.state;
      key.setAttribute('aria-label', `Letra ${letter}`);
    }
    key.disabled = wordGuess?.status !== 'playing';
  });
}

function setWordNote(message: string, alert = false): void {
  const note = $('#wg-note');
  note.textContent = message;
  note.classList.toggle('is-alert', alert);
}

function submitCurrentGuess(): void {
  if (!wordGuess || wordGuess.status !== 'playing') return;
  const result = submitWordGuess(wordGuess, wordGuess.current, VALID_GUESSES, hardModeToggle.checked);
  if (result.error) {
    setWordNote(result.error, true);
    wordBoard.classList.remove('is-shaking');
    void wordBoard.offsetWidth;
    wordBoard.classList.add('is-shaking');
    return;
  }
  wordGuess = result.state;
  renderWordGuess();
  if (wordGuess.status !== 'playing') {
    $('#wg-keyboard-area').hidden = true;
    $('#wg-result').hidden = false;
    $('#wg-result-title').textContent = wordGuess.status === 'won' ? 'Você acertou.' : 'Não foi desta vez.';
    $('#wg-result-word').textContent = wordGuess.answer;
    $('#wg-result-meta').textContent = wordGuess.status === 'won' ? `Em ${wordGuess.guesses.length} de 6 tentativas.` : 'As 6 tentativas foram usadas.';
    setWordNote(wordGuess.status === 'won' ? `Você acertou em ${wordGuess.guesses.length} ${wordGuess.guesses.length === 1 ? 'tentativa' : 'tentativas'}.` : `As tentativas acabaram. A palavra era ${wordGuess.answer}.`);
    $('#wg-result-title').focus({ preventScroll: true });
    return;
  }
  const last = wordGuess.guesses.at(-1)!;
  const correct = last.states.filter((state) => state === 'correct').length;
  const present = last.states.filter((state) => state === 'present').length;
  const rest = 6 - wordGuess.guesses.length;
  const summary = correct && present ? `${correct} no lugar certo e ${present} em outra posição.` : correct ? `${correct} ${correct === 1 ? 'letra no lugar certo.' : 'letras no lugar certo.'}` : present ? `${present} ${present === 1 ? 'letra em outra posição.' : 'letras em outra posição.'}` : 'Nenhuma letra dessa palavra aparece.';
  setWordNote(`${summary} Restam ${rest} ${rest === 1 ? 'tentativa.' : 'tentativas.'}`);
}

function renderHangman(): void {
  if (!hangman) return;
  const livesLeft = 6 - hangman.wrongGuesses;
  $('#forca-lives-text').textContent = `${livesLeft} de 6`;
  const lives = $('#forca-lives');
  lives.replaceChildren(...Array.from({ length: 6 }, (_, index) => {
    const heart = document.createElement('span');
    heart.className = `life${index >= livesLeft ? ' is-lost' : ''}`;
    heart.textContent = '♥';
    heart.setAttribute('aria-hidden', 'true');
    return heart;
  }));
  lives.setAttribute('aria-label', `${livesLeft} de 6 vidas restantes`);
  const word = $('#forca-word');
  word.replaceChildren(...[...hangman.answer].map((letter) => {
    const slot = document.createElement('span');
    const revealed = hangman!.guessedLetters.includes(letter) || hangman!.status === 'lost';
    slot.className = `hangman-letter${revealed ? ' is-revealed' : ''}`;
    slot.textContent = revealed ? letter : '';
    slot.setAttribute('aria-hidden', 'true');
    return slot;
  }));
  const revealed = [...new Set([...hangman.answer].filter((letter) => hangman!.guessedLetters.includes(letter)))];
  const hidden = [...hangman.answer].filter((letter) => !hangman!.guessedLetters.includes(letter)).length;
  word.setAttribute('aria-label', hangman.status === 'lost' ? `Palavra revelada: ${hangman.answer}` : `Palavra de ${hangman.answer.length} letras. Letras reveladas: ${revealed.join(', ') || 'nenhuma'}. ${hidden} letras ocultas.`);
  $('#forca-word-meta').textContent = `${hangman.answer.length} letras`;
  $$<HTMLButtonElement>('.key', hangmanKeyboard).forEach((key) => {
    const letter = key.dataset.key!;
    if (hangman!.guessedLetters.includes(letter)) {
      key.dataset.state = hangman!.answer.includes(letter) ? 'correct' : 'wrong';
      key.disabled = true;
      key.setAttribute('aria-label', `${letter}, ${hangman!.answer.includes(letter) ? 'acertou' : 'não está na palavra'}`);
    } else {
      delete key.dataset.state;
      key.disabled = hangman!.status !== 'playing';
      key.setAttribute('aria-label', `Letra ${letter}`);
    }
  });
}

function setHangmanNote(message: string, alert = false): void {
  const note = $('#forca-note');
  note.textContent = message;
  note.classList.toggle('is-alert', alert);
}

function finishHangman(): void {
  if (!hangman || hangman.status === 'playing') return;
  $('#forca-keyboard-area').hidden = true;
  $('#forca-result').hidden = false;
  $('#forca-result-title').textContent = hangman.status === 'won' ? 'Você descobriu.' : 'As vidas acabaram.';
  $('#forca-result-word').textContent = hangman.answer;
  $('#forca-result-meta').textContent = `${6 - hangman.wrongGuesses} de 6 vidas restantes.`;
  setHangmanNote(hangman.status === 'won' ? 'Você descobriu a palavra.' : `As vidas acabaram. A palavra era ${hangman.answer}.`);
  renderHangman();
  $('#forca-result-title').focus({ preventScroll: true });
}

function playHangmanLetter(rawLetter: string): void {
  if (!hangman || hangman.status !== 'playing') return;
  const letter = normalizeWord(rawLetter);
  if (hangman.guessedLetters.includes(letter)) {
    setHangmanNote(`Você já tentou a letra ${letter}. Escolha outra.`);
    return;
  }
  const hit = hangman.answer.includes(letter);
  hangman = guessHangmanLetter(hangman, letter);
  renderHangman();
  if (hangman.status !== 'playing') { finishHangman(); return; }
  const lives = 6 - hangman.wrongGuesses;
  setHangmanNote(hit ? `Boa! A letra ${letter} está na palavra.` : `A letra ${letter} não aparece. Restam ${lives} ${lives === 1 ? 'vida.' : 'vidas.'}`);
}

function shareText(mode: 'wordguess' | 'forca'): string {
  if (mode === 'wordguess' && wordGuess) {
    const score = wordGuess.status === 'won' ? `${wordGuess.guesses.length}/6` : 'X/6';
    const grid = wordGuess.guesses.map(({ states }) => states.map((state) => state === 'correct' ? '🟩' : state === 'present' ? '🟨' : '⬜').join('')).join('\n');
    return `Deduzi · WordGuess ${score}\n\n${grid}`;
  }
  if (hangman) {
    const marks = hangman.guessedLetters.map((letter) => hangman!.answer.includes(letter) ? '🟩' : '🟥').join('');
    return `Deduzi · Forca — ${hangman.status === 'won' ? 'vitória' : 'fim de jogo'}\n${'❤️'.repeat(6 - hangman.wrongGuesses)} ${6 - hangman.wrongGuesses}/6 vidas\n\n${marks}`;
  }
  return 'Deduzi';
}

async function shareResult(mode: 'wordguess' | 'forca'): Promise<void> {
  const text = shareText(mode);
  if (navigator.share) {
    try {
      await navigator.share({ title: `Deduzi · ${mode === 'wordguess' ? 'WordGuess' : 'Forca'}`, text });
      showToast('Resultado compartilhado.');
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else throw new Error('Clipboard indisponível');
    showToast('Resultado copiado para a área de transferência.');
  } catch {
    const panel = $(`#${mode === 'wordguess' ? 'wg-result' : 'forca-result'}`);
    let fallback = panel.querySelector<HTMLTextAreaElement>('.share-fallback textarea');
    if (!fallback) {
      const wrapper = document.createElement('div');
      wrapper.className = 'share-fallback';
      wrapper.innerHTML = '<label>Selecione e copie o resultado<textarea readonly rows="5"></textarea></label>';
      panel.append(wrapper);
      fallback = wrapper.querySelector('textarea');
    }
    if (!fallback) return;
    fallback.value = text;
    fallback.closest('.share-fallback')?.removeAttribute('hidden');
    fallback.focus();
    fallback.select();
    showToast('Cópia automática indisponível. O texto está selecionado.');
  }
}

function openHelp(trigger: HTMLElement): void {
  const modal = $('#help-modal');
  const dialog = $('.help-dialog', modal);
  const previous = trigger;
  modal.hidden = false;
  document.documentElement.classList.add('is-locked');
  $$<HTMLElement>('.site-header, .site-main, .site-footer').forEach((element) => { element.inert = true; });
  const focusables = $$<HTMLElement>('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])', dialog);
  $('#close-help').focus();

  const close = (): void => {
    modal.hidden = true;
    document.documentElement.classList.remove('is-locked');
    $$<HTMLElement>('.site-header, .site-main, .site-footer').forEach((element) => { element.inert = false; });
    previous.focus({ preventScroll: true });
    document.removeEventListener('keydown', onKeydown);
  };
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') close();
    if (event.key !== 'Tab') return;
    const first = focusables[0];
    const last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  document.addEventListener('keydown', onKeydown);
  $('#close-help').onclick = close;
  $('#help-done').onclick = close;
  modal.onclick = (event) => { if (event.target === modal) close(); };
}

$('#theme-toggle').addEventListener('click', () => setTheme(preferences.theme === 'dark' ? 'light' : 'dark'));
$('#colorblind-toggle').addEventListener('click', () => setColorblind(!preferences.colorblind));
$('#colorblind-toggle').setAttribute('aria-pressed', String(preferences.colorblind));
$('#colorblind-toggle').setAttribute('aria-label', preferences.colorblind ? 'Desativar modo para daltonismo' : 'Ativar modo para daltonismo');
setTheme(preferences.theme);
setColorblind(preferences.colorblind);

buildKeyboard(wordKeyboard, true);
buildKeyboard(hangmanKeyboard);
if (preferences.welcomeDismissed) $('#welcome-strip').hidden = true;
hardModeToggle.checked = preferences.hardMode;
hardModeToggle.addEventListener('change', () => {
  preferences = { ...preferences, hardMode: hardModeToggle.checked };
  storage.write('deduzi:preferences:v1', preferences);
});

$$<HTMLElement>('[data-start]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.start as ScreenName)));
$$<HTMLElement>('[data-go-home]').forEach((button) => button.addEventListener('click', () => navigate('home')));
$('#brand-home').addEventListener('click', () => navigate('home'));
$$<HTMLElement>('[data-open-help]').forEach((button) => button.addEventListener('click', () => openHelp(button)));
$('#dismiss-welcome').addEventListener('click', () => {
  $('#welcome-strip').hidden = true;
  preferences = { ...preferences, welcomeDismissed: true };
  storage.write('deduzi:preferences:v1', preferences);
});

wordKeyboard.addEventListener('click', (event) => {
  const key = (event.target as HTMLElement).closest<HTMLButtonElement>('.key');
  if (!key || !wordGuess || wordGuess.status !== 'playing') return;
  if (key.dataset.action === 'ENTER') submitCurrentGuess();
  else if (key.dataset.action === 'BACKSPACE') {
    wordGuess.current = wordGuess.current.slice(0, -1);
    renderWordGuess();
  } else if (key.dataset.key && wordGuess.current.length < 5) {
    wordGuess.current += key.dataset.key;
    renderWordGuess();
  }
});

hangmanKeyboard.addEventListener('click', (event) => {
  const key = (event.target as HTMLElement).closest<HTMLButtonElement>('.key');
  if (key?.dataset.key) playHangmanLetter(key.dataset.key);
});

$('#wg-again').addEventListener('click', () => startWordGuess(true));
$('#forca-again').addEventListener('click', () => startHangman(true));
$('#wg-share').addEventListener('click', () => { if (wordGuess?.status !== 'playing') void shareResult('wordguess'); });
$('#forca-share').addEventListener('click', () => { if (hangman?.status !== 'playing') void shareResult('forca'); });
$('#forca-guess-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!hangman) return;
  const input = $('#forca-guess') as HTMLInputElement;
  const result = guessHangmanWord(hangman, input.value);
  if (result.error) { setHangmanNote(result.error, true); input.focus(); return; }
  hangman = result.state;
  input.value = '';
  renderHangman();
  if (hangman.status !== 'playing') finishHangman();
  else setHangmanNote(`Palavra incorreta. Restam ${6 - hangman.wrongGuesses} vidas.`);
});

document.addEventListener('keydown', (event) => {
  if (!$('#help-modal').hidden || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.matches('input, textarea, select, button, a') || target.isContentEditable)) return;
  if (activeScreen === 'wordguess' && wordGuess?.status === 'playing') {
    if (/^[a-z]$/i.test(event.key) && wordGuess.current.length < 5) {
      event.preventDefault();
      wordGuess.current += event.key.toLocaleUpperCase('pt-BR');
      renderWordGuess();
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      wordGuess.current = wordGuess.current.slice(0, -1);
      renderWordGuess();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      submitCurrentGuess();
    }
  } else if (activeScreen === 'forca' && hangman?.status === 'playing' && /^[a-z]$/i.test(event.key) && !event.repeat) {
    event.preventDefault();
    playHangmanLetter(event.key);
  }
});

window.addEventListener('popstate', navigateFromLocation);
window.addEventListener('hashchange', navigateFromLocation);
const initialRoute = location.hash.slice(1);
navigate(initialRoute === 'wordguess' || initialRoute === 'forca' ? initialRoute : 'home', false);
