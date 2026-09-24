---
title: Player ages
type: concept
verified: 2026-09-23
sources: [ogol-rosters-2026, atletas-api, jogos-api]
---

# Player ages

Every player in both seed files carries an `age`, which [[player-stamina]] needs to pick a decay
rate. MS-111 added the field with **generated** ages, because no scriptable source published real
ones. Since MS-112 the ages are **real**: they come with the 2026 squads the seed was rebuilt from.
This page records where they come from, and why earlier attempts failed, so nobody repeats them.

## Where the ages come from now

The 2026 rosters from **ogol.com.br** (`ogol-rosters-2026` on [[sources]]): one file per club for
all 222 clubs of both seed files, with name, position, age and nationalities for 6,558 players.
They were collected outside the repository and handed to MS-112 as input. `scripts/merge-ms112-rosters.mjs`
copies each age as-is.

- **Reference date: 2026-09-22.** An age is only true relative to a date. The team files carry no
  retrieval date of their own; 2026-09-22 is the date of the files, and of the `retrievedAt` on
  the Transfermarkt coach list collected with them. Every age in the seed is as of that date.
- **The seed still does not age.** Season-to-season ageing is not implemented, so a save started
  in any later season plays with the 2026-09-22 ages.
- **The squads are the ones the ages belong to.** Unlike MS-111, which aged the MS-106 lineups, the
  whole roster was replaced from the same source, so there is no name-matching step to get wrong.
- **MS-111's generator is retired.** `scripts/seed-player-ages.mjs` was deleted by MS-112.

## Why CBF could not supply them (MS-111)

Four scripted sources were tried in MS-111. All four failed, for different reasons.

**CBF publishes no birth date anywhere.** Neither endpoint in [[cbf-data-sources]] carries one:
not a date of birth, not an age, not any date field about a person.

- athlete API → `atleta_nome`, `atleta_apelido`, `clube_nome_completo`, `clube_nome_popular`,
  `clube_uf`, `clube_escudo`
- match API, per athlete → `id`, `nome`, `apelido`, `numero_camisa`, `reserva`, `entrou_jogando`,
  `goleiro`, `foto`

**Wikidata covers 3% of the seed.** Club-scoped SPARQL over 8 sample clubs matched 6 of 182
players. Three causes, each fatal on its own:

- The women's seed matches nothing (0 of 92): Wikidata's club item is the men's club.
- Lower-division men's clubs are barely modelled.
- Coverage is historical (ABC's 227 players are mostly from the 1980s to the 2000s).

**Matching on name alone is worse than no data.** An unscoped label search aged two ABC starters to
49 and 53 by colliding with other footballers sharing their apelido. It was rejected outright.

**ogol and Transfermarkt refuse scripted access.** `ogol.com.br` and `zerozero.pt` answer **403**
(Cloudflare); `transfermarkt.com.br` answers **202** with a bot-challenge stub. These are JS
challenges, so full browser headers change nothing. MS-111 noted that a real browser was the one
untried route. The MS-112 input is that route: the rosters were collected from ogol outside the
repository, not by a script in it.

## History: the generated ages (MS-111 → MS-112)

From MS-111 until MS-112, every age was a pure function of `internalName|name|position` (FNV-1a
shaped by a triangular distribution per position, e.g. GK 19–41 peaking at 28). The ages were
deterministic but invented, and had no reference date. The spread over the 4,270 players of that
seed populated every stamina band. That is no longer a design goal: the real distribution now
decides it.
