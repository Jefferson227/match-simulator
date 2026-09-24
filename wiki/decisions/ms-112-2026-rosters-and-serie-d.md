---
title: The seed moves to the 2026 rosters and the 2026 Série D
type: decision
ticket: MS-112
decided: 2026-09-23
status: implemented
asserts:
  - file: scripts/merge-ms112-rosters.mjs
    exists: true
  - file: src/domain/models/Coach.ts
    exists: true
  - file: tests/support/data/serie-d-2026-results.json
    exists: true
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: numberOfTeams
    equals: 96
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: numberOfRelegatableTeams
    equals: 6
  - file: src/infrastructure/data/teams.json
    select: internalName=laguna
    path: name
    equals: Clube Laguna SAF
---

# The seed moves to the 2026 rosters and the 2026 Série D

**Decision.** Both seed files are rebuilt from the 2026 ogol rosters (`ogol-rosters-2026` on
[[sources]]): real names, full squads with real ages and nationalities, and coaches. The men's
pyramid moves to its **2026 membership** in every division, and [[brasileirao-serie-d]] plays REC D
2026 in full: 96 clubs, the Bloco II playoff and 6 promoted. This supersedes
[[ms-106-mens-lower-divisions]] on the season, the club names, Série D's shape and the C/D exchange.
Seven choices shaped it; none of them can be read off the code.

## 1. The input's names and squads win; the seed's keys stay

For every club with an input file, `name`, `shortName`, the whole squad and the coach come from the
rosters. `internalName`, `abbreviation`, `colors` and `initialOverallStrength` are kept.

- **Names and squads come from one source.** The squad, its ages and its nationalities all come
  from the rosters, so taking the club's name from anywhere else would mix sources on one record.
  It also retires the two opposite naming rules MS-102 and MS-106 had adopted (CBF `times` for the
  women, REC Anexo A for the men; [[known-contradictions]] items 3, 8 and 13).
- **Keys stay because everything points at them.** `championships.json`, cup entrants, saved games
  and every test address clubs by `internalName`. A committed slug map in
  `scripts/merge-ms112-rosters.mjs` joins the input to them (`atletico-mineiro` → `atletico-mg`, …);
  only clubs new to the seed take their input slug.
- **Squads are as sourced.** They run from 17 to 53 players, with no trimming and no padding. The
  thinnest, women's `varzea-grande`, has 17 and one goalkeeper, and the data tests set their floor
  there (≥ 11 players, ≥ 1 GK). Twenty-one squads list two different people under one name. That is
  harmless, because nothing keys a player by name.
- **Strength does not follow a club across divisions.** A club promoted or relegated in reality keeps
  the strength MS-102/MS-106 gave it, so neighbouring divisions now overlap and only their averages
  are ordered (see [[invented-data]]). Re-banding every mover would re-invent strengths the seed
  already had.

*Rejected:* re-keying clubs to the input slugs. It would break every reference for no gain.

## 2. Nationalities are ISO 3166-1 alpha-3, with FIFA's home nations

Players carry `nationalities: string[]`, primary first. Coaches carry them only where the source
does (the women's). The codes are **ISO alpha-3** (`BRA`, `ARG`, `COD`, `CIV`), with one deviation:
the UK home nations take their **FIFA codes** (`ENG`, and `SCO`/`WAL`/`NIR` if they appear), because
ISO has only `GBR` and football treats them as separate nations. The merge script **fails on any
country name it cannot map**, so a new spelling in a future input stops the build instead of passing
through as text.

*Rejected:* storing the input's English names ("Congo - Kinshasa", "St. Vincent & Grenadines").
They are display strings in one site's spelling, not identifiers.

## 3. A balanced 6 ↔ 6 between Série C and D, instead of real growth

REC D 2026 promotes 6 (Art. 6º). REC C 2026 relegates only 2 (Art. 42), and CBF says C grows to 24
in 2027 and 28 in 2028 (`news-conselho-serie-c-2026`). Reality balances this by rebuilding Série D
every year from the state championships, which the game has no source for. Played literally, a
closed D would lose 4 clubs a season and its 16 groups of 6 would stop dividing evenly.

**The game relegates 6 from C.** C holds 20 and D holds 96 = 16×6 every season, and
`rolloverSlotting: replace-in-place` keeps swapping like for like: the 6 relegated clubs take the
promoted clubs' group slots. The pyramid suites pin this over three seasons.

*Rejected:*
- **The real counts** (2 down, 6 up). D shrinks and its groups break within a season, and C's growth
  needs a 24- and 28-club format no REC publishes yet.
- **Inventing state champions to refill D.** That is the Série A3 precedent from MS-103, which the
  project has refused every time.

This is invented, not regulation, and it is recorded on [[invented-data]] and
[[promotion-and-relegation]].

## 4. The playoff is played inside the semifinal phase

REC D 2026 lists the Playoffs as a stage of their own. But they are fed by the quarter-finals like
the semifinal, lead nowhere, and are played at the same time. So a knockout phase may declare a
`playoff`: its ties are built from the previous phase's losers (re-ranked as Bloco II, paired 1×4
and 2×3) and played **in the host phase's rounds**, tagged `bracket: 'playoff'`. Their winners are
kept on `Championship.playoffWinnerIds`, and a new `semifinalists-and-playoff-winners` promotion rule
reads them.

