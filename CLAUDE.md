# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Vite dev server
npm run build          # Vite production build (NO type checking — see below)
npm run lint           # ESLint (only covers **/*.{js,jsx}, so effectively no app code)
npm test               # Jest, all suites
npm run test-back      # tests/ only (domain, use-cases, game-engine, infrastructure)
npm run test-front     # src/presentation only (React component tests)
npx jest tests/domain/services/MatchService.test.ts   # single file
npx jest -t "some test name"                           # single test by name
npx tsc --noEmit       # the only real type check
```

Type checking is not wired into `build` or `lint`. `npx tsc --noEmit` currently reports pre-existing errors (mostly in `.test.tsx` files over jest-dom matcher types, plus `src/game-engine/initialGameState.ts` returning a partial `GameState`). Don't assume a clean baseline — diff against the pre-existing set before blaming your change.

## Architecture

Layered single-package app. The dependency direction is enforced by convention only (documented in `docs/FolderRestructuring.md`):

```
presentation → use-cases → domain
              game-engine ↗        infrastructure → domain
```

`domain` depends on nothing outside itself.

### State: the GameEngine, not React

There is no Redux/Zustand and only one React context. All game state lives in a plain class instance.

- `src/game-engine/GameState.ts` — the `GameState` shape and the `GameAction` discriminated union.
- `src/game-engine/GameEngine.ts` — holds state, `dispatch(action)` runs a private `reduce`, then notifies subscribers.
- `src/presentation/contexts/GameEngineContext.tsx` — `useGameEngine()` returns the singleton engine.
- `src/services/useGameState.ts` — `useGameState(engine)` subscribes via `useSyncExternalStore`.

Standard component usage:

```tsx
const engine = useGameEngine();
const state = useGameState(engine);
engine.dispatch({ type: 'RUN_MATCH_ACTIONS' });
```

**Adding an action**: add the variant to `GameAction`, extend `GameState` if needed, add the `case` to `GameEngine.reduce`. `reduce` does no work itself — each case constructs the relevant `*UseCases` with the current state and returns the use case's new `GameState`.

Known limitation (commented in `GameEngine.ts`): every dispatch emits, so React re-renders on any state change.

### Use cases → services → repositories

- `src/use-cases/*UseCases.ts` — classes constructed with a `GameState`. They call a domain service, unwrap the `OperationResult`, and return a **new** `GameState`. On failure they return `{ ...state, hasError: true, errorMessage }` rather than throwing — except the read-only getters (e.g. `getMatchesForCurrentRound`), which throw and must be wrapped in try/catch by the caller.
- `src/domain/services/*Service.ts` — default-exported object of pure functions holding the game rules. They return `OperationResult<T>`, never raw values.
- `src/infrastructure/repositories/` — read seed JSON (`src/infrastructure/data/{teams,championships}.json`) and `localStorage` (`GameRepository`, key `match-simulator-game-state`). These throw plain `Error`s; services catch and convert to `OperationResult` errors.

### OperationResult

`src/domain/results/OperationResult.ts`. Every service call returns one. Check `result.succeeded` **before** `result.getResult()` — `getResult()` returns the (possibly meaningless) constructor value regardless of success. Errors carry `{ errorCode, message, details }`.

### Match simulation

`src/domain/features/match-simulation/` is a strategy-based tick engine:
`MatchSimulationEngine.runMatchTick(match, minute, rng)` → `DecisionPolicy.decideAction(fieldArea, rng)` picks one of `move | pass-next | pass-previous | shoot` → the matching function in `ActionStrategies.ts` returns `{ match, simulation }`.

Randomness is injected as a `RandomProvider` (`{ nextInt }`), and services accept an optional `dependencies` argument (e.g. `MatchService.runMatchActions(container, { rng })`) so tests can make simulation deterministic. Do not call `Math.random` directly inside domain code — go through `getRandomNumber` in `src/domain/utils/Utils.ts` or an injected `rng`.

The clock lives in the UI: `MatchSimulator.tsx` runs a `setInterval` at `state.gameConfig.clockSpeed` and dispatches `RUN_MATCH_ACTIONS` per tick until minute 90, then `END_ROUND_FOR_ALL_CHAMPIONSHIPS` and navigates to `TeamStandings`.

### Routing

No router. `src/App.tsx` switches on `state.currentScreen` (a string matching the page component name) to pick a page. Navigate with `engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamStandings' })`.

### Championships

A `ChampionshipContainer` holds `playableChampionship` plus optional `promotionChampionship` / `relegationChampionship`; rounds run for all of them simultaneously (`START_ROUND_FOR_ALL_CHAMPIONSHIPS`, etc.) so AI leagues stay in sync. `Championship` is a discriminated union — `numberOfPromotableTeams` and friends only exist when `isPromotable: true` (same for relegation), so narrow on those booleans before accessing.

Fixtures are built by round-robin rotation in `ChampionshipService.createMatches` (single leg, then mirrored for the return leg).

## Conventions

- Path aliases (`~domain/*`, `~use-cases/*`, `~presentation/*`, `~game-engine/*`, `~infrastructure/*`, `~services/*`, `~utils/*`) are configured in `vite.config.ts`, `tsconfig.json` **and** `jest.config.js`. Almost all existing code still uses relative imports; if you add an alias, add it in all three places.
- Prettier: single quotes, semicolons, 100 col, es5 trailing commas.
- UI text goes through i18next (`src/presentation/locales/{en,pt-BR}.json`). Default `en`, fallback `pt-BR`.
- Tailwind v4 via `@tailwindcss/vite` — no `tailwind.config.js`. Pixel-art styling, `font-press-start`.
- Backend-ish tests live in `tests/` mirroring `src/`; React component tests sit next to the component as `*.test.tsx`.

## Workflow

Work on `dev`; PRs target `dev`, not `main`.

## Additional docs

`docs/GameEngine.md` (engine usage), `docs/FolderRestructuring.md` (layer rules), `docs/RefactorPlan.md` (entity field reference), `docs/PlayerXpSystem.md` (spec for the XP-based player strength progression — see `PlayerProgressionService.ts`).
