import AppProviders from './presentation/providers/AppProviders';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { FC } from 'react';
import InitialScreen from './presentation/pages/InitialScreen/InitialScreen';
import ChampionshipSelector from './presentation/pages/ChampionshipSelector/ChampionshipSelector';
import TeamSelector from './presentation/pages/TeamSelector/TeamSelector';
import { useGameEngine } from './presentation/contexts/GameEngineContext';
import { useGameState } from './services/useGameState';
import TeamManager from './presentation/pages/TeamManager/TeamManager';
import MatchSimulator from './presentation/pages/MatchSimulator/MatchSimulator';
import TeamStandings from './presentation/pages/TeamStandings/TeamStandings';
import TeamAdditionalInfo from './presentation/pages/TeamAdditionalInfo/TeamAdditionalInfo';

const AppContent: FC = () => {
  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  switch (state.currentScreen) {
    case '':
    case 'InitialScreen':
      return <InitialScreen />;
    case 'ChampionshipSelector':
      return <ChampionshipSelector />;
    case 'TeamSelector':
      return <TeamSelector />;
    case 'TeamManager':
      return <TeamManager />;
    case 'MatchSimulator':
      return <MatchSimulator />;
    case 'TeamAdditionalInfo':
      return <TeamAdditionalInfo />;
    case 'TeamStandings':
      return <TeamStandings />;
    default:
      return <InitialScreen />;
  }
};

const App: FC = () => (
  <I18nextProvider i18n={i18n}>
    <AppProviders>
      <AppContent />
    </AppProviders>
  </I18nextProvider>
);

export default App;