This keeps `currentPhaseIndex` linear, adds no round to the season, and leaves "the championship is
over" meaning the final is decided. The mechanics are on [[phases-and-knockouts]].

*Rejected:* a separate phase fed from two phases back. Every phase today is fed by the one before
it, so this would break the linear index that progression, round counting, the UI and saves rely
on, to model a stage that runs in parallel anyway.

Two smaller choices went with it:
- **No `'points'` tiebreaker was added.** Every tie is already decided on points first. The playoff
  declares `['goal-difference', 'seed']`, where `seed` gives a level tie to the better Bloco II rank.
  That is the reading of REC D 2026 Art. 21 §5, which is truncated ([[known-contradictions]] item
  11).
- **Shootouts became opt-in.** A phase that does not list `penalties` never shoots out. That was
  implicit before; the playoff made it matter.

## 5. The clubs in no 2026 division are removed

Twelve men's clubs in the seed play in no 2026 division: `barcelona-de-ilheus`, `boavista`,
`goianesia`, `goiania`, `horizonte`, `itabirito`, `jequie`, `monte-azul`, `penedense`,
`porto-vitoria`, `santa-cruz-rn` and `uniao-araguainense`. They are deleted, not parked, because a
club outside every division is unreachable in a game with no free agency of clubs.

The plan expected 11 orphans and 43 new clubs. Matching by CBF club id found **12 and 44**: the
2026 club **Araguaína Futebol e Regatas** (CBF 21745) is not the seed's **União Atlética
Araguainense** (CBF 20389), which the plan had assumed. The user chose to add Araguaína as new
rather than graft its identity onto União's record.

## 6. The 44 new clubs get researched colours and a record-based strength

New Série D clubs wear their **real colours**, from one cited source each (31 from pt.wikipedia kit
fields, 13 read off CBF crests; table below). This goes beyond MS-106, which gave 53 of its 84
clubs a hashed palette colour. They take a strength in Série D's 43 → 28 band, spread by their 2026
1ª Fase record. Both are recorded on [[invented-data]].

## 7. `free-coaches.json` is deferred

The input also held a Transfermarkt list of 27 unattached coaches (retrieved 2026-09-22). There is no
coach market or hiring flow to put them in, and teams without a coach simply omit the field. Out of
scope; no ticket.

## Left open

- **The coach and the nationalities are data only.** No screen shows them yet.
- **Players still do not age.** Every age is as of the rosters' 2026-09-22 reference date
  ([[player-ages]]).
- **Série D's order within each group is not official.** No CBF document gives it ([[invented-data]]).
- **Séries C and D drift from reality from 2027.** The 6 ↔ 6 is a choice, and REC C 2027 / REC D 2027
  do not exist yet.
- **The running-app check of the playoff screens was waived** at the user's request. The screens
  are covered by component tests only.

## Colour sources (the 44 new clubs)

