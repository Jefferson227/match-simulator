type ColorDTO = {
  outline: string;
  background: string;
  name: string;
};

type PlayerDTO = {
  position: string;
  name: string;
  age: number;
  nationalities: string[];
};

type CoachDTO = {
  name: string;
  age: number;
  nationalities?: string[];
};

type TeamJSONDTO = {
  name: string;
  internalName: string;
  shortName: string;
  abbreviation: string;
  colors: ColorDTO;
  initialOverallStrength: number;
  players: PlayerDTO[];
  coach?: CoachDTO;
};

export default TeamJSONDTO;
