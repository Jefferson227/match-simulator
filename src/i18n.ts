import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
  },
  lng: 'en', // default language
  fallbackLng: 'pt-BR', // fallback if the language is not available
  interpolation: {
    escapeValue: false, // React already does escaping
  },
});

export default i18n;
