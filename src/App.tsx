import AppProviders from './providers/AppProviders';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { FC } from 'react';
import InitialScreen from './pages/InitialScreen/InitialScreen';
import ChampionshipSelector from './pages/ChampionshipSelector/ChampionshipSelector';
import TeamSelector from './pages/TeamSelector/TeamSelector';
import { useGameEngine } from './contexts/GameEngineContext';
import { useGameState } from './services/useGameState';
import TeamManager from './pages/TeamManager/TeamManager';

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
    default:
      return <InitialScreen />;
  }

  // if (state.screenDisplayed === 'InitialScreen') {
  //   return <InitialScreen />;
  // }
  // if (state.screenDisplayed === 'ChampionshipSelector') {
  //   return <ChampionshipSelector />;
  // }
  // if (state.screenDisplayed === 'TeamManager') {
  //   return <TeamManager />;
  // }
  // if (state.screenDisplayed === 'MatchSimulator') {
  //   return <MatchSimulator />;
  // }
  // if (state.screenDisplayed === 'TeamAdditionalInfo') {
  //   return <TeamAdditionalInfo />;
  // }
  // if (state.screenDisplayed === 'ChampionshipDetails') {
  //   return <ChampionshipDetails />;
  // }
  // if (state.screenDisplayed === 'TeamStandings') {
  //   return <TeamStandings />;
  // }
  // if (state.screenDisplayed === 'TeamSelector') {
  //   return <TeamSelector />;
  // }
  // if (state.screenDisplayed === 'TeamViewer') {
  //   return <TeamViewer />;
  // }
  // if (state.screenDisplayed === 'ErrorScreen') {
  //   return <ErrorScreen />;
  // }
};

const App: FC = () => (
  <I18nextProvider i18n={i18n}>
    <AppProviders>
      <AppContent />
    </AppProviders>
  </I18nextProvider>
);

export default App;
