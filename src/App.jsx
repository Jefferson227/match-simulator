import "./App.css";
import AppProviders from "./providers/AppProviders";
import MatchSimulator from "./components/MatchSimulator/MatchSimulator";

function App() {
  return (
    <AppProviders>
      <div className="App">
        <MatchSimulator />
      </div>
    </AppProviders>
  );
}

export default App;
