# Campeonato Brasileiro Feminino — 2026

Reference document for the women's national divisions seeded by **MS-102**. Everything here is
transcribed from CBF's official *Regulamento Específico da Competição* (REC) PDFs for the 2026
season, with the article number next to each rule.

**All facts verified 2026-09-05.** 2027 data does not exist on cbf.com.br: the site's year selector
stops at 2026, `/times/.../2027` returns 404, and the `championship-documents` CMS endpoint returns
nothing for 2027. MS-102 seeds 2026 only.

> **Scope note.** MS-102 records these formats and *declares* them in the championship schema
> (`phases`, `promotionRule`, `relegationRule`). It does **not** execute them. Group-stage fixture
> generation, two-legged knockout brackets, per-phase standings resets and semifinalist-based
> promotion are **MS-103**. See [Deliberate simplifications](#deliberate-simplifications-in-ms-102).

## Sources

| Division | internalName | Clubs | competitionId | Club list URL |
|---|---|---|---|---|
| A1 | `brasileirao-feminino-serie-a1` | 18 | `1260614` | `https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/feminino-a1/2026` |
| A2 | `brasileirao-feminino-serie-a2` | 16 | `1260622` | `https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/feminino-a2/2026` |
| A3 | `brasileirao-feminino-serie-a3` | 32 | `1260630` | `https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/feminino-a3/2026` |

- **Registered athletes** (per club, paginated):
  `https://www.cbf.com.br/api/cbf/atletas/campeonato/<competitionId>/clube/<clubId>/pagina/<n>`
  Returns `atleta_nome`, `atleta_apelido`, `clube_nome_completo`, `clube_nome_popular`, `clube_uf`,
  `clube_escudo`. It publishes **no player position** and no strength/colour data of any kind.
- **Regulations (REC PDFs)**, linked from:
  `https://cms.cbf.com.br/api/championship-documents?filters[slug][$eq]=campeonato-brasileiro/feminino-a{1,2,3}/2026`
- **Club crests**: `https://conteudo.cbf.com.br/clubes/<clubId>/escudo.jpg`

CBF confirms there is **no fourth senior women's division** — everything below A3 (Sub-20, Sub-17)
is a youth category.

## Série A1 — 18 clubs

Played in **4 phases** (REC A1 Art. 12):

| Phase | Name | Format |
|---|---|---|
| 1ª Fase | League phase | 18 clubs in **1 group**, **single** round-robin — 17 rounds, 153 matches (Art. 14) |
| 2ª Fase | Quartas-de-Final | 8 clubs in 4 ties, **two legs** (Art. 14) |
| 3ª Fase | Semifinal | 4 clubs in 2 ties, **two legs** (Art. 14) |
| 4ª Fase | Final | 2 clubs in 1 tie, **two legs** (Art. 14) |

- **Every phase restarts at zero points** (Art. 12, parágrafo único).
- **Top 8 of the 1ª Fase advance** (Art. 15).
- **Bracket** (Art. 19): 1º×8º, 2º×7º, 3º×6º, 4º×5º. Semifinal pairings are fixed by bracket group
  (Art. 20); the final is the two semifinal winners (Art. 21).
- **Second-leg hosting**:
  - Quarter-finals — the clubs placed **1st–4th in the 1ª Fase** host the second leg (Art. 19, parágrafo único).
  - Semifinal and final — hosting is decided by **accumulated points across the whole competition**
    (sum of all phases), then wins, goal difference, goals for, fewest red cards, fewest yellow
    cards, draw (Art. 22). The final's stadium is designated by CBF under those same criteria (Art. 23).
- **1ª Fase tiebreakers** (Art. 16): most wins → goal difference → goals for → fewest red cards →
  fewest yellow cards → draw.
- **Knockout tie tiebreakers** (Art. 17): **goal difference over the two legs, then a penalty
  shootout**. There are no away goals and no extra time; the shootout starts within 10 minutes of
  the second leg ending (parágrafo único).
- **Promotion**: none — A1 is the top tier. Art. 5º gives the champion a Supercopa Feminina 2027
  berth; Art. 6º gives the champion and runner-up CONMEBOL Libertadores Feminina 2027 berths.
  Neither is modelled in the game.
- **Relegation**: the **2 last-placed clubs of the 1ª Fase table** drop to A2 2027 (Art. 26).
  Note this is the *1ª Fase* table, not the final classification.
- **Final classification** (Art. 27) is by accumulated points across all phases, with the champion
  and runner-up forced to 1st and 2nd.

## Série A2 — 16 clubs

Played in **4 phases** (REC A2 Art. 11) — structurally identical to A1:

| Phase | Name | Format |
|---|---|---|
| 1ª Fase | League phase | 16 clubs in **1 group**, **single** round-robin — 15 rounds, 120 matches (Art. 13) |
| 2ª Fase | Quartas-de-Final | 8 clubs in 4 ties, **two legs** (Art. 13) |
| 3ª Fase | Semifinal | 4 clubs in 2 ties, **two legs** (Art. 13) |
| 4ª Fase | Final | 2 clubs in 1 tie, **two legs** (Art. 13) |

- **Every phase restarts at zero points** (Art. 11, parágrafo único).
- **Top 8 of the 1ª Fase advance** (Art. 14).
- **Bracket** (Art. 18): 1º×8º, 2º×7º, 3º×6º, 4º×5º; clubs placed **1st–4th host the second leg**
  of the quarter-finals (parágrafo único). Semifinal pairings Art. 19, final Art. 20.
- **Second-leg hosting in the semifinal and final** is by accumulated points across the whole
  competition (Art. 21); the final's stadium is designated by CBF (Art. 22).
- **1ª Fase tiebreakers** (Art. 15) and **knockout tie tiebreakers** (Art. 16) are identical to A1's.
- **Promotion**: the **4 semifinalists** ascend to A1 2027 (Art. 5º). This is *not* a table position
  rule — it is decided by reaching the 3ª Fase.
- **Relegation**: the **2 last-placed clubs of the 1ª Fase table** drop to A3 2027 (Art. 25).

## Série A3 — 32 clubs

Played in **5 phases** (REC A3 Art. 11):

| Phase | Name | Format |
|---|---|---|
| 1ª Fase | Group phase | 32 clubs in **8 groups of 4**, **double** round-robin inside each group — 6 rounds, 12 matches per group, **96 matches total** (Art. 13) |
| 2ª Fase | Oitavas-de-final | 16 clubs in 8 ties, **two legs** (Art. 13) |
| 3ª Fase | Quartas-de-final | 8 clubs in 4 ties, **two legs** (Art. 13) |
| 4ª Fase | Semifinal | 4 clubs in 2 ties, **two legs** (Art. 13) |
| 5ª Fase | Final | 2 clubs in 1 tie, **two legs** (Art. 13) |

- **Every phase restarts at zero points** (Art. 11, parágrafo único).
- **Top 2 of each group advance** — 16 clubs (Art. 14).
- **Groups are drawn by geographic proximity** (Art. 12): groups A1–A4 take clubs from Sul, Sudeste,
  Centro-Oeste and Norte; groups A5–A8 take clubs from Nordeste, Espírito Santo and Norte.
- **Second-leg hosting**:
  - 2ª Fase — the club that **won its 1ª Fase group** hosts the second leg (Art. 18, first sentence).
  - 3ª, 4ª and 5ª Fases — accumulated points across the whole competition, then the same cascade as
    A1/A2 (Art. 18). The final's stadium is designated by CBF (Art. 19).
- **1ª Fase tiebreakers** (Art. 16) and **knockout tie tiebreakers** (Art. 17) match A1/A2:
  goal difference, then penalties.
- **Promotion**: the **4 semifinalists** ascend to A2 2027 (Art. 5º).
- **Relegation**: **none.** REC A3 contains no relegation clause — A3 is the bottom senior tier.

## Recorded inconsistencies in CBF's own regulations

1. **A1 relegates 2 but A2 promotes 4.** REC A1 Art. 26 sends 2 clubs down; REC A2 Art. 5º sends 4
   clubs up. No REC states A1 2027's club count, so the arithmetic implies A1 2027 grows from 18 to
   20 — but CBF never says so. **Recorded as-is; not resolved by inference.** The game's data models
   the two clauses literally.
2. **Competition naming.** REC A1 spells the competition "BRASILEIRÃO FEMININO A1" (with the
   augmentative *-ão*), while REC A2 and REC A3 spell theirs "BRASILEIRO FEMININO A2" / "BRASILEIRO
   FEMININO A3". CBF's own website uses "Brasileirão Feminino" for all three. The seed data uses the
   consistent "Brasileirão Feminino" form.
3. **Club name spellings differ between endpoints.** For roughly 7 A1 clubs, the `times` endpoint's
   `nome_completo` disagrees with REC Anexo A's spelling. **The `times` endpoint is canonical** for
   `name` in `teams-womens.json`.
4. **Squad pagination is lossy.** The athlete API reported 32 registered athletes for one club but
   returned only 29 across its pages. The reachable set is accepted; the remainder is not fabricated
   beyond position padding (see below).
5. **A1's semifinal and final phases are not in CBF's live API** (only phase ids 1994 and 2097
   exist). Their two-legged format comes from REC A1 Arts. 20–21, not from live data.

## Invented data

CBF publishes none of the following, so MS-102 invents them:

- **Player positions.** The athlete API has no position field anywhere — only `goleiro: true/false`
  and `numero_camisa`, and only inside match lineups. Positions target the men's seed distribution
  (~2 GK / 6 DF / 7 MF / 8 FW per squad).
- **Squad padding.** Where a club returns fewer than 18 reachable athletes, the roster is topped up
  with generated Brazilian names so it is playable. Padded entries are listed per club in the
  MS-102 extraction notes (`.plans/MS-102/docs/03-MS-102-extraction-notes.md`, not tracked in git).
- **`initialOverallStrength`, `colors` and `abbreviation`.** Spread so A1 > A2 > A3 with an internal
  gradient inside each division, following the men's seed range.

Player *names* and club *names* are real CBF data.

## Deliberate simplifications in MS-102

MS-102 seeds data and declares formats; the match engine still only knows how to run a flat
round-robin. Consequences:

- **All three divisions carry `"type": "double-round-robin"`** so `ChampionshipService.createMatches`
  produces a valid fixture list and the divisions are immediately playable. The real format lives
  beside it in each entry's `phases` array, unused until MS-103.
- **This makes the simulated seasons wrong on purpose.** A1 plays 34 rounds instead of 17 + knockouts;
  A2 plays 30 instead of 15 + knockouts; **A3 plays 62 rounds / 992 matches** instead of 6 group
  rounds + 4 knockout rounds. The A3 season length is the sharpest consequence and was accepted
  knowingly — the alternative considered was hiding A3 from the selector until MS-103.
- **Promotion and relegation run off table position** regardless of `promotionRule`. A2 and A3
  declare `promotionRule: "semifinalists"`, but with no knockout phases there are no semifinalists,
  so the engine promotes the top 4 of the table instead.
- **`relegationRule: "first-phase-table-position"`** is likewise declared but not honoured — with a
  single flat phase, the 1ª Fase table *is* the final table, so the two coincide today. They diverge
  once MS-103 adds knockouts.

## Cups

Extracted 2026-09-05. **Neither cup is seeded by MS-102** — this section is the spec, and the JSON
entries plus the model work they need are deferred to MS-103/MS-104.

### Why neither fits the `Championship` model

Both are pure knockouts. `Championship` assumes a league: it carries `numberOfTeams`, a `standings`
array built once from the team list, and a `matchContainer` of numbered rounds that
`ChampionshipService.createMatches` fills by round-robin rotation. A cup has no table to stand in
`standings`, its bracket shrinks each round instead of repeating a fixed fixture list, and the Copa
starts with **two participants still undecided**, which nothing in the current model can express.
The `phases` descriptor added by MS-102 covers the knockout *shape*, but a cup would also need the
league scaffolding to become optional.

### Copa do Brasil Feminino 2026

| | |
|---|---|
| Official name | Copa do Brasil — Feminino |
| Slug | `copa-do-brasil/feminino/2026` |
| competitionId | `1260632` (championshipId `24`, categoryId `55`) |
| Entry slots | **68** — 66 named clubs and 2 still listed as "A Definir" |
| Format | Straight knockout; every phase is `fase_tipo: eliminacao` |

Phases, exactly as CBF's own competition data reports them:

| Phase | fase_id | Legs | Matches per tie |
|---|---|---|---|
| PRELIMINAR | 2033 | 1 | 1 |
| 1ª Fase | 2034 | 1 | 1 |
| 2ª Fase | 2055 | 1 | 1 |
| 3ª Fase | 2060 | 1 | 1 |
| 4ª Fase | 2069 | 1 | 1 |
| 5ª Fase | 2077 | **2** | **2** |

Source: `https://www.cbf.com.br/futebol-brasileiro/tabelas/copa-do-brasil/feminino/2026` and its
per-phase pages (`.../2026/<fase_id>`).

**Participants.** The 66 named entrants are **exactly the 66 clubs seeded by MS-102** — all 18 of
A1, all 16 of A2 and all 32 of A3, with no club from outside the three divisions. Seeding the Copa
therefore needs no new team data, only bracket support.

| Club | UF | Division |
|---|---|---|
| América | MG | A1 |
| Atlético Mineiro | MG | A1 |
| Bahia | BA | A1 |
| Botafogo | RJ | A1 |
| Corinthians | SP | A1 |
| Cruzeiro | MG | A1 |
| Ferroviária | SP | A1 |
| Flamengo | RJ | A1 |
| Fluminense | RJ | A1 |
| Grêmio | RS | A1 |
| Internacional | RS | A1 |
| Juventude | RS | A1 |
| Mixto | MT | A1 |
| Palmeiras | SP | A1 |
| Red Bull Bragantino | SP | A1 |
| Santos FC | SP | A1 |
| São Paulo | SP | A1 |
| Vitória | BA | A1 |
| Associação Desportiva Taubaté | SP | A2 |
| Atletico Rio Negro Clube | RR | A2 |
| Ação | MT | A2 |
| CAP | PI | A2 |
| Ceará | CE | A2 |
| Doce Mel | BA | A2 |
| Instituto 3b | AM | A2 |
| Itabirito Saf | MG | A2 |
| Itacoatiara Futebol Clube | AM | A2 |
| Minas Brasília | DF | A2 |
| Paysandu | PA | A2 |
| Pérolas Negras | RJ | A2 |
| Sport Recife | PE | A2 |
| Uda | AL | A2 |
| Vasco da Gama Saf | RJ | A2 |
| Vila Nova | GO | A2 |
| Araguari A.c. | MG | A3 |
| Atlético de Alagoinhas | BA | A3 |
| Brasil de Farroupilha | RS | A3 |
| Coritiba SAF | PR | A3 |
| Cresspom | DF | A3 |
| Criciúma | SC | A3 |
| Desportiva Itapuense | RO | A3 |
| Galvez | AC | A3 |
| Guarani de Paripueira | AL | A3 |
| Heips | RJ | A3 |
| Ipojuca | PE | A3 |
| Juventude | SE | A3 |
| Liga Sanjoanense | PI | A3 |
| Mauaense | SP | A3 |
| Mixto | PB | A3 |
| Pantanal SAF | MS | A3 |
| Paraíso Esporte Clube | TO | A3 |
| Penarol | AM | A3 |
| Planalto Esporte Clube | GO | A3 |
| Portuguesa | AP | A3 |
| Prosperidade F. C. | ES | A3 |
| R4 | CE | A3 |
| Realidade Jovem | SP | A3 |
| Remo | PA | A3 |
| Rolim de Moura | RO | A3 |
| Sampaio Corrêa | MA | A3 |
| São Jose Esporte Clube Saf | SP | A3 |
| São Raimundo | RR | A3 |
| Tiradentes | PA | A3 |
| União | RN | A3 |
| Várzea Grande | MT | A3 |
| Ypiranga Clube | AP | A3 |

Plus 2 unresolved "A Definir" slots (club ids 53397 and 58916).

**Open gaps.** Two things could not be established on 2026-09-05:

- **Qualification criteria.** How a club earns its Copa place is defined in the competition's REC,
  and the CMS endpoint that serves REC PDFs
  (`https://cms.cbf.com.br/api/championship-documents?filters[slug][$eq]=...`) returned an empty
  body for every slug tried, **including the known-good `campeonato-brasileiro/feminino-a1/2026`**
  that worked earlier in MS-102. The endpoint is down or has changed, not the slug. Retry before
  MS-103 starts.
- **Bracket arithmetic.** Six phases do not divide 68 entrants cleanly, and the 5ª Fase is the last
  phase CBF lists. Either later phases are published only as the competition reaches them, or the
  preliminary round feeds a bracket narrower than 64. Do not infer the missing rounds — read them
  off the REC once the CMS endpoint is serving again.

### Supercopa do Brasil Feminino 2026

| | |
|---|---|
| Official name | Supercopa do Brasil — Feminino |
| Slug | `supercopa-do-brasil/feminino/2026` |
| competitionId | `1260617` |
| Clubs | **2** — Corinthians (SP) and Palmeiras (SP) |
| Format | **A single match.** No two legs, no table |

Qualification is the one cup rule that *is* citable: REC A1 **Art. 5º** defines the Supercopa as a
one-off match (*"em jogo único"*) between the previous season's Copa do Brasil Feminina champion and
Brasileirão Feminino A1 champion. Its parágrafo único covers the overlap: if one club won both, the
A1 runner-up takes the second slot.

Modelling the Supercopa is nearly free once knockouts exist — it is one tie of one leg between two
clubs the game already has. It is the natural first cup to implement.
