import React, { useContext } from 'react';
import { GeneralContext } from '../../contexts/GeneralContext';

const InitialScreen: React.FC = () => {
  const { setScreenDisplayed } = useContext(GeneralContext);

  const handleNewGame = () => {
    setScreenDisplayed('ChampionshipSelector');
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
              <div
                key={colIndex}
                className={`w-2 h-2 ${pixel ? 'bg-white' : 'bg-transparent'}`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
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
          onClick={handleNewGame}
          className="w-full max-w-xs border-4 border-white py-4 text-lg uppercase transition hover:bg-white hover:text-[#3d7a33]"
        >
          New Game
        </button>
        <button
          className="w-full max-w-xs border-4 border-white py-4 text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] opacity-50"
          disabled
        >
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
