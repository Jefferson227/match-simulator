import AppProviders from './providers/AppProviders';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import TeamManager from './components/TeamManager/TeamManager';
import { GeneralContext } from './contexts/GeneralContext';
import { FC, useContext } from 'react';
import MatchSimulator from './components/MatchSimulator/MatchSimulator';

const AppContent: FC = () => {
  const { state } = useContext(GeneralContext);
  return (
    <div className="text-center min-h-screen bg-[#3d7a33]">
      {state.isMatchStarted ? <MatchSimulator /> : <TeamManager />}
    </div>
  );
};

const App: FC = () => (
  <I18nextProvider i18n={i18n}>
    <AppProviders>
      <AppContent />
    </AppProviders>
  </I18nextProvider>
);

export default App;
