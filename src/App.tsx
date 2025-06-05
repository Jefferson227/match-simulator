import AppProviders from './providers/AppProviders';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import TeamManager from './components/TeamManager/TeamManager';
import { FC } from 'react';

const App: FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <AppProviders>
        <div className="text-center min-h-screen bg-[#3d7a33]">
          <TeamManager />
        </div>
      </AppProviders>
    </I18nextProvider>
  );
};

export default App;
