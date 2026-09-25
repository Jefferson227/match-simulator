---
title: Match simulation
type: spec
verified: 2026-09-24
owner: user
asserts:
  - file: src/domain/features/match-simulation/MatchSimulationEngine.ts
    exists: true
  - file: src/domain/features/match-simulation/DecisionPolicy.ts
    exists: true
  - file: src/domain/features/match-simulation/ActionStrategies.ts
    exists: true
  - file: src/domain/features/match-simulation/StrengthResolver.ts
    exists: true
  - file: src/domain/features/match-simulation/StaminaPolicy.ts
    exists: true
  - file: src/domain/services/MatchService.ts
    exists: true
---

> **Spec, not description.** This is the contract the `match-simulation` feature is judged against.
> If the code and this page disagree, the code is wrong until the user says otherwise. The user owns
> this page; Claude keeps it in sync and drafts changes, but does not change the rules unilaterally.

> **Provenance.** Unlike [[player-xp]], this page was drafted on 2026-09-20 by reading the
> implementation, because no written spec existed for it. Every number below was a tuning constant
> someone chose; from this page's date onward they are the contract, and a change to one is a change
> to this page. Prose that only restates control flow was deliberately left out — the code is the
> truth for that, per the wiki's one rule in [[CLAUDE]].

# Match simulation

A match is **90 ticks**. One tick is one *action*: a single contested event between the team holding
the ball and the team defending. There is no ball physics, no off-ball movement, no clock within a
tick. A tick either keeps possession where it is, moves the ball one area, turns it over, or
resolves a shot.

## The tick state

Each match carries a `MatchSimulationState`:

| Field | Meaning |
|---|---|
| `hasKickedOff` | false until the first tick creates the state |
| `possessionTeam` | `home` or `away` |
| `fieldArea` | `defense` \| `midfield` \| `attack`, **relative to the team in possession** |
| `shotAttempts` | count of shots taken, by either side, for the whole match |

`fieldArea` being possession-relative is the core simplification: there is one ball position, and
the defending team's view of it is the mirror (`attack` ↔ `defense`, `midfield` → `midfield`). A
turnover therefore always flips both fields at once.

**Kickoff.** A coin flip (`nextInt(0, 100) < 50`) gives possession; the ball starts at `midfield`.
`shotAttempts` carries over from any prior state so a resumed match does not lose its count.

**Who is ticked.** Only the playable division. The AI divisions play a whole round at once at
round end — see [[ms-109-full-pyramid-container]]. A tick is skipped when the current round is not
`in-progress` or the round timer has already reached 90.

## Action selection

The action depends **only on the field area**. Team strength, morale, formation and the score have
no influence on *what* is attempted — only on whether it succeeds. This is deliberate: it keeps one
knob (strength) doing one job.

`decideAction` rolls `nextInt(0, 100)`, which is **inclusive at both ends** — 101 outcomes, not 100.
Every probability below is therefore out of 101.

| Field area | `move` | `pass-next` | `pass-previous` | `shoot` |
|---|---|---|---|---|
| `defense` | roll < 60 → **59.4%** | 60–98 → **38.6%** | — | ≥ 99 → **2.0%** |
| `midfield` | roll < 80 → **79.2%** | 80–97 → **17.8%** | — | ≥ 98 → **3.0%** |
| `attack` | roll < 60 → **59.4%** | — | 60–69 → **9.9%** | ≥ 70 → **30.7%** |

Intent: the ball climbs the pitch by repeated `pass-next` attempts out of defence and midfield, and
almost all shooting happens in `attack`. The long-range shot from `defense` and `midfield` is a rare
event, not a strategy.

## The dispute

Every action resolves through one primitive:

```ts
offenseRoll = rng.nextInt(1, max(1, offenseStrengthMax));
defenseRoll = rng.nextInt(1, max(1, defenseStrengthMax));
offenseWins = offenseRoll >= defenseRoll;
```

Two independent rolls, compared. **Not** a threshold or a ratio. Consequences that are contractual,
not incidental:

- A weaker side wins disputes often. With equal strengths the offence wins `(N+1) / 2N` — a hair
  over 50%, because ties go to the attacker.
- Doubling a team's strength does **not** double its win rate; the advantage saturates.
- Strength differences matter less per dispute than they do per match, because a match is ~90
  disputes and the edge compounds.

### Strength inputs

`getTeamStrengthForDispute(team, position)` sums the `strength` of **every starter at one position**
and applies morale. Position comes from the field area: `defense` → `DF`, `midfield` → `MF`,
`attack` → `FW`.

`getDefenseStrengthForDispute(team)` — used only against a shot — sums **all `GK` and `DF`
starters**.

Fallbacks, in order: no starter at the position → all starters; no player flagged `isStarter` →
the whole squad. A team can never field a strength of 0.

**Morale** scales the sum by ±30%, linear, pivoting at 50:

