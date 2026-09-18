import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './presentation/locales/en.json';
import ptBR from './presentation/locales/pt-BR.json';
import {
  Language,
  detectDeviceLanguage,
  getStoredLanguage,
  saveLanguage,
} from './infrastructure/repositories/LanguageRepository';

const initialLanguage: Language = getStoredLanguage() ?? detectDeviceLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
  },
  lng: initialLanguage, // the player's stored choice, else the device locale
  fallbackLng: 'pt-BR', // fallback if the language is not available
  interpolation: {
    escapeValue: false, // React already does escaping
  },
});

document.documentElement.lang = initialLanguage;

/** Switches every translated label, remembers the choice and keeps `<html lang>` in step. */
export function changeGameLanguage(language: Language): Promise<unknown> {
  saveLanguage(language);
  document.documentElement.lang = language;
  return i18n.changeLanguage(language);
}

export default i18n;
