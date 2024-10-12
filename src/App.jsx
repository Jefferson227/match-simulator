import './App.css';
import AppProviders from './providers/AppProviders';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import MatchSimulator from './components/MatchSimulator/MatchSimulator';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AppProviders>
        <div className="App">
          <MatchSimulator />
        </div>
      </AppProviders>
    </I18nextProvider>
  );
}

export default App;