```
multiplier = 1 + moralePercentage / 100
moralePercentage = morale >= 50 ?  round(30 * (morale - 50) / 50)
                                : -round(30 * morale / 50)
```

Morale 100 → +30%. Morale 50 → 0%. Morale 0 → −30%. Result floored at 1.

**Stamina** scales each player's strength *before* the sum, so the order is stamina → sum → morale →
round → floor. A player at full stamina, or with none set, contributes their raw strength and the
formulas above are unchanged. See [[player-stamina]]; penalty shootouts opt out and are contested at
full strength.

> **Consequence, and it is a known tension.** Because strengths are **summed**, squad shape is worth
> more than player quality. Four defenders of strength 50 (sum 200) beat three of strength 60
> (sum 180). A formation with an extra body in an area wins that area. This falls out of the model
> rather than being designed; it is recorded here so a future change is a decision, not a bug fix.

## What each action does

`move`, `pass-next` and `pass-previous` all resolve the same dispute — the possessing team's players
in the current area against the defending team's players in the mirrored area — and differ only in
the reward for winning.

| Action | Offence wins | Offence loses |
|---|---|---|
| `move` | nothing changes: same team, same area | turnover |
| `pass-next` | advance `defense` → `midfield` → `attack`; `attack` stays `attack` | turnover |
| `pass-previous` | retreat `attack` → `midfield` → `defense`; `defense` stays `defense` | turnover |

A **turnover** is always the same: possession flips and the area becomes its mirror. The ball does
not change height on the pitch; only whose half it is called.

`move` winning is a no-op tick. That is intentional — it is the "nothing happened this minute" beat
that keeps a 90-tick match from being 90 events.

## Shooting and goals

A shot is the only action that can change the score, and it resolves differently from the others:
**one player against a whole back line**.

1. **Shooter** — candidates are the starters at the position matching the *current* field area, and
   one is picked uniformly. A shot from `defense` is therefore taken by a defender, from `midfield`
   by a midfielder.
2. **Attack side of the dispute** — that single player's `strength`, morale-adjusted.
3. **Defence side** — the sum of *all* the opponent's `GK` + `DF` starters, morale-adjusted.
4. `resolveDispute(shooter, defence)` → goal or no goal.

The asymmetry (one striker vs. a summed defence) is what keeps scorelines realistic. It is the
single most load-bearing number in the model: widen it and matches end 0–0, narrow it and they end
6–5.

**No goal** — `shotAttempts` increments, possession flips, the area mirrors. There is no save, no
post, no corner, no shot-on-target distinction; a missed shot is exactly a turnover that got
counted.

**Goal** — the scoring team's score increments; `{ player, scorerTeam, time: minute }` is appended to
`match.scorers`; `match.latestGoal.scorerName` is set for the UI. The restart gives possession to the
**conceding** team at `midfield`, and `shotAttempts` still increments.

## What the model deliberately does not have

Absent by design, not by oversight. Adding any of them is a spec change:

- no half-time, added time, or any event tied to a specific minute
- no fouls, cards or injuries — so nothing here feeds [[tiebreakers]]' unmodelled card criteria.
  Nor does the engine make substitutions; only the human does, with the clock paused. This page
  said "no substitutions" until 2026-09-24, which was never true of the game. **Fatigue was on this list until MS-111**; it is now modelled, and specified
  separately in [[player-stamina]].
- no home advantage
- no in-match tactics, formation changes or score-aware behaviour: a side 3–0 down plays exactly as
  it did at 0–0
- no assists, possession percentage or any statistic other than `shotAttempts` and `scorers`
- no set pieces, offside or goalkeeper as an actor (the GK contributes strength only, and only
  against shots)

Draws stand. Knockout ties needing a winner are decided elsewhere — see
[[ms-103-simulated-shootout]].

## Determinism

Randomness is injected as a `RandomProvider` (`{ nextInt(min, max) }`, inclusive both ends). The
default is `getRandomNumber` from `src/domain/utils/Utils.ts`; `MatchService.runMatchActions` takes
an optional `{ rng }` so tests can pin every outcome. **Domain code must never call `Math.random`
directly** — this is the concrete case of the isolation [[layer-boundaries]] asks for.

## The clock is not in the domain

The domain advances one tick per call and has no timer of its own. The pacing lives in the UI
(`MatchSimulator.tsx`), which runs a `setInterval` at `state.gameConfig.clockSpeed` and dispatches
`RUN_MATCH_ACTIONS` until minute 90. The round's own `timer` is clamped at 90 on the domain side, so
a runaway UI cannot over-simulate a round, but everything else about pacing — speed, pause, skip to
the end — is a presentation concern.

> **Not asserted.** Every probability, the dispute formula, the ±30% morale band, the
> one-shooter-vs-summed-defence asymmetry and the absences above are prose. `scripts/lint-wiki.cjs`
> can only confirm the five files exist. The code that must honour this page is
> `src/domain/features/match-simulation/` and `MatchService.runMatchActions`.
