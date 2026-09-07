---
title: Cups deferred out of MS-102
type: decision
ticket: MS-102
decided: 2026-09-06
status: deferred to MS-103/MS-104
---

# Cups deferred out of MS-102

**Decision.** Extract and document both women's cups in full, but seed neither. The specs live at
[[copa-do-brasil-feminina]] and [[supercopa-feminina]]; no JSON entry, no model change.

## Why neither fits the `Championship` model

Both are pure knockouts. `Championship` assumes a league: it carries `numberOfTeams`, a `standings`
array built once from the team list, and a `matchContainer` of numbered rounds that
`ChampionshipService.createMatches` fills by round-robin rotation. A cup has no table to stand in
`standings`, and its bracket shrinks each round instead of repeating a fixed fixture list.

The Copa adds a harder problem: **staggered entry**. Its 66 clubs do not all start together — A3
clubs enter at the Preliminar or 1ª Fase, A2 clubs at the 1ª or 2ª, A1 clubs at the 2ª or 3ª,
by ranking position. Nothing in the current model can express "this club joins at round 3". The
`phases` descriptor added by MS-102 covers the knockout *shape*, but a cup would also need the league
scaffolding to become optional and the phase descriptor to carry per-phase entrants.


## What each cup would cost

| | [[supercopa-feminina]] | [[copa-do-brasil-feminina]] |
|---|---|---|
| Clubs | 2, already seeded | 66, already seeded (A1+A2+A3, no new team data) |
| Structure | 1 tie, 1 leg, no bracket | 8 phases, 72 matches, staggered entry |
| Blocks on | knockout ties existing at all | optional league scaffolding + per-phase entrants + drawn hosting |

The Supercopa is **nearly free** once knockouts exist and is the natural first cup to implement. The
Copa needs the `phases` descriptor to carry per-phase entrants and needs hosting to become a
per-competition choice — see [[phases-and-knockouts]].

## Why extract now and seed later

The REC PDFs are season-scoped and CBF's year selector already refuses 2027. Extracting while the
2026 documents are served costs one pass; re-extracting after they rotate may cost the source
entirely. See [[cbf-data-sources]].
