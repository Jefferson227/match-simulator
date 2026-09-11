---
title: Invented data
type: concept
verified: 2026-09-10
sources: [atletas-api, rec-a3-2026, rec-copa-2026, jogos-api, rec-serie-c-2025, rec-serie-d-2025, rec-serie-c-2026, rec-serie-d-2026]
---

# Invented data

CBF publishes none of the following, so MS-102 invents them. Everything on this page is **not
evidence** — it is a deliberate fabrication needed to make the game playable, recorded here so no
future pass mistakes it for CBF data.

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

Why CBF publishes no positions and why squads come back short is on [[cbf-data-sources]].

## Invented by MS-103

Two bracket rules the RECs do not fully specify. Neither is fabricated *data* — both are
deterministic substitutions for a draw the game cannot perform — but both are inventions and are
recorded here for the same reason.

- **Série A3's groups are split in seed order.** REC A3 Art. 12 draws the eight groups by
  **geographic proximity** (A1–A4 from Sul, Sudeste, Centro-Oeste and Norte; A5–A8 from Nordeste,
  Espírito Santo and Norte). The seed carries no geography — `teams-womens.json` has no UF field —
  so the field is dealt into groups in the order `teamNames` declares. Deterministic, and wrong
  against the regulation.
- **Série A3's round of 16 crosses neighbouring groups.** REC A3 Art. 14 states only that the top two
  of each group advance; it does not give the cross. The game pairs the winner of group *g* with the
  runner-up of its partner group and vice versa, which guarantees that no tie repeats a group-stage
  fixture and that every tie holds exactly one group winner — the precondition `group-winner` hosting
  needs (Art. 18). The regulation may cross them differently.

Both live in `src/domain/features/fixture-generation/`. See [[phases-and-knockouts]].

**A third thing MS-103 chose not to invent.** A3 loses 2 clubs a season, because CBF re-composes it
each year from 27 state champions plus relegated clubs (REC A3 2026 Art. 2º) and the game has no
source for state champions. Generating clubs to keep it at 32 was rejected; its outflow is capped
instead so it cannot fall below a playable field. See [[ms-103-a1-club-count-growth]].

## Invented by MS-104

**The whole post-2026 schedule of the women's pyramid.** CBF has published no regulation for any
season after 2026, so every row below the first is inference, invented for playability. It is not a
claim about the real competition.

| Season | A1 clubs | A2 clubs | A3 clubs |
|---|---|---|---|
| 2026 | 18 | 16 | 32 |
| 2027 | 20 | 16 | 30 |
| 2028 | 20 | 18 | 28 |
| 2029+ | 20 | 20 | 26 |

- **A3's reduced format.** Once its field falls below 32 the division is played in **4 groups over a
  single leg**, 2 advancing per group, feeding a Quartas rather than an Oitavas. No REC describes
  this shape. Group sizes come out as 8/8/7/7 at 30 clubs, 7×4 at 28 and 7/7/6/6 at 26, from the
  same seed-order split already recorded above. The single leg is a deliberate choice: two legs
  would take 12–14 rounds against the regulation shape's 6.
- **The counts themselves are not invented data so much as consequences.** Nothing in the seed
  states a club count for 2027; each one falls out of the exchange rules MS-103 seeded. What is
  invented is the *rules staying as they are* for seasons CBF has not regulated.

The arithmetic, the rejected alternatives and the reasoning behind selecting by club count rather
than by year are on [[ms-104-a3-group-shape-schedule]].

## Invented by MS-106

The men's Série C and Série D 2025 seed: 84 clubs, 20 in C and 64 in D. Club names are REC Anexo A
and player names come from real 2025 match sheets; everything below is invented. The reasons behind
the four big choices are on [[ms-106-mens-lower-divisions]].

