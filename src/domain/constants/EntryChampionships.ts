import type LeagueType from '../enums/LeagueType';

/** The division every new game starts in, per league type: the bottom of each pyramid. */
export const ENTRY_CHAMPIONSHIP_BY_LEAGUE_TYPE: Record<LeagueType, string> = {
  mens: 'brasileirao-serie-d',
  womens: 'brasileirao-feminino-serie-a3',
};
