---
title: Copa do Brasil Feminina
type: competition
season: 2026
verified: 2026-09-06
sources: [rec-copa-2026, tabela-copa-2026, tabelas-copa-2026]
seeded: true
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    path: numberOfTeams
    equals: 66
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    path: teamNames.length
    equals: 66
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    path: hasLeagueTable
    equals: false
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    path: phases.length
    equals: 8
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    path: phases.0.entrants.length
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    path: phases.1.entrants.length
    equals: 30
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    path: phases.5.legs
    equals: 2
---

# Copa do Brasil Feminina — 2026

**Seeded 2026-09-07** by MS-103 as `copa-do-brasil-feminina`. This page remains the spec; the seed is
generated from it. The model work it needed — optional league scaffolding, per-phase entrants, drawn
hosting — is described in [[ms-102-cups-deferred]] and [[phases-and-knockouts]].

The **Ranking Adaptado order below is now in `championships.json`**, as each phase's `entrants` list.
The seed's phase bands are regulatory (Arts. 14–17); the ordering *within* a band is this page's
table, which carries the extraction caveat noted under Participants.

66 clubs, 8 phases, 72 matches, straight knockout with **staggered entry**. Its 66 participants are
exactly the clubs of [[brasileirao-feminino-a1]], [[brasileirao-feminino-a2]] and
[[brasileirao-feminino-a3]], so seeding it needs no new team data.

Retrieval mechanics for everything below are on [[cbf-data-sources]].


| | |
|---|---|
| Official name | **Copa do Brasil Feminina** (REC Art. 1º/2º — *Feminina*, feminine agreement; only the URL slug and the site's category label say "Feminino") |
| Slug | `copa-do-brasil/feminino/2026` |
| competitionId | `1260632` (championshipId `24`, categoryId `55`) |
| Clubs | **66** |
| Phases | **8** (REC Art. 11) — the site publishes only 6 |
| Matches | **72** |
| Format | Straight knockout with staggered entry; every phase is `fase_tipo: eliminacao` |
| REC | Signed Rio de Janeiro, 20/03/2026 (Julio Avellar, Diretor de Competições) |

## Phases

REC Art. 11 defines eight phases. CBF's site exposes a `fase_id` for only the first six, because the
6ª and 7ª have no drawn clubs yet; their dates and group numbers come from the official Tabela
Detalhada. Group numbering runs 1–65 continuously across the whole tournament (REC Anexo B).

| # | Phase (REC) | Site `fase_nome` | fase_id | Legs | Ties | Matches | Match refs | Dates |
|---|---|---|---|---|---|---|---|---|
| 1 | Fase Preliminar | `PRELIMINAR` | 2033 | 1 | 2 | 2 | 001–002 | 22–23/04/2026 |
| 2 | 1ª Fase | `1ª Fase` | 2034 | 1 | 16 | 16 | 003–018 | 28–29/04, 07/05/2026 |
| 3 | 2ª Fase | `2ª Fase` | 2055 | 1 | 16 | 16 | 019–034 | 12–14/05, 27/05/2026 |
| 4 | 3ª Fase | `3ª Fase` | 2060 | 1 | 16 | 16 | 035–050 | 27–30/05, 06/07/2026 |
| 5 | 4ª Fase (Oitavas) | `4a Fase` | 2069 | 1 | 8 | 8 | 051–058 | 20–22/07/2026 |
| 6 | 5ª Fase (Quartas) | `5ª Fase` | 2077 | **2** | 4 | 8 | 059–066 | 15/10 + 22/10/2026 |
| 7 | 6ª Fase (Semifinal) | *not published* | **none yet** | **2** | 2 | 4 | 067–070 | 04/11 + 08/11/2026 |
| 8 | 7ª Fase (Final) | *not published* | **none yet** | **2** | 1 | 2 | 071–072 | 11/11 + 15/11/2026 |

Two quirks in CBF's own payload: the fourth phase is written `4a Fase` (plain "a", no ordinal
indicator) unlike every other, and `fase_id` 2034 appears **twice** in `phasesList` — once with
`tipo_rodada: "padrao"` and once with `"unificada"`. That is a duplicate, not two phases.