- **Outfield positions.** CBF marks only goalkeepers (`goleiro`, per match sheet). DF/MF/FW come
  from a heuristic on each athlete's most-worn shirt number, following traditional numbering:
  2/3/4/6 → DF, 5/8/10 → MF, 7/9/11 → FW, while the squad's 6/7/8 quota lasts. Everyone else fills
  DF, then MF, then FW in selection order. **Goalkeepers are real**: an athlete flagged `goleiro` on
  more than half their sheets.
- **Which 23.** Athletes are ranked by starts, then sheets named on, then CBF id. The top 2
  goalkeepers and top 21 outfielders are kept. Everything is taken from the match sheets, so fringe
  players and mid-season departures can make the list. An athlete named for two clubs is kept only
  by the one he has more sheets for.
- **Strength bands.** C runs **53 → 44** and D **43 → 28**, below Série B's floor of 54, two C clubs
  and four D clubs per step. The order is the 2025 final classification. For C that is 1º–4º
  derived under REC C Art. 25, 5º–16º as REC C 2026 Anexo B prints them, and 17º–20º from the 1ª
  Fase table. For D it is REC D Art. 22's order derived from the match API: elimination round first,
  then accumulated points, wins, goal difference and goals for; 1º–4º match REC C 2026 Anexo B. D
  sits below the seed's old 41 floor on purpose. The engine's only floor is a player strength of 1,
  and players are drawn at team strength ± 5.
  - The pre-existing Série A and B strengths **overlap**: A's floor is 55 and B's ceiling is 75.
    Only their averages are ordered. MS-106 left them alone.
- **Colours.** 31 clubs wear their real colours:
  `ponte-preta`, `londrina`, `nautico`, `sao-bernardo`, `caxias`, `guarani`, `confianca`,
  `ypiranga`, `ituano`, `botafogo-pb`, `figueirense`, `csa`, `abc`, `sampaio-correa`,
  `ferroviario-ce`, `treze`, `santa-cruz`, `central`, `america-rn`, `sergipe`, `goiania`, `mixto`,
  `luverdense`, `nova-iguacu`, `portuguesa`, `inter-de-limeira`, `operario-ms`, `uberlandia`,
  `joinville`, `guarany-de-bage`, `brasil-de-pelotas`.
  The other 53 take a deterministic palette colour, picked by a hash of the internal
  name:
  `brusque`, `floresta`, `maringa`, `anapolis`, `itabaiana`, `retro`, `tombense`, `independencia`,
  `humaita`, `manaus`, `manauara`, `tuna-luso`, `aguia-de-maraba`, `gremio-sampaio`, `trem`,
  `maracana`, `iguatu`, `maranhao`, `altos`, `parnahyba`, `tocantinopolis`, `imperatriz`,
  `horizonte`, `sousa`, `santa-cruz-rn`, `asa`, `penedense`, `lagarto`, `barcelona-de-ilheus`,
  `jequie`, `juazeirense`, `uniao-araguainense`, `ceilandia`, `capital-df`, `aparecidense`,
  `porto-velho`, `goianesia`, `rio-branco-es`, `porto-vitoria`, `boavista`, `pouso-alegre`,
  `marica`, `agua-santa`, `goiatuba`, `itabirito`, `monte-azul`, `cascavel`, `cianorte`, `azuriz`,
  `barra`, `marcilio-dias`, `sao-jose-rs`, `sao-luiz`.
- **Abbreviations.** Derived from `shortName`, particles skipped, the first free candidate wins. All
  124 are unique across `teams.json`. The four clubs already seeded keep theirs (CAX, LEC, PON,
  YPI).
- **Padding: none.** No club needed a generated name and no club needed the athlete API.
- **Série D's newcomers take the promoted clubs' group slots.** The 60 non-exchanged clubs keep
  their real Anexo B regional group. The clubs relegated from C land wherever the promoted clubs
  left, whatever their state. REC D gives no composition rule (Art. 14), so any placement would be
  invented; this one is the least disruptive.
- **Série D's field recycles.** CBF rebuilds ~56 of its 64 clubs every year from 27 state
  championships (Arts. 2º–3º). The game does not invent state champions — the A3 precedent above —
  so D keeps its clubs and stays at 64 on 4 in / 4 out.
