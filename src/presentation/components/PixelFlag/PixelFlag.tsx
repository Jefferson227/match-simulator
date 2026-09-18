import React from 'react';
import { useTranslation } from 'react-i18next';

export type FlagCountry = 'us' | 'br';

type Palette = Record<string, string>;

interface FlagArt {
  palette: Palette;
  rows: string[];
}

// One character per pixel; each flag is 16x11 pixels, drawn at 2x.
const FLAGS: Record<FlagCountry, FlagArt> = {
  us: {
    palette: { B: '#3c3b6e', w: '#ffffff', R: '#b22234' },
    rows: [
      'BBBBBBBRRRRRRRRR',
      'BwBwBwBwwwwwwwww',
      'BBwBwBBRRRRRRRRR',
      'BwBwBwBwwwwwwwww',
      'BBwBwBBRRRRRRRRR',
      'BBBBBBBwwwwwwwww',
      'RRRRRRRRRRRRRRRR',
      'wwwwwwwwwwwwwwww',
      'RRRRRRRRRRRRRRRR',
      'wwwwwwwwwwwwwwww',
      'RRRRRRRRRRRRRRRR',
    ],
  },
  br: {
    palette: { G: '#009c3b', Y: '#ffdf00', B: '#002776', w: '#ffffff' },
    rows: [
      'GGGGGGGGGGGGGGGG',
      'GGGGGGGYYGGGGGGG',
      'GGGGGYYYYYYGGGGG',
      'GGGGYYBBBBYYGGGG',
      'GGYYYBBBBBBYYYGG',
      'GYYYYwwwwwwYYYYG',
      'GGYYYBBBBBBYYYGG',
      'GGGGYYBBBBYYGGGG',
      'GGGGGYYYYYYGGGGG',
      'GGGGGGGYYGGGGGGG',
      'GGGGGGGGGGGGGGGG',
    ],
  },
};

const PIXEL_SCALE = 2;

interface Run {
  x: number;
  y: number;
  width: number;
  color: string;
}

/** Merges each row's same-coloured neighbours into one rect, so a flag is ~40 rects, not 176. */
function toRuns({ palette, rows }: FlagArt): Run[] {
  return rows.flatMap((row, y) => {
    const runs: Run[] = [];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      const last = runs[runs.length - 1];
      if (last && last.color === color && last.x + last.width === x) {
        last.width++;
      } else {
        runs.push({ x, y, width: 1, color });
      }
    }
    return runs;
  });
}

const PixelFlag: React.FC<{ country: FlagCountry }> = ({ country }) => {
  const { t } = useTranslation();
  const art = FLAGS[country];
  const columns = art.rows[0].length;

  return (
    <svg
      role="img"
      aria-label={t(`pixelFlag.${country}`)}
      data-testid={`pixel-flag-${country}`}
      width={columns * PIXEL_SCALE}
      height={art.rows.length * PIXEL_SCALE}
      viewBox={`0 0 ${columns} ${art.rows.length}`}
      shapeRendering="crispEdges"
      className="inline-block shrink-0"
    >
      {toRuns(art).map((run) => (
        <rect
          key={`${run.x}-${run.y}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          fill={run.color}
        />
      ))}
    </svg>
  );
};

export default PixelFlag;