Source: `https://www.cbf.com.br/futebol-brasileiro/tabelas/copa-do-brasil/feminino/2026` and its
per-phase pages (`.../2026/<fase_id>`).

## Qualification and bracket (REC Arts. 14–21)

Qualification is **automatic by division membership** — there is no cup-specific merit route. All 66
clubs of A1 + A2 + A3 are in, and only they are (REC Art. 2º, criteria 1–3; Anexo A's `Origem`
column reads "Brasileiro Feminino A1/A2/A3 2026" for every row). Seeding the Copa therefore needs no
new team data beyond what MS-102 already seeds.

What varies is **where** a club enters, set by a *Ranking Adaptado*: clubs ordered by their position
in the RNC/FF 2026 (Ranking Nacional de Clubes do Futebol Feminino), tiebroken by the RNF/FF 2026
federation ranking for clubs tied or unranked (Arts. 14 §3, 15 §3, 16 §3, 17 §3).

```
Fase Preliminar   4 clubs  = A3 #29–32                                  →  2 ties → 2 winners
1ª Fase          32 clubs  = 2 prelim winners + A3 #1–28 + A2 #15–16     → 16 ties → 16 winners
2ª Fase          32 clubs  = 16 winners + A2 #1–14 + A1 #17–18           → 16 ties → 16 winners
3ª Fase          32 clubs  = 16 winners + A1 #1–16                       → 16 ties → 16 winners
4ª Fase          16 clubs                                                →  8 ties → 8 winners
5ª Fase           8 clubs                                                →  4 ties → 4 winners
6ª Fase           4 clubs                                                →  2 ties → 2 winners
7ª Fase           2 clubs                                                →  1 tie  → CHAMPION
```

Distinct entrants 4 + 30 + 16 + 16 = **66**; matches 2 + 16 + 16 + 16 + 8 + 8 + 4 + 2 = **72**.
**There are no byes** — nobody skips a round they were entered into; clubs simply enter at different
rounds. 30 clubs (not 32) enter at the 1ª Fase because two of its 32 slots are reserved for the
Preliminar winners. This is confirmed against the live site: counting each club id's first
appearance gives Preliminar 4, 1ª Fase 30 new, 2ª Fase 16 new, 3ª Fase 16 new, 4ª/5ª 0 new.

REC Art. 3º adds a condition: a club must return a signed *Termo de Confirmação de Participação* and
*Termo de Indicação de Estádio* by the DCO deadline. Art. 2º parágrafo único: a club that withdraws
is **not replaced** — its opponent advances by W.O. No such case has occurred in 2026.

## Tie rules, hosting and seeding

| Rule | Detail | Article |
|---|---|---|
| Winner of a tie | Most points across the tie; every phase restarts at zero points | Art. 13 |
| 1st tiebreaker | Goal difference — **only on two-legged ties** (5ª, 6ª, 7ª) | Art. 13 §1 |
| 2nd tiebreaker | Penalty shootout, starting within 10 min of full time | Art. 13 §1–§2 |
| Extra time | **None** — *prorrogação* does not appear in the REC | REC (full text) |
| Away goals | **No away-goals rule** — not present anywhere in the REC | REC (full text) |
| Hosting | Public draw (*sorteio público*) by the DCO at **every** phase — no seeding-based hosting right, unlike A1/A2/A3 | Arts. 14–21 §1/pu |
| Hosting mechanic | Home team is the club placed on the **left** of the DCO table | Art. 24 |
| Final venue | Both legs of the 7ª Fase are played at a **CBF-designated** stadium | Art. 23 |
| Draw pairing | Anexo B pairs the *n*-th drawn club with the *(N+1−n)*-th within each phase | Anexo B |
| Open draw | Any club may face any other — no regional or division protection | Arts. 14–17 §2 |
| Yellow cards | Reset to zero after the 4ª Fase; reds and 3rd-yellow suspensions carry over | Art. 22 |
| Next season | Champion plays the Supercopa Feminina 2027 vs the A1 2026 champion; if one club wins both, the A1 runner-up takes the slot | Art. 5º |

