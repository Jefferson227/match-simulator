import TeamColors from '../../../domain/models/TeamColors';

/**
 * Sample data for the end-of-season page. It is hand-written placeholder content: nothing here comes
 * from the engine yet, and the whole file goes away once `SeasonSummary` reads a real `GameState`.
 */

export interface SeasonSummaryTeam {
  shortName: string;
  abbreviation: string;
  colors: TeamColors;
}

export interface SeasonSummaryDivision {
  divisionName: string;
  champion: SeasonSummaryTeam;
  runnerUp: SeasonSummaryTeam;
  otherPromotedTeams: SeasonSummaryTeam[];
  relegatedTeams: SeasonSummaryTeam[];
}

export interface SeasonSummary {
  season: number;
  championshipName: string;
  divisions: SeasonSummaryDivision[];
}

const teams: Record<string, SeasonSummaryTeam> = {
  palmeiras: {
    shortName: 'Palmeiras',
    abbreviation: 'PAL',
    colors: { outline: '#FAFAFC', background: '#076638', text: '#FAFAFC' },
  },
  flamengo: {
    shortName: 'Flamengo',
    abbreviation: 'FLA',
    colors: { outline: '#EC2125', background: '#030101', text: '#FAFAFC' },
  },
  atleticoMG: {
    shortName: 'Atlético-MG',
    abbreviation: 'CAM',
    colors: { outline: '#FAFAFC', background: '#242021', text: '#FAFAFC' },
  },
  botafogo: {
    shortName: 'Botafogo',
    abbreviation: 'BOT',
    colors: { outline: '#FAFAFC', background: '#242021', text: '#FAFAFC' },
  },
  coritiba: {
    shortName: 'Coritiba',
    abbreviation: 'CFC',
    colors: { outline: '#fafafc', background: '#09554f', text: '#fafafc' },
  },
  athleticoPR: {
    shortName: 'Athletico-PR',
    abbreviation: 'CAP',
    colors: { outline: '#E30613', background: '#000000', text: '#FFFFFF' },
  },
  novorizontino: {
    shortName: 'Novorizontino',
    abbreviation: 'NOV',
    colors: { outline: '#fcf206', background: '#1f1f1f', text: '#fafafc' },
  },
  goias: {
    shortName: 'Goiás',
    abbreviation: 'GOI',
    colors: { outline: '#fafafc', background: '#00685b', text: '#fafafc' },
  },
  pontePreta: {
    shortName: 'Ponte Preta',
    abbreviation: 'PON',
    colors: { outline: '#ffffff', background: '#000000', text: '#ffffff' },
  },
  guarani: {
    shortName: 'Guarani',
    abbreviation: 'GUA',
    colors: { outline: '#ffffff', background: '#006437', text: '#ffffff' },
  },
  brusque: {
    shortName: 'Brusque',
    abbreviation: 'BRU',
    colors: { outline: '#f5f5f4', background: '#14532d', text: '#f5f5f4' },
  },
  saoBernardo: {
    shortName: 'São Bernardo',
    abbreviation: 'SBE',
    colors: { outline: '#000000', background: '#ffd100', text: '#000000' },
  },
  nautico: {
    shortName: 'Náutico',
    abbreviation: 'NAU',
    colors: { outline: '#ffffff', background: '#d71920', text: '#ffffff' },
  },
  itabaiana: {
    shortName: 'Itabaiana',
    abbreviation: 'ITA',
    colors: { outline: '#ffffff', background: '#ea580c', text: '#ffffff' },
  },
  barra: {
    shortName: 'Barra',
    abbreviation: 'BRR',
    colors: { outline: '#fde047', background: '#991b1b', text: '#fde047' },
  },
  maringa: {
    shortName: 'Maringá',
    abbreviation: 'MAR',
    colors: { outline: '#ffffff', background: '#1d4ed8', text: '#ffffff' },
  },
  vitoria: {
    shortName: 'Vitória',
    abbreviation: 'VIT',
    colors: { outline: '#a82123', background: '#242021', text: '#a82123' },
  },
  fortaleza: {
    shortName: 'Fortaleza',
    abbreviation: 'FOR',
    colors: { outline: '#f42b08', background: '#0161aa', text: '#FAFAFC' },
  },
  juventude: {
    shortName: 'Juventude',
    abbreviation: 'JUV',
    colors: { outline: '#FAFAFC', background: '#079247', text: '#FAFAFC' },
  },
  sport: {
    shortName: 'Sport',
    abbreviation: 'SPT',
    colors: { outline: '#b6881f', background: '#242021', text: '#a82123' },
  },
  paysandu: {
    shortName: 'Paysandu',
    abbreviation: 'PAY',
    colors: { outline: '#fafafc', background: '#3885c6', text: '#fafafc' },
  },
  voltaRedonda: {
    shortName: 'Volta Redonda',
    abbreviation: 'VRE',
    colors: { outline: '#fafafc', background: '#1f1f1f', text: '#f8de05' },
  },
  botafogoSP: {
    shortName: 'Botafogo-SP',
    abbreviation: 'BSP',
    colors: { outline: '#ed2f26', background: '#fafafc', text: '#1f1f1f' },
  },
  amazonas: {
    shortName: 'Amazonas',
    abbreviation: 'AMA',
    colors: { outline: '#fbab2c', background: '#05030e', text: '#fbab2c' },
  },
  ypiranga: {
    shortName: 'Ypiranga',
    abbreviation: 'YPI',
    colors: { outline: '#007a33', background: '#ffd100', text: '#007a33' },
  },
  confianca: {
    shortName: 'Confiança',
    abbreviation: 'CON',
    colors: { outline: '#ffffff', background: '#1f4fa3', text: '#ffffff' },
  },
  tombense: {
    shortName: 'Tombense',
    abbreviation: 'TOM',
    colors: { outline: '#ffffff', background: '#0f766e', text: '#ffffff' },
  },
  figueirense: {
    shortName: 'Figueirense',
    abbreviation: 'FIG',
    colors: { outline: '#6d6e71', background: '#000000', text: '#ffffff' },
  },
};

// Série A promotes nobody — it is the top division — and Série D relegates nobody, since there is no
// division under it. Both cases leave the list empty and the page says so. Everywhere else matches
// the real Brasileirão: four clubs go up (champion, runner-up and two more) and four go down.
const sampleSeasonSummary: SeasonSummary = {
  season: 2026,
  championshipName: 'Brasileirão',
  divisions: [
    {
      divisionName: 'Série A',
      champion: teams.palmeiras,
      runnerUp: teams.flamengo,
      otherPromotedTeams: [],
      relegatedTeams: [teams.vitoria, teams.fortaleza, teams.juventude, teams.sport],
    },
    {
      divisionName: 'Série B',
      champion: teams.coritiba,
      runnerUp: teams.athleticoPR,
      otherPromotedTeams: [teams.novorizontino, teams.goias],
      relegatedTeams: [teams.paysandu, teams.voltaRedonda, teams.botafogoSP, teams.amazonas],
    },
    {
      divisionName: 'Série C',
      champion: teams.pontePreta,
      runnerUp: teams.guarani,
      otherPromotedTeams: [teams.brusque, teams.saoBernardo],
      relegatedTeams: [teams.ypiranga, teams.confianca, teams.tombense, teams.figueirense],
    },
    {
      divisionName: 'Série D',
      champion: teams.nautico,
      runnerUp: teams.itabaiana,
      otherPromotedTeams: [teams.barra, teams.maringa],
      relegatedTeams: [],
    },
  ],
};

export default sampleSeasonSummary;
