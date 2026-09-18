import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import LanguageSelector from './LanguageSelector';
import i18n from '../../../i18n';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { GameEngine } from '../../../game-engine/GameEngine';
import { LANGUAGE_STORAGE_KEY } from '../../../infrastructure/repositories/LanguageRepository';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

const mockDispatch = jest.fn();

const renderSelector = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <LanguageSelector />
    </I18nextProvider>
  );

const englishButton = () => screen.getByRole('button', { name: /English/ });
const portugueseButton = () => screen.getByRole('button', { name: /Português \(Brasil\)/ });

describe('LanguageSelector', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(useGameEngine).mockReturnValue({ dispatch: mockDispatch } as unknown as GameEngine);
    window.localStorage.clear();
    await i18n.changeLanguage('en');
  });

  it('renders the title, both options with their flags and native labels, and Back', () => {
    renderSelector();

    expect(screen.getByRole('heading', { name: 'SELECT LANGUAGE' })).toBeTruthy();
    expect(englishButton().querySelector('[data-testid="pixel-flag-us"]')).toBeTruthy();
    expect(portugueseButton().querySelector('[data-testid="pixel-flag-br"]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'BACK' })).toBeTruthy();
  });

  it('marks the active language as pressed', () => {
    renderSelector();

    expect(englishButton().getAttribute('aria-pressed')).toBe('true');
    expect(portugueseButton().getAttribute('aria-pressed')).toBe('false');
  });

  it('applies Brazilian Portuguese immediately, persists it and stays on screen', async () => {
    renderSelector();

    await act(async () => {
      fireEvent.click(portugueseButton());
    });

    expect(i18n.language).toBe('pt-BR');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt-BR');
    expect(document.documentElement.lang).toBe('pt-BR');
    expect(screen.getByRole('heading', { name: 'SELECIONE O IDIOMA' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'VOLTAR' })).toBeTruthy();
    expect(portugueseButton().getAttribute('aria-pressed')).toBe('true');
    expect(englishButton().getAttribute('aria-pressed')).toBe('false');
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('keeps the option labels in their own language whatever is active', async () => {
    await i18n.changeLanguage('pt-BR');
    renderSelector();

    expect(englishButton()).toBeTruthy();
    expect(portugueseButton()).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Bandeira dos Estados Unidos' })).toBeTruthy();
  });

  it('switches back to English', async () => {
    await i18n.changeLanguage('pt-BR');
    renderSelector();

    await act(async () => {
      fireEvent.click(englishButton());
    });

    expect(i18n.language).toBe('en');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(screen.getByRole('heading', { name: 'SELECT LANGUAGE' })).toBeTruthy();
  });

  it('returns to the initial screen on Back', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: 'BACK' }));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'InitialScreen',
    });
  });
});
