import AppProviders from './providers/AppProviders';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import TeamManager from './components/TeamManager/TeamManager';
import { GeneralContext } from './contexts/GeneralContext';
import { FC, useContext } from 'react';
import MatchSimulator from './components/MatchSimulator/MatchSimulator';
import TeamStandings from './components/TeamStandings/TeamStandings';
import TeamSelector from './components/TeamSelector/TeamSelector';
import InitialScreen from './components/InitialScreen/InitialScreen';

const AppContent: FC = () => {
  const { state } = useContext(GeneralContext);

  if (!state.baseTeam) {
    return null;
  }

  if (state.screenDisplayed === 'InitialScreen') {
    return <InitialScreen />;
  }
  if (state.screenDisplayed === 'TeamManager') {
    return <TeamManager />;
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
