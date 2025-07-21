import AppProviders from './providers/AppProviders';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import TeamManager from './features/team/components/TeamManager';
import { GeneralContext } from './contexts/GeneralContext';
import { FC, useContext } from 'react';
import { MatchSimulator } from './features/match';
import TeamStandings from './features/standings/components/TeamStandings';
import TeamSelector from './features/team/components/TeamSelector';
import InitialScreen from './shared/components/InitialScreen';
import { ChampionshipSelector } from './features/championship';

const AppContent: FC = () => {
  const { state } = useContext(GeneralContext);

  if (!state.baseTeam) {
    return null;
  }

  if (state.screenDisplayed === 'InitialScreen') {
    return <InitialScreen />;
  }
  if (state.screenDisplayed === 'ChampionshipSelector') {
    return <ChampionshipSelector />;
  }
  if (state.screenDisplayed === 'TeamManager') {
    return <TeamManager team={state.baseTeam} />;
  }
  if (state.screenDisplayed === 'MatchSimulator') {
    return <MatchSimulator />;
  }
  if (state.screenDisplayed === 'TeamStandings') {
    return <TeamStandings />;
  }
  if (state.screenDisplayed === 'TeamSelector') {
    return <TeamSelector />;
  }

  return null;
};

const App: FC = () => (
  <I18nextProvider i18n={i18n}>
    <AppProviders>
      <AppContent />
    </AppProviders>
  </I18nextProvider>
);

export default App;
