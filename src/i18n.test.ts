import { LANGUAGE_STORAGE_KEY } from './infrastructure/repositories/LanguageRepository';

type I18nModule = typeof import('./i18n');

function loadI18n(): I18nModule {
  let loaded: I18nModule | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<I18nModule>('./i18n');
  });
  return loaded!;
}

describe('i18n', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts in the device language when nothing is stored', () => {
    jest.spyOn(window.navigator, 'language', 'get').mockReturnValue('pt-PT');

    const { default: i18n } = loadI18n();

    expect(i18n.language).toBe('pt-BR');
    expect(document.documentElement.lang).toBe('pt-BR');
  });

  it('defaults to en under the jsdom locale', () => {
    const { default: i18n } = loadI18n();

    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('prefers the stored language over the device language', () => {
    jest.spyOn(window.navigator, 'language', 'get').mockReturnValue('en-US');
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt-BR');

    const { default: i18n } = loadI18n();

    expect(i18n.language).toBe('pt-BR');
  });

  it('changeGameLanguage switches i18n, persists the choice and updates <html lang>', async () => {
    const { default: i18n, changeGameLanguage } = loadI18n();

    await changeGameLanguage('pt-BR');

    expect(i18n.language).toBe('pt-BR');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt-BR');
    expect(document.documentElement.lang).toBe('pt-BR');

    await changeGameLanguage('en');

    expect(i18n.language).toBe('en');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
