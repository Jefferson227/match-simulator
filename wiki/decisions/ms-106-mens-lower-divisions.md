---
title: The men's Série C and D are seeded from 2025, and stay 2025
type: decision
ticket: MS-106
decided: 2026-09-10
status: implemented
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: numberOfTeams
    equals: 20
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: numberOfTeams
    equals: 64
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: numberOfRelegatableTeams
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: rolloverSlotting
    equals: replace-in-place
  - file: src/infrastructure/data/teams.json
    select: internalName=caxias
    path: name
    equals: Sociedade Esportiva e Recreativa Caxias do Sul
  - file: src/infrastructure/data/teams.json
    select: internalName=barra
    path: name
    equals: Barra Futebol Clube
---

# The men's Série C and D are seeded from 2025, and stay 2025

**Decision.** The men's pyramid gains [[brasileirao-serie-c]] and [[brasileirao-serie-d]], with
every real club and its real mechanics, so it runs A ↔ B ↔ C ↔ D. Four choices shaped that seed.
None of them can be read off the code.

## 1. The 2025 season, not 2026

The men's Série A and B seed is **2025**. The 2026 editions were available, but seeding a 2026 C and
D next to a 2025 A and B puts clubs in two divisions at once. Série B 2025's relegated four
(Ferroviária, Amazonas, Volta Redonda, Paysandu) are in the game's B *and* in CBF's C 2026. The same
clash runs between C and D.

Seeding 2025 keeps every club in exactly one men's division, which
`tests/infrastructure/data/championships.test.ts` pins. The 2026 RECs were still read, as **outcome
evidence**. Their Anexos are CBF's official statement of where each club finished in 2025.

*Rejected:* re-seeding A and B to 2026 as well. It is out of scope, and it would have changed the
men's regression pins MS-103 put in place.

## 2. Club names follow REC Anexo A

The women's seed takes `name` from the `times` endpoint's `nome_completo` ([[known-contradictions]]
item 3). For the men's lower divisions, `times` is a poor source:

- it strips diacritics and mangles casing ("Associacao Atletica Ponte Preta", "Abc");
- it names SAF legal entities instead of the clubs ("Portuguesa Sociedade Anonima do Futebol");
- it carries a typo ("Sociedade Amonima").

The existing men's seed already used accented association names ("Associação Atlética Ponte
Preta"). **REC Anexo A is what matches it**, so the men's Série C and D follow Anexo A, and the
divergence from the women's rule is deliberate. Details are in [[known-contradictions]] item 8.

*Rejected:* `times` verbatim, which would sit badly next to Série A and B, and accented `times`,
which would still name SAF entities.

## 3. Série D's newcomers take the slots its promoted clubs vacated

Série D's 2025 groups are regional (REC D Anexo B), and the seed reproduces them by listing
`teamNames` in Anexo B order. After a roll-over, 4 promoted clubs leave and 4 relegated from Série C
arrive, and the question is where they go. The REC states **no criterion** for composing groups
(Art. 14), and the seed carries no UF. **Each newcomer takes the list position, and so the group, of
a club that left.** The other 60 keep their real regional group.

*Rejected:*
- **Appending**, today's default. It shifts every later club down the list, so from season 2 no
  group resembles Anexo B.
- **Regrouping by UF.** There is no geography in the seed, and REC D gives no rule to follow.

Where a newcomer lands is invented; it is recorded on [[invented-data]]. The mechanism is opt-in
(`rolloverSlotting`), so no other division changes.

## 4. The 2025 rules apply to every season

CBF's formats have already moved on. REC C 2026 relegates **2**, not 4 (Art. 42). REC D 2026 grows
to **96 clubs**, with a playoff round and **6** promoted (Arts. 2º, 6º, 13). Following them would
need a 24-club Série C in 2027 that no CBF document confirms ([[known-contradictions]], open gaps).
It would also need Série D to grow by 32 clubs the game has no source for. It refuses to invent
state champions, the Série A3 precedent from MS-103.

So the game plays the 2025 rules forever. Both divisions stay stable, C at 20 and D at 64, without a
`targetNumberOfTeams`. The seed drifts from reality from 2026 on, the same class of choice as
[[ms-104-a3-group-shape-schedule]]. **Nothing here is a claim about any real season after 2025.**

## What MS-106 changed in the engine to get there

Every new mechanism is declared in `championships.json` and read by generic code, as MS-103
established. They are serpentine group allocation, fixed Anexo B crossings, an accumulated-points
re-seed, a round-robin phase following another phase, and promotion by group position of a chosen
phase. Série C needed that last one because its final does not decide promotion: in 2025 the club
that won the 1ª Fase stayed down. See [[phases-and-knockouts]] and [[promotion-and-relegation]].

The ticket also fixed the long-standing **missing wins tiebreaker** for every competition. On 2025
data it decides who is relegated from Série C; see [[tiebreakers]].

## Left open

- **Container re-centring.** After the human's club is promoted or relegated, the championship
  container still centres on the division the human started in. `TeamManager` reads the human club
  from `playableChampionship`. This is a pre-existing gap and affects the women's pyramid too. It is
  out of MS-106's scope and listed as an open thread on [[index]].
- **Head-to-head and card tiebreakers**, and the RECs' final-classification tiers, are still not
  modelled.
- **The men's Série A and B strengths overlap** (A's floor 55 is below B's ceiling 75). Only C and D
  sit strictly below. See [[invented-data]].
