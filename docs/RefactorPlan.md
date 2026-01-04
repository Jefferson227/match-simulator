# Refactor Plan

## Identify layers

- core, infra, use-cases, UI (src)

## Identify main entities

### Championship

- name
- internalName
- numberOfTeams
- numberOfPromotedTeams (to be used separately by composition)
- promotionChampionship (to be used separately by composition)
- numberOfRelegatedTeams (to be used separately by composition)
- relegationChampionship (to be used separately by composition)
- startingTeams
- ranking
- matches
- type (double-round-robin, single-round-robin, mixed)
- hasTeamControlledByHuman

### Ranking

- team
- position
- wins
- draws
- losses
- goalsFor
- goalsAgainst
- points

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

### MatchContainer

- timer
- currentSeason (year)
- currentRound
- totalRounds
- matches

### Match

- id
- homeTeam
- awayTeam
- scorers

### Scorers

- player
- scorerTeam (home or away)
- time

### Player

- id
- position
- name
- strength
- isStarter (can be used instead of the 'starters' array in the Team)
- isSub (can be used instead of the 'subs' array in the Team)

### GeneralConfig

- timerSpeed
- playableChampionship
- humanTeamPlayerId

## Identify use cases entities for each entity

### ChampionshipUseCases

- initChampionships(internalName)
- setHumanPlayerTeam(team, championship)
- setMatches(championship)
- startMatches(championship)
- updateRanking(championship)
- getRanking(championship)
- promoteRelegateTeams(championship)

### TeamUseCases

- setStarter(player, team)
- removeStarter(playerId, team)
- setSub(player, team)
- removeSub(playerId, team)
- setFormation(formation, team)

### MatchUseCases

- resetTimer(matchContainer)
- runMatchActions(matchContainer)

### PlayerUseCases

- N/A (for now)

### GeneralConfigUseCases

- toggleTimerSpeed(generalConfig)
- setPlayableChampionship(championshipInternalName)
- setHumanTeamPlayerId(teamId)
- saveGame(championships, generalConfig)
