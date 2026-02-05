import React, { useEffect, useState } from 'react';
import buildVersionData from '../../assets/build-version.json';
import { useGameEngine } from '../../contexts/GameEngineContext';
import MainLayout from '../../components/MainLayout/MainLayout';
import PixelLetter from '../../components/PixelLetter';

const InitialScreen: React.FC = () => {
  const [buildVersion, setBuildVersion] = useState('');
  const engine = useGameEngine();

  useEffect(() => {
    if (buildVersionData && buildVersionData.buildVersion) {
      setBuildVersion(buildVersionData.buildVersion);
    } else {
      setBuildVersion('DEV');
    }
  }, []);

  return (
    <MainLayout>
      <div
        className="font-press-start min-h-screen flex flex-col justify-between items-center py-16"
        style={{ backgroundColor: '#3d7a33', color: 'white' }}
      >
        <div className="flex-grow flex items-center justify-center">
          <div
            className="flex flex-wrap justify-center items-center gap-2 max-w-4xl"
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
        </div>

        <div className="w-full flex flex-col items-center gap-4 px-8">
          <button
            onClick={() =>
              engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'ChampionshipSelector' })
            }
            className="w-full max-w-xs border-4 border-white py-4 text-lg uppercase transition hover:bg-white hover:text-[#3d7a33]"
          >
            New Game
          </button>

          <button
            onClick={() => engine.dispatch({ type: 'PING' })}
            className={`w-full max-w-xs border-4 py-4 text-lg uppercase transition border-white hover:bg-white hover:text-[#3d7a33]`}
          >
            Test Game Engine
          </button>
        </div>

        <div className="mt-16 text-center">
          <p>BUILD VERSION</p>
          <p>{buildVersion}</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default InitialScreen;
