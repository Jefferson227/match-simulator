import React, { useContext } from 'react';
import { GeneralContext } from '../../contexts/GeneralContext';

const InitialScreen: React.FC = () => {
  const { setScreenDisplayed } = useContext(GeneralContext);

  const handleNewGame = () => {
    setScreenDisplayed('TeamManager');
  };

  return (
    <div
      className="font-press-start min-h-screen flex flex-col justify-between items-center py-16"
      style={{ backgroundColor: '#3d7a33', color: 'white' }}
    >
      <div className="flex-grow flex items-center justify-center">
        <h1 className="text-2xl">&lt;LOGO HERE&gt;</h1>
      </div>

      <div className="w-full flex flex-col items-center gap-4 px-8">
        <button
          onClick={handleNewGame}
          className="w-full max-w-xs border-4 border-white py-4 text-lg uppercase transition hover:bg-white hover:text-[#3d7a33]"
        >
          New Game
        </button>
        <button className="w-full max-w-xs border-4 border-white py-4 text-lg uppercase transition hover:bg-white hover:text-[#3d7a33]">
          Load Game
        </button>
      </div>

      <div className="mt-16 text-center">
        <p>DEVELOPED BY</p>
        <p>JEFFERSON227</p>
      </div>
    </div>
  );
};

export default InitialScreen;
