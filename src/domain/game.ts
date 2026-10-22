import { normalizeWord } from './words';

export type TileState = 'correct' | 'present' | 'absent';
export type Guess = { word: string; states: TileState[] };
export type WordGuessState = {
  answer: string;
  current: string;
  guesses: Guess[];
  keyStates: Record<string, TileState>;
  status: 'playing' | 'won' | 'lost';
};
export type HangmanState = {
  answer: string;
  guessedLetters: string[];
  wrongGuesses: number;
  status: 'playing' | 'won' | 'lost';
};

export const createWordGuess = (answer: string): WordGuessState => ({
  answer: normalizeWord(answer), current: '', guesses: [], keyStates: {}, status: 'playing'
});

export const scoreGuess = (guess: string, answer: string): TileState[] => {
  const result: TileState[] = Array(guess.length).fill('absent');
  const remaining = new Map<string, number>();

  for (let index = 0; index < answer.length; index += 1) {
    if (guess[index] === answer[index]) result[index] = 'correct';
    else remaining.set(answer[index], (remaining.get(answer[index]) ?? 0) + 1);
  }

  for (let index = 0; index < guess.length; index += 1) {
    if (result[index] === 'correct') continue;
    const count = remaining.get(guess[index]) ?? 0;
    if (count > 0) {
      result[index] = 'present';
      remaining.set(guess[index], count - 1);
    }
  }

  return result;
};

export const submitWordGuess = (
  state: WordGuessState,
  rawGuess: string,
  validWords: ReadonlySet<string>,
  hardMode = false
): { state: WordGuessState; error?: string } => {
  if (state.status !== 'playing') return { state };
  const guess = normalizeWord(rawGuess);
  if (!/^[A-Z]{5}$/.test(guess)) return { state, error: 'A tentativa precisa ter 5 letras.' };
  if (!validWords.has(guess)) return { state, error: 'Essa palavra não está na lista aceita.' };

  if (hardMode) {
    const previousStates = state.guesses.flatMap(({ word, states }) =>
      [...word].flatMap((letter, index) => states[index] === 'correct' || states[index] === 'present' ? [{ letter, index, state: states[index] }] : [])
    );
    const missingPosition = previousStates.find(({ letter, index, state: tileState }) =>
      tileState === 'correct' && guess[index] !== letter
    );
    if (missingPosition) return { state, error: `A letra ${missingPosition.letter} precisa continuar na posição correta.` };

    const repeatedYellowPosition = previousStates.find(({ letter, index, state: tileState }) =>
      tileState === 'present' && guess[index] === letter
    );
    if (repeatedYellowPosition) return { state, error: `A letra ${repeatedYellowPosition.letter} precisa mudar de posição.` };

    const requiredLetters = new Set(previousStates.filter(({ state: tileState }) => tileState === 'present').map(({ letter }) => letter));
    const missingLetter = [...requiredLetters].find((letter) => !guess.includes(letter));
    if (missingLetter) return { state, error: `Inclua a letra ${missingLetter}, que já apareceu na palavra.` };
  }

  const scored = scoreGuess(guess, state.answer);
  const keyStates = { ...state.keyStates };
  const rank: Record<TileState, number> = { absent: 1, present: 2, correct: 3 };
  [...guess].forEach((letter, index) => {
    if (!keyStates[letter] || rank[scored[index]] > rank[keyStates[letter]]) keyStates[letter] = scored[index];
  });
  const guesses = [...state.guesses, { word: guess, states: scored }];
  const status = guess === state.answer ? 'won' : guesses.length >= 6 ? 'lost' : 'playing';
  return { state: { ...state, current: '', guesses, keyStates, status } };
};

export const createHangman = (answer: string): HangmanState => ({
  answer: normalizeWord(answer), guessedLetters: [], wrongGuesses: 0, status: 'playing'
});

export const guessHangmanLetter = (state: HangmanState, rawLetter: string): HangmanState => {
  if (state.status !== 'playing') return state;
  const letter = normalizeWord(rawLetter);
  if (!/^[A-Z]$/.test(letter) || state.guessedLetters.includes(letter)) return state;
  const guessedLetters = [...state.guessedLetters, letter];
  const wrongGuesses = state.wrongGuesses + (state.answer.includes(letter) ? 0 : 1);
  const won = [...state.answer].every((answerLetter) => guessedLetters.includes(answerLetter));
  return { ...state, guessedLetters, wrongGuesses, status: won ? 'won' : wrongGuesses >= 6 ? 'lost' : 'playing' };
};

export const guessHangmanWord = (state: HangmanState, rawWord: string): { state: HangmanState; error?: string } => {
  if (state.status !== 'playing') return { state };
  const word = normalizeWord(rawWord);
  if (!/^[A-Z]{4,8}$/.test(word)) return { state, error: 'Digite uma palavra de 4 a 8 letras.' };
  if (word.length !== state.answer.length) return { state, error: `A palavra precisa ter ${state.answer.length} letras.` };
  if (word === state.answer) {
    return { state: { ...state, guessedLetters: [...new Set([...state.guessedLetters, ...state.answer])], status: 'won' } };
  }
  const wrongGuesses = state.wrongGuesses + 1;
  return { state: { ...state, wrongGuesses, status: wrongGuesses >= 6 ? 'lost' : 'playing' } };
};
