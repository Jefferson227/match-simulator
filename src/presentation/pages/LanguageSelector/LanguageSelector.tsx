import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import MainLayout from '../../components/MainLayout/MainLayout';
import PixelFlag, { FlagCountry } from '../../components/PixelFlag/PixelFlag';
import { changeGameLanguage } from '../../../i18n';
import { Language } from '../../../infrastructure/repositories/LanguageRepository';

// Each option is labelled in its own language, so a player can find theirs whatever is active.
// Labels are 12px: the pixel font is ~1em per glyph, and "Português (Brasil)" beside a flag would
// overflow the 342px button at the sibling screens' text-lg.
const LANGUAGE_OPTIONS: { language: Language; country: FlagCountry; label: string }[] = [
  { language: 'en', country: 'us', label: 'English' },
  { language: 'pt-BR', country: 'br', label: 'Português (Brasil)' },
];

const BUTTON_CLASS =
  'w-[342px] h-[80px] px-4 border-4 border-white uppercase transition hover:bg-white hover:text-[#3d7a33] hover:[text-shadow:none]';
const IDLE_CLASS = '[text-shadow:-3px_3px_0_#2a5624]';
const ACTIVE_CLASS = 'bg-white text-[#3d7a33] [text-shadow:none]';

const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();
  const engine = useGameEngine();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <MainLayout>
      <div
        className="font-press-start w-full flex flex-col items-center justify-center py-8"
        style={{ backgroundColor: '#3d7a33', color: 'white' }}
      >
        <h1
          className="text-lg mb-8 w-[342px] max-w-full text-center"
          style={{ textShadow: '-3px 3px 0 #2a5624' }}
        >
          {t('languageSelector.title')}
        </h1>

        <div className="flex flex-col items-center gap-4 w-[342px] max-w-full">
          {LANGUAGE_OPTIONS.map(({ language, country, label }) => {
            const isActive = activeLanguage === language;

            return (
              <button
                key={language}
                lang={language}
                aria-pressed={isActive}
                onClick={() => changeGameLanguage(language)}
                className={`${BUTTON_CLASS} text-[12px] flex items-center justify-center gap-4 ${
                  isActive ? ACTIVE_CLASS : IDLE_CLASS
                }`}
                style={{ boxShadow: '-6px 6px 0 #2a5624' }}
              >
                <PixelFlag country={country} />
                <span>{label}</span>
              </button>
            );
          })}

          <button
            onClick={() =>
              engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'InitialScreen' })
            }
            className={`${BUTTON_CLASS} ${IDLE_CLASS} text-lg mt-8`}
            style={{ boxShadow: '-6px 6px 0 #2a5624' }}
          >
            {t('languageSelector.back')}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default LanguageSelector;
