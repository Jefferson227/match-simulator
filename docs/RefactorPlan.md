# Refactor Plan

## Identify layers

- core, infra, use-cases, UI (src)

## Identify main entities

### Championship

- id
- name
- internalName
- numberOfTeams
- numberOfPromotedTeams (to be used separately by composition)
- promotionChampionship (to be used separately by composition)
- numberOfRelegatedTeams (to be used separately by composition)
- relegationChampionship (to be used separately by composition)
- startingTeams
- ranking
- matchCalendar

### Team

- id
- fullName
- shortName
- abbreviation
- colors (outline, background, text)
- list of players
- morale
- starters (to be used separately by composition)
- subs (to be used separately by composition)

### Match

- id
- timer
- currentSeason (year)
- currentRound
- totalRounds
- homeTeam
- awayTeam
- scorers

### Player

- id
- position
- name
- strength

### GameConfig

- timerSpeed

## Identify use cases entities for each entity

### ChampionshipUseCases

- startMatches(championship)
- createMatchCalendar(championship)
- selectHumanPlayerTeam(team, championship)
- updateRanking(championship)
- getRanking(championship)

### TeamUseCases

### MatchUseCases

### PlayerUseCases

### GameConfigUseCases
