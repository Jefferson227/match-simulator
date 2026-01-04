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
- games
- type (double-round-robin, single-round-robin, mixed)

### Team

- id
- fullName
- shortName
- abbreviation
- colors (outline, background, text)
- players
- morale
- starters (to be used separately by composition)
- subs (to be used separately by composition)
- isControlledByHuman

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
- isStarter (can be used instead of the 'starters' array in the Team)
- isSub (can be used instead of the 'subs' array in the Team)

### GeneralConfig

- timerSpeed
- currentChampionship
- currentHumanTeamPlayerId

## Identify use cases entities for each entity

### ChampionshipUseCases

- initChampionship(internalName)
- setHumanPlayerTeam(team, championship)
- createGameList(championship)
- startMatches(championship)
- updateRanking(championship)
- getRanking(championship)

### TeamUseCases

- setStarter(player, team)
- removeStarter(playerId, team)
- setSub(player, team)
- removeSub(playerId, team)
- setFormation(formation, team)

### MatchUseCases

### PlayerUseCases

### GeneralConfigUseCases
