type ColorDTO = {
  outline: string;
  background: string;
  name: string;
};

type PlayerDTO = {
  position: string;
  name: string;
};

type TeamJSONDTO = {
  name: string;
  internalName: string;
  shortName: string;
  abbreviation: string;
  colors: ColorDTO;
  initialOverallStrength: number;
  players: PlayerDTO[];
};

export default TeamJSONDTO;