**Note for MS-103:** the Copa's hosting rule is drawn, not seeded. The A1/A2/A3 rule ("higher seed
hosts the second leg") does **not** apply here, so a knockout implementation needs hosting to be a
per-competition choice, not a constant.

## Participants — 66 clubs

Official name and UF from REC Anexo A; Ranking Adaptado position from REC Anexos C/D/E; short name
and club id from the live fixture data; entry phase from Arts. 14–17, cross-checked against each
club's first appearance on the site.

> **Caveat on the join.** REC Anexo A gives official names without ids; the site gives ids with short
> names. The name↔id mapping below is a join done during extraction (normalised string similarity
> constrained by entry phase, with eight manual overrides: Cresspom, Brasil de Farroupilha, Uda,
> Taubaté, Atlético de Alagoinhas, Paraíso, CAP, Atlético Rio Negro). It is a clean 1:1 bijection
> over all 66 with no leftovers, and the two same-name pairs (Mixto MT/PB, Juventude RS/SE) are
> separated by entry phase — but CBF does not publish it as a single table. Re-verify before using
> the ids as a key.

| Div | Rnk | Official name (REC Anexo A) | UF | Short name | Club id | Enters at |
|---|---|---|---|---|---|---|
| A1 | 1º | Sport Club Corinthians Paulista | SP | Corinthians | 20001 | 3ª Fase |
| A1 | 2º | Sociedade Esportiva Palmeiras | SP | Palmeiras | 20002 | 3ª Fase |
| A1 | 3º | Ferroviária SAF | SP | Ferroviária | 20038 | 3ª Fase |
| A1 | 4º | São Paulo Futebol Clube | SP | São Paulo | 20005 | 3ª Fase |
| A1 | 5º | Sport Club Internacional | RS | Internacional | 20011 | 3ª Fase |
| A1 | 6º | Red Bull Bragantino | SP | Red Bull Bragantino | 20007 | 3ª Fase |
| A1 | 7º | Clube de Regatas do Flamengo | RJ | Flamengo | 20016 | 3ª Fase |
| A1 | 8º | Esporte Clube Bahia SAF | BA | Bahia | 61377 | 3ª Fase |
| A1 | 9º | Cruzeiro Esporte Clube SAF | MG | Cruzeiro | 59849 | 3ª Fase |
| A1 | 10º | Grêmio Foot-Ball Porto Alegrense | RS | Grêmio | 20013 | 3ª Fase |
| A1 | 11º | Santos Futebol Clube | SP | Santos FC | 20008 | 3ª Fase |
| A1 | 12º | Fluminense Football Club | RJ | Fluminense | 20014 | 3ª Fase |
| A1 | 13º | América FC S.A.F | MG | América | 59897 | 3ª Fase |
| A1 | 14º | Atlético Mineiro S.A.F. | MG | Atlético Mineiro | 62194 | 3ª Fase |
| A1 | 15º | SAF Botafogo | RJ | Botafogo | 60175 | 3ª Fase |
| A1 | 16º | Esporte Clube Juventude | RS | Juventude | 20027 | 3ª Fase |
| A1 | 17º | Mixto Esporte Clube | MT | Mixto | 20064 | 2ª Fase |
| A1 | 18º | Esporte Clube Vitória | BA | Vitória | 20018 | 2ª Fase |
| A2 | 1º | Sport Club do Recife | PE | Sport Recife | 20010 | 2ª Fase |
| A2 | 2º | Instituto Bosco Brasil Binda - Instituto 3B | AM | Instituto 3b | 55491 | 2ª Fase |
| A2 | 3º | Minas Brasília Tênis Clube | DF | Minas Brasília | 40164 | 2ª Fase |
| A2 | 4º | Itacoatiara Futebol Clube | AM | Itacoatiara Futebol Clube | 57657 | 2ª Fase |
| A2 | 5º | Associação Desportiva Taubaté | SP | Associação Desportiva Taubaté | 58117 | 2ª Fase |
| A2 | 6º | Vasco da Gama SAF | RJ | Vasco da Gama Saf | 60646 | 2ª Fase |
| A2 | 7º | União Desportiva Alagoana | AL | Uda | 21930 | 2ª Fase |
| A2 | 8º | Ceará Sporting Club | CE | Ceará | 20031 | 2ª Fase |
| A2 | 9º | Doce Mel Esporte Clube | BA | Doce Mel | 35125 | 2ª Fase |
| A2 | 10º | Vila Nova Futebol Clube | GO | Vila Nova | 20079 | 2ª Fase |
| A2 | 11º | Sociedade Ação Futebol | MT | Ação | 35054 | 2ª Fase |
| A2 | 12º | Paysandu Sport Club | PA | Paysandu | 20017 | 2ª Fase |
| A2 | 13º | Atlético Rio Negro Clube | RR | Atletico Rio Negro Clube | 20772 | 2ª Fase |
| A2 | 14º | Clube Atlético Piauiense | PI | CAP | 59737 | 2ª Fase |
| A2 | 15º | Viva Rio Pérolas Negras | RJ | Pérolas Negras | 54897 | 1ª Fase |
| A2 | 16º | Itabirito Futebol Clube - SAF | MG | Itabirito Saf | 60368 | 1ª Fase |
| A3 | 1º | São José Esporte Clube SAF | SP | São Jose Esporte Clube Saf | 61505 | 1ª Fase |
| A3 | 2º | Clube do Remo | PA | Remo | 20022 | 1ª Fase |
| A3 | 3º | Clube Recreativo Esportivo dos Subtenentes da PM do DF | DF | Cresspom | 21770 | 1ª Fase |
| A3 | 4º | Associação Esportiva Realidade Jovem Rio Preto | SP | Realidade Jovem | 57068 | 1ª Fase |
| A3 | 5º | Coritiba SAF | PR | Coritiba SAF | 61590 | 1ª Fase |
| A3 | 6º | Ypiranga Clube | AP | Ypiranga Clube | 20260 | 1ª Fase |
| A3 | 7º | Sociedade Esportiva Recreativa e Cultural Brasil | RS | Brasil de Farroupilha | 33248 | 1ª Fase |
| A3 | 8º | Sociedade Esportiva União | RN | União | 35626 | 1ª Fase |
| A3 | 9º | Criciúma Esporte Clube | SC | Criciúma | 20019 | 1ª Fase |
| A3 | 10º | Mixto Esporte Clube | PB | Mixto | 53828 | 1ª Fase |
| A3 | 11º | São Raimundo Esporte Clube | RR | São Raimundo | 21638 | 1ª Fase |
| A3 | 12º | Paraíso Esporte Clube | TO | Paraíso Esporte Clube | 60881 | 1ª Fase |
| A3 | 13º | Ipojuca Atlético Clube | PE | Ipojuca | 35734 | 1ª Fase |
| A3 | 14º | Clube Esportivo Juventude | SE | Juventude | 63107 | 1ª Fase |
| A3 | 15º | Rolim de Moura Esporte Clube | RO | Rolim de Moura | 35661 | 1ª Fase |
| A3 | 16º | Prosperidade Futebol Clube | ES | Prosperidade F. C. | 62797 | 1ª Fase |
| A3 | 17º | Galvez Esporte Clube | AC | Galvez | 32816 | 1ª Fase |
| A3 | 18º | Alagoinhas Atlético Clube | BA | Atlético de Alagoinhas | 20236 | 1ª Fase |
| A3 | 19º | Várzea Grande Esporte Clube | MT | Várzea Grande | 20099 | 1ª Fase |
| A3 | 20º | Associação Esportiva Guarani de Paripueira | AL | Guarani de Paripueira | 60890 | 1ª Fase |
| A3 | 21º | R4 Esporte Clube | CE | R4 | 61857 | 1ª Fase |
| A3 | 22º | Grêmio Esportivo Mauaense | SP | Mauaense | 31716 | 1ª Fase |
| A3 | 23º | Real Futebol Clube Heips | RJ | Heips | 32479 | 1ª Fase |
| A3 | 24º | Araguari Atlético Clube | MG | Araguari A.c. | 34353 | 1ª Fase |
| A3 | 25º | Penarol Atlético Clube | AM | Penarol | 21892 | 1ª Fase |
| A3 | 26º | Associação Atlética Tiradentes | PA | Tiradentes | 20776 | 1ª Fase |
| A3 | 27º | Planalto Esporte Clube | GO | Planalto Esporte Clube | 37668 | 1ª Fase |
| A3 | 28º | Associação Desportiva Itapuense | RO | Desportiva Itapuense | 64240 | 1ª Fase |
| A3 | 29º | Liga Sanjoanense | PI | Liga Sanjoanense | 53094 | Preliminar |
| A3 | 30º | Sampaio Corrêa Futebol Clube | MA | Sampaio Corrêa | 20056 | Preliminar |
| A3 | 31º | Futebol Clube Pantanal SAF | MS | Pantanal SAF | 63954 | Preliminar |
| A3 | 32º | Portuguesa de Desporto do Amapá | AP | Portuguesa | 57406 | Preliminar |

