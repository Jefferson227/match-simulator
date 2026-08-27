# LeagueTypeSelector Screen

Plan for a new screen where the player picks **Women's League** or **Men's League** before choosing a championship. The chosen league type filters which championships `ChampionshipSelector` offers.

## Decisions

| Question             | Decision                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Position in the flow | `InitialScreen` → **New Game** → `LeagueTypeSelector` → `ChampionshipSelector` → `TeamSelector`. **Load Game** is untouched.                |
| Data scope           | Structure + filtering only. No new championship or team seed data in this change. Men's list keeps showing Série A/B; women's list is empty until data lands. |
| Data model           | `leagueType` field on each `championships.json` entry and on the `Championship` model; the selected value lives in `GameState.leagueType`.   |
| Back navigation      | `ChampionshipSelector` gains a **GO BACK** button that returns to `LeagueTypeSelector`.                                                     |

## Target flow

```
InitialScreen
  └─ New Game ─► LeagueTypeSelector
                    ├─ MEN'S LEAGUE  ─┐
                    └─ WOMEN'S LEAGUE ┴─► ChampionshipSelector (filtered by leagueType)
                                              ├─ pick championship ─► TeamSelector
                                              └─ GO BACK ─► LeagueTypeSelector
```

## Data model changes

### 1. New enum — `src/domain/enums/LeagueType.ts`

Follow the `ChampionshipType.ts` style (string-literal union, default export):

```ts
type LeagueType = 'mens' | 'womens';

export default LeagueType;
```

### 2. `src/domain/models/Championship.ts`

Add `leagueType` to `BaseChampionship`:

```ts
type BaseChampionship = {
  id: string;
  name: string;
  internalName: string;
  leagueType: LeagueType; // new
  numberOfTeams: number;
  // ...
};
```

Required (not optional) so every championship must declare its league. Note `ChampionshipRepository.getChampionships` builds partial objects with `as Championship`, so the cast keeps compiling — but that function must start carrying `leagueType` through anyway (see below), otherwise the selector can't filter.

### 3. `src/infrastructure/data-transfer-objects/ChampionshipJSONDTO.ts`

```ts
type ChampionshipJSONDTO = {
  name: string;
  internalName: string;
  leagueType: LeagueType; // new
  numberOfTeams: number;
  // ...
};
```

### 4. `src/infrastructure/data/championships.json`

Tag the two existing entries as men's:

```json
{
  "name": "BRASILEIRÃO SÉRIE A",
  "internalName": "brasileirao-serie-a",
  "leagueType": "mens",
  ...
}
```

Same for `brasileirao-serie-b`.

**Naming convention for future entries** (no data added now):

| League type | Championship   | Suggested `internalName`         |
| ----------- | -------------- | -------------------------------- |
| `mens`      | Série A        | `brasileirao-serie-a` (exists)   |
| `mens`      | Série B        | `brasileirao-serie-b` (exists)   |
| `mens`      | Série C        | `brasileirao-serie-c`            |
| `mens`      | Série D        | `brasileirao-serie-d`            |
| `womens`    | Série A1       | `brasileirao-feminino-serie-a1`  |
| `womens`    | Série A2       | `brasileirao-feminino-serie-a2`  |
| `womens`    | Série A3       | `brasileirao-feminino-serie-a3`  |

Promotion/relegation chains stay **inside** a league type — `brasileirao-feminino-serie-a1.relegationChampionshipInternalName` must be `brasileirao-feminino-serie-a2`, never a men's league. Worth adding as a data-integrity test (see Testing).

