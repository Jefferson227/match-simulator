import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  detectDeviceLanguage,
  getStoredLanguage,
  saveLanguage,
} from '../../../src/infrastructure/repositories/LanguageRepository';

function mockNavigatorLanguage(language: string, languages: string[] = []) {
  jest.spyOn(window.navigator, 'language', 'get').mockReturnValue(language);
  jest.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages);
}

describe('LanguageRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('supports English and Brazilian Portuguese', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'pt-BR']);
  });

  describe('getStoredLanguage', () => {
    it('returns null when nothing is stored', () => {
      expect(getStoredLanguage()).toBeNull();
    });

    it.each(['en', 'pt-BR'] as const)('returns the stored language %s', (language) => {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

      expect(getStoredLanguage()).toBe(language);
    });

    it.each(['es', 'pt', 'EN', ''])('ignores the unsupported stored value "%s"', (value) => {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, value);

      expect(getStoredLanguage()).toBeNull();
    });

    it('returns null when storage throws', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(getStoredLanguage()).toBeNull();
    });
  });

  describe('saveLanguage', () => {
    it('writes the language under its own key', () => {
      saveLanguage('pt-BR');

      expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt-BR');
      expect(getStoredLanguage()).toBe('pt-BR');
    });

    it('does not throw when storage throws', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => saveLanguage('en')).not.toThrow();
    });
  });

  describe('detectDeviceLanguage', () => {
    it.each(['pt', 'pt-PT', 'pt-BR', 'PT-br'])('maps %s to pt-BR', (locale) => {
      mockNavigatorLanguage(locale);

      expect(detectDeviceLanguage()).toBe('pt-BR');
    });

    it.each(['en-US', 'en', 'es', 'fr-FR'])('maps %s to en', (locale) => {
      mockNavigatorLanguage(locale);

      expect(detectDeviceLanguage()).toBe('en');
    });

    it('falls back to the first preferred language when navigator.language is empty', () => {
      mockNavigatorLanguage('', ['pt-BR', 'en']);

      expect(detectDeviceLanguage()).toBe('pt-BR');
    });

    it('defaults to en when no locale is reported', () => {
      mockNavigatorLanguage('', []);

      expect(detectDeviceLanguage()).toBe('en');
    });
  });
});
