import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FULL_STAMINA } from '../../../domain/features/match-simulation/StaminaPolicy';

// Below this the bar blinks. Colours come from `currentColor`, so the bar follows the team's
// palette and inverts with a selected row; blinking is the warning that works on any background.
export const LOW_STAMINA_THRESHOLD = 70;

interface StaminaBarProps {
  stamina?: number;
}

const StaminaBar: FC<StaminaBarProps> = ({ stamina }) => {
  const { t } = useTranslation();
  // Undefined until the first tick of the match; the engine reads it as full, and so do we.
  const value = stamina ?? FULL_STAMINA;
  const isLow = value < LOW_STAMINA_THRESHOLD;

  return (
    <div
      role="progressbar"
      aria-label={t('teamManager.playerStats.stamina')}
      aria-valuemin={0}
      aria-valuemax={FULL_STAMINA}
      aria-valuenow={value}
      className={`relative shrink-0 w-[36px] h-[6px] ${isLow ? 'animate-blink' : ''}`}
    >
      <div className="absolute inset-0 bg-current opacity-25" />
      <div
        className="absolute inset-y-0 left-0 bg-current"
        style={{ width: `${(value / FULL_STAMINA) * 100}%` }}
      />
    </div>
  );
};

export default StaminaBar;