Adding a championship later also needs its teams in `src/infrastructure/data/teams.json` (team `internalName`s are global across leagues, so women's teams need distinct keys, e.g. `corinthians-feminino`).

## Repository / service / use-case changes

### 5. `src/infrastructure/repositories/ChampionshipRepository.ts`

- `getChampionship(...)`: copy `leagueType` from the DTO into `mappedChampionship`.
- `getChampionships(leagueType?: LeagueType)`: filter the JSON list before mapping, and include `leagueType` in the projection.

```ts
export function getChampionships(leagueType?: LeagueType): Championship[] {
  const championshipsJSONDTO = championshipsJSON as ChampionshipJSONDTO[];
  const filtered = leagueType
    ? championshipsJSONDTO.filter((json) => json.leagueType === leagueType)
    : championshipsJSONDTO;

  const internalNames = filtered.map((json) => {
    return {
      internalName: json.internalName,
      name: json.name,
      leagueType: json.leagueType,
    } as Championship;
  });

  return internalNames;
}
```

**Empty-list behaviour**: the current implementation throws `'No championship internal names have been found.'` when the list is empty. With women's data absent, that throw would fire on every women's selection and push the player to the error screen. Change it to only throw when the *unfiltered* source is empty, and return `[]` for a valid-but-unseeded league type; `ChampionshipSelector` then renders an empty list (see UI note below).

### 6. `src/domain/services/ChampionshipService.ts`

`getChampionships` takes the optional league type and forwards it. Signature stays `OperationResult<Championship[]>`, error path unchanged:

```ts
const getChampionships = (leagueType?: LeagueType): OperationResult<Championship[]> => {
  try {
    const result = new OperationResult(ChampionshipRepository.getChampionships(leagueType));
    result.setSuccess();
    return result;
  } catch (error) {
    // unchanged
  }
};
```

`initChampionships` needs no change — promotion/relegation lookups follow `internalName`s that already stay inside one league type.

### 7. `src/use-cases/ChampionshipUseCases.ts`

- `getChampionships(leagueType?: LeagueType): Championship[]` — pass through; keep throwing on failure (it's a read-only getter, callers wrap in try/catch per the existing convention).
- New `setLeagueType(leagueType: LeagueType): GameState` returning `{ ...this.state, leagueType }`.

`setLeagueType` is pure state, so it could equally live in `GameUseCases`. Put it in `ChampionshipUseCases` since the value only exists to scope championships; either is defensible — pick one and stay consistent.

## Game engine changes

### 8. `src/game-engine/GameState.ts`

```ts
export type GameState = {
  championshipContainer: ChampionshipContainer;
  hasError: boolean;
  errorMessage: string;
  currentScreen: string;
  leagueType: LeagueType; // new
  gameConfig: GameConfig;
};

export type GameAction =
  | { type: 'SET_LEAGUE_TYPE'; leagueType: LeagueType } // new
  | ...;
```

### 9. `src/game-engine/GameEngine.ts`

```ts
case 'SET_LEAGUE_TYPE':
  this.championshipUseCases = new ChampionshipUseCases(state);
  return this.championshipUseCases.setLeagueType(action.leagueType);
```

### 10. `src/game-engine/initialGameState.ts`

`createInitialGameState()` already returns a partial `GameState` (a known pre-existing `tsc --noEmit` error). Add `leagueType: 'mens'` as the default so the field is never `undefined` at runtime — the selector overwrites it before `ChampionshipSelector` renders.

### Save/load

`GameRepository` serialises the whole `GameState` to `localStorage`, so `leagueType` persists with no extra work. **Old saves won't have it**: `loadGame` returns `JSON.parse(...) as GameState`, so `state.leagueType` is `undefined` for them. Mitigate by defaulting at the read sites (`state.leagueType ?? 'mens'`) or by backfilling in `GameUseCases.loadGame`. Backfilling in `loadGame` is the single-point fix and is preferred.

## Presentation changes

### 11. New page — `src/presentation/pages/LeagueTypeSelector/LeagueTypeSelector.tsx`

Modelled on `ChampionshipSelector`, minus the pagination (only two options):

- `MainLayout` wrapper, `font-press-start`, background `#3d7a33`, white text — identical to `ChampionshipSelector`.
- Heading: `t('leagueTypeSelector.selectLeagueType')`.
- Two buttons reusing the championship-button classes (`w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase ...`): `t('leagueTypeSelector.womensLeague')` and `t('leagueTypeSelector.mensLeague')`.
- On click:

```tsx
const selectLeagueType = (leagueType: LeagueType) => {
  engine.dispatch({ type: 'SET_LEAGUE_TYPE', leagueType });
  engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'ChampionshipSelector' });
};
```

- Keep the same `useEffect` that re-dispatches `SET_ERROR_MESSAGE` when `state.hasError`, for consistency with the other screens.
- No data loading — the two options are static, so no `useState`/`useEffect` fetch is needed.

### 12. `src/presentation/pages/InitialScreen/InitialScreen.tsx`

**New Game** button now dispatches `screenName: 'LeagueTypeSelector'` instead of `'ChampionshipSelector'`. Its existing test asserts the old target and must be updated.

### 13. `src/presentation/pages/ChampionshipSelector/ChampionshipSelector.tsx`

- Pass the league type when loading: `championshipUseCases.getChampionships(state.leagueType)`.
- Add `state.leagueType` to the load `useEffect` dependency array (currently `[]`) so the list refreshes if the player goes back and switches league.
- Reset `currentPage` to `0` whenever `state.leagueType` changes, otherwise a page index from a longer list can leave the player on an empty page.
- Add a **GO BACK** button below the pagination row, dispatching `SET_CURRENT_SCREEN` with `'LeagueTypeSelector'`. Reuse the `teamManager.goBack` translation key or add `championshipSelector.goBack`.
- Empty list (women's, until data exists): `totalPages` is `0`, both arrows are already disabled, and the grid renders empty — acceptable, but adding a `t('championshipSelector.noChampionshipsAvailable')` message when `championships.length === 0` avoids a blank screen. GO BACK keeps the player unstuck.

### 14. `src/App.tsx`

Import the page and add the case:

```tsx
case 'LeagueTypeSelector':
  return <LeagueTypeSelector />;
```

### 15. Locales — `src/presentation/locales/{en,pt-BR}.json`

```jsonc
// en.json
"leagueTypeSelector": {
  "selectLeagueType": "SELECT LEAGUE TYPE",
  "womensLeague": "WOMEN'S LEAGUE",
  "mensLeague": "MEN'S LEAGUE"
},
"championshipSelector": {
  "selectChampionship": "SELECT CHAMPIONSHIP",
  "goBack": "GO BACK",
  "noChampionshipsAvailable": "NO CHAMPIONSHIPS AVAILABLE"
}
```

```jsonc
// pt-BR.json
"leagueTypeSelector": {
  "selectLeagueType": "SELECIONE O TIPO DE LIGA",
  "womensLeague": "LIGA FEMININA",
  "mensLeague": "LIGA MASCULINA"
},
"championshipSelector": {
  "selectChampionship": "SELECIONAR LIGA",
  "goBack": "VOLTAR",
  "noChampionshipsAvailable": "NENHUMA LIGA DISPONÍVEL"
}
```

## Testing

New:

- `src/presentation/pages/LeagueTypeSelector/LeagueTypeSelector.test.tsx` — mirror `ChampionshipSelector.test.tsx` mocking style (`useGameEngine`, `useGameState`, `react-i18next`). Assert: both buttons render; clicking each dispatches `SET_LEAGUE_TYPE` with the right value **and** `SET_CURRENT_SCREEN` with `'ChampionshipSelector'`.
- `tests/infrastructure/repositories/ChampionshipRepository.test.ts` — `getChampionships('mens')` returns only men's entries; `getChampionships('womens')` returns `[]` without throwing; `getChampionships()` returns all.
- Data-integrity test over `championships.json`: every entry has a valid `leagueType`, and every `promotionChampionshipInternalName` / `relegationChampionshipInternalName` points at an entry with the **same** `leagueType`.
- `tests/game-engine/GameEngine.test.ts` — `SET_LEAGUE_TYPE` updates `state.leagueType`.

Updated:

- `InitialScreen.test.tsx` — New Game now navigates to `LeagueTypeSelector`.
- `ChampionshipSelector.test.tsx` — `getChampionships` is called with the state's league type; GO BACK dispatches `SET_CURRENT_SCREEN` → `LeagueTypeSelector`.
- `tests/use-cases/ChampionshipUseCases.test.ts` — `setLeagueType`; `getChampionships` forwards its argument.
- Any fixture building a `GameState` or `Championship` literal needs the new required fields.

Run `npx tsc --noEmit` and diff against the pre-existing error set (see `CLAUDE.md`) — the baseline is not clean.

## Order of work

1. `LeagueType` enum, `Championship` model, `ChampionshipJSONDTO`, `championships.json` tagging.
2. Repository → service → use-case filtering chain, including the empty-list behaviour change.
3. `GameState` / `GameAction` / `GameEngine` / `initialGameState` / `loadGame` backfill.
4. `LeagueTypeSelector` page + locales + `App.tsx` case.
5. `InitialScreen` redirect, `ChampionshipSelector` filtering + GO BACK.
6. Tests.

Steps 1–3 are backwards-compatible on their own (unfiltered call sites keep working), so they can land as a separate commit ahead of the UI.

## Out of scope / follow-ups

- Seed data for Série C/D and women's A1/A2/A3 (championship entries, team rosters in `teams.json`, badge JSON under `src/presentation/assets/championship-teams/<internalName>/`).
- Any gameplay rule that differs by league type (squad size, match length, strength ranges) — the `leagueType` field is the hook for it, but nothing consumes it beyond filtering yet.
- A league-type indicator in `MainLayout` / standings headers.
