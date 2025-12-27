import React, { useContext, useEffect, useState } from 'react';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import { MatchContext } from '../../contexts/MatchContext';
import sessionService from '../../services/sessionService';
import buildVersionData from '../../assets/build-version.json';
import MainLayout from '../MainLayout/MainLayout';

const InitialScreen: React.FC = () => {
  const { setScreenDisplayed, loadState: loadGeneralState } = useContext(GeneralContext);
  const { loadState: loadChampionshipState } = useChampionshipContext();
  const { loadState: loadMatchState } = useContext(MatchContext);
  const [hasSession, setHasSession] = useState(false);
  const [buildVersion, setBuildVersion] = useState('');

  // Check for existing session and load build version on component mount
  useEffect(() => {
    const sessionExists = sessionService.hasSession();
    setHasSession(sessionExists);

    // Set build version from the imported JSON
    if (buildVersionData && buildVersionData.buildVersion) {
      setBuildVersion(buildVersionData.buildVersion);
    } else {
      setBuildVersion('DEV');
    }
  }, []);

  const handleNewGame = () => {
    // Clear any existing session when starting a new game
    sessionService.clearSession();
    setScreenDisplayed('ChampionshipSelector');
  };

  const handleLoadGame = () => {
    const session = sessionService.loadSession();
    if (session) {
      // Load all states from session
      loadGeneralState(session.general);
      loadChampionshipState(session.championship);
      loadMatchState(session.matches, null); // teamSquadView is not critical for resuming

      // Go directly to TeamManager screen
      setScreenDisplayed('TeamManager');
    }
  };

  // Pixel art data for "WINNING PIXELS"
  const pixelData = {
    W: [
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 0, 1, 1],
    ],
    I: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ],
    N: [
      [1, 0, 0, 1],
      [1, 1, 0, 1],
      [1, 0, 1, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
    ],
    G: [
      [1, 1, 1, 1],
      [1, 0, 0, 0],
      [1, 0, 1, 1],
      [1, 0, 0, 1],
      [1, 1, 1, 1],
    ],
    P: [
      [1, 1, 1, 1],
      [1, 0, 0, 1],
      [1, 1, 1, 1],
      [1, 0, 0, 0],
      [1, 0, 0, 0],
    ],
    X: [
      [1, 0, 0, 1],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [1, 0, 0, 1],
    ],
    E: [
      [1, 1, 1, 1],
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [1, 1, 1, 1],
    ],
    L: [
      [1, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 1, 1],
    ],
    S: [
      [1, 1, 1, 1],
      [1, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 1],
      [1, 1, 1, 1],
    ],
  };

  const PixelLetter: React.FC<{ letter: string }> = ({ letter }) => {
    const pixels = pixelData[letter as keyof typeof pixelData];
    if (!pixels) return null;

    return (
      <div className="grid gap-0.5 mx-1">
        {pixels.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-0.5">
            {row.map((pixel, colIndex) => (
              <div key={colIndex} className={`w-2 h-2 ${pixel ? 'bg-white' : 'bg-transparent'}`} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div
        className="flex flex-wrap justify-center items-center gap-2 max-w-4xl mb-[200px]"
        data-testid="logo-container"
      >
        {/* WINNING */}
        <div className="flex items-end" data-testid="winning-container">
          <PixelLetter letter="W" />
          <PixelLetter letter="I" />
          <PixelLetter letter="N" />
          <PixelLetter letter="N" />
          <PixelLetter letter="I" />
          <PixelLetter letter="N" />
          <PixelLetter letter="G" />
        </div>

        {/* PIXELS */}
        <div className="flex items-end" data-testid="pixels-container">
          <PixelLetter letter="P" />
          <PixelLetter letter="I" />
          <PixelLetter letter="X" />
          <PixelLetter letter="E" />
          <PixelLetter letter="L" />
          <PixelLetter letter="S" />
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-4 px-8">
        <button
          onClick={handleNewGame}
          className="w-full max-w-xs border-4 border-white py-4 text-lg uppercase transition hover:bg-white hover:text-[#3d7a33]"
        >
          New Game
        </button>
        <button
          onClick={handleLoadGame}
          className={`w-full max-w-xs border-4 py-4 text-lg uppercase transition ${
            hasSession
              ? 'border-white hover:bg-white hover:text-[#3d7a33]'
              : 'border-white opacity-50 cursor-not-allowed'
          }`}
          disabled={!hasSession}
        >
          Load Game
        </button>
      </div>

      <div className="mt-16 text-center">
        <p>BUILD VERSION</p>
        <p>{buildVersion}</p>
      </div>
    </MainLayout>
  );
};

export default InitialScreen;