- **Série C's home order.** REC C fixes a 10/9 home split per club in the 1ª Fase (Art. 14) and
  leaves the 2ª Fase home order to the tabela (Art. 18). The game uses its round-robin rotation for
  both.
- **The 2025 rules, every season.** CBF's 2026 formats differ: Série C relegates 2 (REC C 2026
  Art. 42), and Série D grows to 96 clubs with 6 promoted (REC D 2026 Arts. 2º, 6º, 13). The game
  applies the 2025 rules to every season. That is a claim about no real season after 2025.

---

## Provenance detail

Rescued from `.plans/MS-102/docs/03-MS-102-extraction-notes.md` (task 03, extraction dated
2026-09-05). `.plans/` is gitignored and ephemeral, so this record would otherwise have been lost.

### What is real

- **Club names.** `name` is CBF's `nome_completo`, `shortName` its `nome_popular`, both from the
  `times` endpoint — canonical wherever REC Anexo A spells a club differently.
- **Player names.** Per club from the athlete API, preferring `atleta_apelido` and falling back to
  `atleta_nome`, matching how the men's seed uses short names. Title-cased (CBF returns some in
  caps) with Portuguese particles left lower-case. Duplicates inside a squad fall back to the full
  `atleta_nome`.
- **UF**, used only to disambiguate colliding club names, is CBF's `time_uf`.

### Squad composition

Every squad is 23 players in the men's seed distribution — **2 GK / 6 DF / 7 MF / 8 FW** — assigned
in the order CBF returned the athletes. Abbreviations are derived from the internal name and are
unique across the 66 clubs. Colours use real club colours for recognisable clubs and a deterministic
palette pick for the rest.

### Strength bands

Invented, ordered so A1 > A2 > A3 with a gradient inside each division, within the men's seed range
(41–100):

| Division | Range |
|---|---|
| A1 | 73–90, ordered by a hand-set reputation tier (Corinthians highest, Mixto/MT lowest) |
| A2 | 56–70, spread deterministically by internal name |
| A3 | 41–55, spread deterministically by internal name |

### Name collisions

Two club names collide inside the women's set. Both are disambiguated with the club's UF, as the
plan requires; the generator resolves collisions generically, so this is not a hard-coded special case.

| Club | Division | UF | internalName |
|---|---|---|---|
| Mixto Esporte Clube | A1 | MT | `mixto-mt` |
| Mixto Esporte Clube | A3 | PB | `mixto-pb` |
| Esporte Clube Juventude | A1 | RS | `juventude-rs` |
| Clube Esportivo Juventude | A3 | SE | `juventude-se` |

No other collision occurred. Two internal names needed cleaning up separately: CBF's
"Araguari A.c." and "Prosperidade F. C." split into stray single letters, so single-letter tokens
are dropped — `araguari`, `prosperidade`.

### Squad pagination is lossy

CBF's athlete API reports a `total_atletas` count that it does not actually serve. Every club below
reached fewer athletes than CBF claims to have registered. The reachable set is accepted; nothing is
fabricated beyond the position padding described here.


### Padded squads

Every club carries 23 players so the roster matches the men's seed shape. **269
of 1518 player entries (17%) are
generated Brazilian names**; the remaining 1249 are real CBF athletes. 29 of
66 clubs needed at least one padded entry.

