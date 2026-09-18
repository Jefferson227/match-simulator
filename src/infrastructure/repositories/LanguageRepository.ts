export const SUPPORTED_LANGUAGES = ['en', 'pt-BR'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Kept apart from the saved game on purpose: the language survives New Game, works before any save
 * exists, and never changes the save format.
 */
export const LANGUAGE_STORAGE_KEY = 'match-simulator-language';

function isSupportedLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

/** The player's stored choice, or `null` when there is none, it is unsupported or storage fails. */
export function getStoredLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Persists the choice. A failed write must not break the switch itself, so errors are swallowed. */
export function saveLanguage(language: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage unavailable or full: the language still applies for this session.
  }
}

/** Any Portuguese locale maps to `pt-BR`; everything else, including no locale at all, to `en`. */
export function detectDeviceLanguage(): Language {
  const locale =
    typeof navigator === 'undefined' ? undefined : navigator.language || navigator.languages?.[0];

  return locale?.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}
