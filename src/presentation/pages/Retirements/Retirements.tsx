import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../components/MainLayout/MainLayout';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { RetirementReportEntry } from '../../../domain/models/RetirementReport';

const Divider: React.FC = () => (
  <div style={{ height: '4px', background: '#e2e2e2', width: '100%' }} />
);

const PositionBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex w-[40px] justify-center border-[3px] border-[#e2e2e2] py-1 text-[11px] text-white">
    {children}
  </div>
);

/**
 * The human club's retirements at the roll-over just run: who retired, who took their place, and
 * who went into the coach pool. Shown after NEW SEASON only when somebody retired.
 */
const Retirements: React.FC = () => {
  const engine = useGameEngine();
  const state = useGameState(engine);
  const { t } = useTranslation();
  const report = state.lastSeasonRetirements;
  const entries = report?.entries ?? [];
  // The women's game says "técnica" where the men's says "técnico".
  const coachContext = state.leagueType === 'womens' ? 'female' : undefined;

  const age = (years: number) => t('retirements.age', { age: years });

  const handleContinue = () => {
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamManager' });
  };

  const renderEntry = ({ retired, replacement, becameCoach }: RetirementReportEntry) => (
    <div key={retired.id} data-testid="retirement-entry">
      <div className="px-4 py-3 flex gap-3">
        <PositionBadge>{t(`teamPlayers.positions.${retired.position}`)}</PositionBadge>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <div className="text-[10px] text-[#c9e5c4] uppercase">{t('retirements.retired')}</div>
            <div className="text-[12px] text-white uppercase truncate">
              {retired.name} {age(retired.age)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#c9e5c4] uppercase">
              {t('retirements.replacedBy')}
            </div>
            <div className="text-[12px] text-white uppercase truncate">
              {replacement.name} {age(replacement.age)}
            </div>
          </div>
          {becameCoach && (
            <div className="text-[10px] text-yellow-300 uppercase">
              {t('retirements.becameCoach', { context: coachContext })}
            </div>
          )}
        </div>
      </div>
      <Divider />
    </div>
  );

  return (
    <MainLayout>
      <div className="font-press-start min-h-screen flex flex-col items-center">
        <div className="w-[350px] mx-auto text-center">
          <div className="text-[14px] text-white mt-6 mb-2 tracking-wider uppercase">
            {t('retirements.title')}
          </div>
          <div className="text-[12px] text-white mb-2 uppercase">{report?.season ?? ''}</div>
        </div>

        <div
          className="w-[350px] h-[610px] mx-auto flex flex-col overflow-y-auto"
          style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
        >
          {entries.map(renderEntry)}
        </div>

        <div className="flex justify-center w-[350px] mt-4 mx-auto">
          <button
            className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[15px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition cursor-pointer"
            onClick={handleContinue}
          >
            {t('retirements.continue')}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Retirements;
