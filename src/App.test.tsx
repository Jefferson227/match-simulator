import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import App from './App';
import i18n from './i18n';
import { createInitialGameState } from './game-engine/initialGameState';
import { LANGUAGE_STORAGE_KEY } from './infrastructure/repositories/LanguageRepository';

jest.mock('./game-engine/initialGameState', () => ({
  createInitialGameState: jest.fn(),
}));

describe('App routing', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage('en');
  });

  const startOn = (currentScreen: string) =>
    jest.mocked(createInitialGameState).mockReturnValue({
      championshipContainer: { championships: [], playableInternalName: '' },
      leagueType: 'mens',
      coachName: '',
      currentScreen,
    } as unknown as ReturnType<typeof createInitialGameState>);

  it('renders the language selector for the LanguageSelector screen', () => {
    startOn('LanguageSelector');

    render(<App />);

    expect(screen.getByRole('heading', { name: 'SELECT LANGUAGE' })).toBeTruthy();
  });

  it('switches the whole menu to Portuguese from the language screen and back', async () => {
    startOn('InitialScreen');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Language' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Português \(Brasil\)/ }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'VOLTAR' }));

    expect(screen.getByRole('button', { name: 'Novo Jogo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Idioma' })).toBeTruthy();
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt-BR');
  });
});