| Club | Colours | Source |
|---|---|---|
| `abecat-ouvidorense` | orange and black | https://conteudo.cbf.com.br/clubes/63665/escudo.jpg |
| `america-rj` | red and white | https://pt.wikipedia.org/wiki/America_Football_Club_%28Rio_de_Janeiro%29 |
| `araguaina` | red, blue, white | https://pt.wikipedia.org/wiki/Aragua%C3%ADna_Futebol_e_Regatas |
| `atletico-ba` | red, black, white | https://pt.wikipedia.org/wiki/Alagoinhas_Atl%C3%A9tico_Clube |
| `atletico-cearense` | red, black and white | https://pt.wikipedia.org/wiki/Futebol_Clube_Atl%C3%A9tico_Cearense |
| `betim-futebol` | blue, red, white | https://conteudo.cbf.com.br/clubes/34709/escudo.jpg |
| `blumenau` | grená | https://conteudo.cbf.com.br/clubes/63571/escudo.jpg |
| `brasiliense` | yellow, green, white | https://conteudo.cbf.com.br/clubes/62652/escudo.jpg |
| `ceov-operario` | red, white, green | https://pt.wikipedia.org/wiki/Clube_Esportivo_Oper%C3%A1rio_V%C3%A1rzea-Grandense |
| `crac` | light blue | https://pt.wikipedia.org/wiki/Clube_Recreativo_e_Atl%C3%A9tico_Catalano |
| `cse` | green, red, white | https://pt.wikipedia.org/wiki/Clube_Sociedade_Esportiva |
| `decisao` | navy blue and white, "Alviazulino" | https://pt.wikipedia.org/wiki/Decis%C3%A3o_Goiana_Futebol_Clube |
| `democrata-gv` | black and white | https://pt.wikipedia.org/wiki/Esporte_Clube_Democrata |
| `fluminense-pi` | green, grená, white - "Tricolor" | https://pt.wikipedia.org/wiki/Fluminense_Esporte_Clube |
| `galvez-ec` | yellow and dark green, Acre flag | https://pt.wikipedia.org/wiki/Galvez_Esporte_Clube |
| `gama` | green and white | https://pt.wikipedia.org/wiki/Sociedade_Esportiva_do_Gama |
| `guapore` | orange, green, white | https://conteudo.cbf.com.br/clubes/53757/escudo.jpg |
| `iape` | yellow and navy/indigo | https://conteudo.cbf.com.br/clubes/21894/escudo.jpg |
| `inhumas` | grená and white | https://pt.wikipedia.org/wiki/Inhumas_Esporte_Clube |
| `ivinhema` | blue and white, "Azulão do Vale" | https://pt.wikipedia.org/wiki/Ivinhema_Futebol_Clube |
| `jacuipense` | grená and white | https://pt.wikipedia.org/wiki/Esporte_Clube_Jacuipense |
| `laguna` | pink and navy | https://pt.wikipedia.org/wiki/Clube_Laguna_SAF |
| `madureira` | grená, yellow, blue - "Tricolor Suburbano" | https://pt.wikipedia.org/wiki/Madureira_Esporte_Clube |
| `maguary-pe` | blue and white | https://pt.wikipedia.org/wiki/Associa%C3%A7%C3%A3o_Atl%C3%A9tica_Maguary |
| `monte-roraima` | green, yellow, white | https://conteudo.cbf.com.br/clubes/62190/escudo.jpg |
| `moto-club` | red and black | https://conteudo.cbf.com.br/clubes/20029/escudo.jpg |
| `nacional-am` | blue and white | https://pt.wikipedia.org/wiki/Nacional_Futebol_Clube_%28Amazonas%29 |
| `noroeste` | red and white | https://pt.wikipedia.org/wiki/Esporte_Clube_Noroeste |
| `oratorio` | sky blue and white | https://pt.wikipedia.org/wiki/Orat%C3%B3rio_Recreativo_Clube |
| `piaui` | navy blue and red, "Rubro-Anil" | https://conteudo.cbf.com.br/clubes/20111/escudo.jpg |
| `porto-ba` | red and yellow | https://pt.wikipedia.org/wiki/Porto_Sport_Club |
| `portuguesa-rj` | red, green, white - "Rubro-verde" | https://pt.wikipedia.org/wiki/Associa%C3%A7%C3%A3o_Atl%C3%A9tica_Portuguesa_%28Rio_de_Janeiro%29 |
| `primavera-ac` | purple and white | https://pt.wikipedia.org/wiki/Primavera_Atl%C3%A9tico_Clube |
| `real-noroeste` | white and red, "Merengue Capixaba" | https://pt.wikipedia.org/wiki/Real_Noroeste_Capixaba_Futebol_Clube |
| `sampaio-correa-rj` | blue and yellow | https://conteudo.cbf.com.br/clubes/32387/escudo.jpg |
| `santa-catarina` | orange and black | https://pt.wikipedia.org/wiki/Santa_Catarina_Clube |
| `sao-joseense` | navy blue and white | https://conteudo.cbf.com.br/clubes/54488/escudo.jpg |
| `sao-raimundo-rr` | navy blue and white | https://pt.wikipedia.org/wiki/S%C3%A3o_Raimundo_Esporte_Clube_%28Roraima%29 |
| `serra-branca-pb` | navy blue, green, white | https://conteudo.cbf.com.br/clubes/37846/escudo.jpg |
| `tirol` | blue, black, white | https://conteudo.cbf.com.br/clubes/62217/escudo.jpg |
| `uniao-rondonopolis` | red and white | https://pt.wikipedia.org/wiki/Uni%C3%A3o_Esporte_Clube |
| `velo-clube` | red, green, white | https://pt.wikipedia.org/wiki/Associa%C3%A7%C3%A3o_Esportiva_Velo_Clube_Rioclarense |
| `vitoria-es` | blue and white | https://pt.wikipedia.org/wiki/Vit%C3%B3ria_Futebol_Clube_%28Brasil%29 |
| `xv-de-piracicaba` | black and white | https://pt.wikipedia.org/wiki/Esporte_Clube_XV_de_Novembro_%28Piracicaba%29 |
