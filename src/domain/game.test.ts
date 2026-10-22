import { describe, expect, it } from 'vitest';
import { createHangman, createWordGuess, guessHangmanLetter, guessHangmanWord, scoreGuess, submitWordGuess } from './game';
import { normalizeWord } from './words';

const valid = new Set(['BANCO', 'BOLSO', 'LIVRO', 'AMIGO', 'FESTA']);

describe('normalização', () => {
  it('remove acentos e normaliza para maiúsculas', () => {
    expect(normalizeWord('coração')).toBe('CORACAO');
  });
});

describe('WordGuess', () => {
  it('pontua letras duplicadas sem exceder ocorrências', () => {
    expect(scoreGuess('BOOLO', 'BOLSO')).toEqual(['correct', 'correct', 'absent', 'present', 'correct']);
    expect(scoreGuess('BANCO', 'BANCO')).toEqual(Array(5).fill('correct'));
  });

  it('não consome tentativa para palavra desconhecida', () => {
    const initial = createWordGuess('LIVRO');
    const result = submitWordGuess(initial, 'XXXXX', valid);
    expect(result.error).toContain('lista aceita');
    expect(result.state.guesses).toHaveLength(0);
  });

  it('encerra a rodada ao acertar', () => {
    const result = submitWordGuess(createWordGuess('AMIGO'), 'AMIGO', valid);
    expect(result.state.status).toBe('won');
  });

  it('aplica as restrições do modo difícil', () => {
    const words = new Set([...valid, 'LARGO', 'LIMPA']);
    const first = submitWordGuess(createWordGuess('LIMPA'), 'LARGO', words).state;
    const next = submitWordGuess(first, 'LARGO', words, true);
    expect(next.error).toContain('mudar de posição');
  });
});

describe('Forca', () => {
  it('revela todas as ocorrências e não penaliza repetição', () => {
    const first = guessHangmanLetter(createHangman('BANANA'), 'A');
    const repeated = guessHangmanLetter(first, 'A');
    expect(first.guessedLetters).toContain('A');
    expect(repeated.wrongGuesses).toBe(0);
    expect(repeated.guessedLetters).toHaveLength(1);
  });

  it('perde uma vida ao errar a palavra inteira', () => {
    const result = guessHangmanWord(createHangman('JANELA'), 'CAMISA');
    expect(result.state.wrongGuesses).toBe(1);
    expect(result.state.status).toBe('playing');
  });

  it('revela todas as letras ao acertar a palavra inteira', () => {
    const result = guessHangmanWord(createHangman('JANELA'), 'JANELA');
    expect(result.state.status).toBe('won');
    expect(result.state.guessedLetters).toEqual(['J', 'A', 'N', 'E', 'L']);
  });

  it('exige que o chute inteiro tenha o mesmo tamanho da resposta', () => {
    const result = guessHangmanWord(createHangman('JANELA'), 'ANEL');
    expect(result.error).toContain('6 letras');
    expect(result.state.wrongGuesses).toBe(0);
  });

  it('vence quando todas as letras foram reveladas', () => {
    let state = createHangman('ANEL');
    for (const letter of 'ANEL') state = guessHangmanLetter(state, letter);
    expect(state.status).toBe('won');
  });
});
