---
title: Invented data
type: concept
verified: 2026-09-05
sources: [atletas-api]
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