UF spread: SP 10, RJ 6, MG 5, BA 4, RS 4, AM/MT/PA 3 each, AL/AP/CE/DF/GO/PE/PI/RO/RR 2 each,
AC/ES/MA/MS/PB/PR/RN/SC/SE/TO 1 each — all 26 states and the DF are represented.

## Bracket state on 2026-09-06

Fase Preliminar (played) — these two ties filled the slots the 2026-09-05 pass saw as "A Definir":

| Ref | Tie | Outcome | Date | Venue |
|---|---|---|---|---|
| 001 | Sampaio Corrêa (MA) 3 × 2 Portuguesa (AP) | Sampaio Corrêa advances | 23/04/2026 | Nhozinho Santos, São Luís/MA |
| 002 | Pantanal SAF (MS) 1 × 1 Liga Sanjoanense (PI) | Liga Sanjoanense on penalties (Art. 13 §1) | 22/04/2026 | Jacques da Luz, Campo Grande/MS |

5ª Fase (quarter-finals) — drawn, not yet played:

| Grupo | Leg 1 — 15/10/2026 | Leg 2 — 22/10/2026 |
|---|---|---|
| 59 | Flamengo × Fluminense | Fluminense × Flamengo |
| 60 | Ferroviária × Red Bull Bragantino | Red Bull Bragantino × Ferroviária |
| 61 | Internacional × Atlético Mineiro | Atlético Mineiro × Internacional |
| 62 | Bahia × São Paulo | São Paulo × Bahia |

## Still missing (CBF has not published it)

- **`fase_id` for the 6ª Fase (semifinal) and 7ª Fase (final).** Both phases exist in REC Art. 11 and
  in the Tabela Detalhada (dates and groups 63–65 above), but CBF has not created the phase entries.
  Probing `.../2026/2078` and `.../2026/2085` returns the default 5ª Fase page, so there is no hidden
  live id. Nothing depends on these — the format is fully known from the REC.
- **Kick-off times and stadiums for the 5ª Fase.** `hora` is `null` and `local` is `" - - "` for all
  eight matches; per the Tabela Detalhada's own note, times are fixed jointly with the broadcaster.
- **Libertadores qualification via the Copa.** Not stated in the Copa's REC. A1 2026 REC Art. 6º
  handles Libertadores slots; the cup does not appear to grant one. Recorded as **not verified** —
  it was outside this extraction's brief.
- **Prize money.** Chapter 5 (*Disposições financeiras*) of the Copa REC was not extracted; MS-102
  has no use for it. Available from the same PDF if MS-103/MS-104 needs it.