| Division | Club | internalName | Real names used | Padded | CBF's reported total |
|---|---|---|---|---|---|
| A1 | América | `america` | 20 | **3** | 32 |
| A2 | Ação | `acao` | 11 | **12** | 39 |
| A2 | Doce Mel | `doce-mel` | 13 | **10** | 36 |
| A2 | Atletico Rio Negro Clube | `atletico-rio-negro` | 17 | **6** | 31 |
| A2 | Instituto 3b | `instituto-3b` | 18 | **5** | 22 |
| A2 | Ceará | `ceara` | 22 | **1** | 28 |
| A3 | Atlético de Alagoinhas | `atletico-de-alagoinhas` | 0 | **23** | — |
| A3 | Remo | `remo` | 0 | **23** | — |
| A3 | Várzea Grande | `varzea-grande` | 0 | **23** | — |
| A3 | Ypiranga Clube | `ypiranga` | 0 | **23** | — |
| A3 | Penarol | `penarol` | 6 | **17** | 23 |
| A3 | Liga Sanjoanense | `liga-sanjoanense` | 7 | **16** | 25 |
| A3 | Brasil de Farroupilha | `brasil-de-farroupilha` | 10 | **13** | 26 |
| A3 | Rolim de Moura | `rolim-de-moura` | 10 | **13** | 26 |
| A3 | Sampaio Corrêa | `sampaio-correa` | 10 | **13** | 32 |
| A3 | Ipojuca | `ipojuca` | 12 | **11** | 23 |
| A3 | Coritiba SAF | `coritiba` | 13 | **10** | 24 |
| A3 | União | `uniao` | 14 | **9** | 30 |
| A3 | São Raimundo | `sao-raimundo` | 15 | **8** | 28 |
| A3 | Mixto | `mixto-pb` | 16 | **7** | 31 |
| A3 | Guarani de Paripueira | `guarani-de-paripueira` | 18 | **5** | 28 |
| A3 | Cresspom | `cresspom` | 19 | **4** | 47 |
| A3 | Paraíso Esporte Clube | `paraiso` | 19 | **4** | 29 |
| A3 | R4 | `r4` | 20 | **3** | 24 |
| A3 | Pantanal SAF | `pantanal` | 21 | **2** | 25 |
| A3 | Realidade Jovem | `realidade-jovem` | 21 | **2** | 22 |
| A3 | Desportiva Itapuense | `desportiva-itapuense` | 22 | **1** | 33 |
| A3 | Galvez | `galvez` | 22 | **1** | 30 |
| A3 | São Jose Esporte Clube Saf | `sao-jose` | 22 | **1** | 25 |

Four A3 clubs — Atlético de Alagoinhas, Remo, Várzea Grande and Ypiranga Clube — returned **no
athletes at all** from the API, despite appearing in the club list. Their entire 23-player squads
are generated. They are the least real data in the file.

### Reproducing this

The extraction and generation scripts live in the session scratchpad
(`fetch_cbf.py`, `clubs_uf.py`, `build_seed.py`) and are not tracked in git. `fetch_cbf.py` caches
each club's athlete pages, so a re-run only hits CBF for what it does not already have. Re-running
`build_seed.py` against the same dump is deterministic — colours, strengths, abbreviations and
padded names are all seeded from the internal name.

### MS-106 build

The builder lives in the session scratchpad (`cbf_lineups.py`, `build_seed.py`, `apply_teams.py`,
`apply_championships.py`) and is not tracked. It reads the research club lists and 51 cached
`jogos-api` rounds: Série C phases `1899` ×19, `1969` ×6, `1983` ×2, and Série D `1900` ×14, then
`1951`/`1957`/`1965`/`1971`/`1976` ×2. Two runs produce byte-identical output. It asserts, before
writing, that `teamNames` equals the research groups and that the derived group positions and D's
top 4 match CBF's.

**Name cleaning.** Names use `apelido` with the shirt number stripped at either end. All-caps and
all-lower names are title-cased, with Portuguese particles kept lower-case. Vowel-less all-caps
initials are kept ("KT"), and a lower-case surname is capitalised ("Diego tavares"). A duplicate
inside a squad would fall back to the full `nome`; none occurred.

**The four clubs already seeded were rebuilt in place.** `caxias` was renamed "Sociedade Esportiva e
Recreativa Caxias do Sul", strength 50 → 51, navy → grená. `londrina` went 42 → 53 and got sky blue,
`ponte-preta` 43 → 53, and `ypiranga` 41 → 49, red → yellow/green. Their old invented squads were
replaced by real ones.
