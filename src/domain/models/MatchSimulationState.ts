import PossessionTeam from '../enums/PossessionTeam';
import FieldArea from '../enums/FieldArea';

type MatchSimulationState = {
  hasKickedOff: boolean;
  possessionTeam: PossessionTeam;
  fieldArea: FieldArea;
  shotAttempts: number;
};

export default MatchSimulationState;
