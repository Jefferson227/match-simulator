# Folder Restructuring Plan

## Goal

Keep the project as a single-package layered application, but reorganize the source code so frontend/presentation concerns are not mixed at the repository root with domain, use-case, engine, and infrastructure concerns.

This is **not** a monorepo migration.

## Target Structure

```text
src/
  presentation/
    assets/
    components/
    contexts/
    locales/
    pages/
    providers/

  domain/
    constants/
    enums/
    features/
    models/
    results/
    services/
    utils/

  use-cases/
  game-engine/

  infrastructure/
    data/
      teams.json
      championships.json
    data-transfer-objects/
    mappers/
    repositories/

  App.tsx
  main.tsx

tests/
  domain/
  use-cases/
  game-engine/
  infrastructure/

docs/
```

## Layer Responsibilities

### `src/presentation`

Contains React/UI concerns:

- pages
- components
- contexts
- providers
- locales
- UI assets

### `src/domain`

Contains business/game concepts and rules:

- models
- enums
- constants
- features
- results
- services
- domain-level utils

### `src/use-cases`

Contains application orchestration logic.

### `src/game-engine`

Contains state transitions, dispatch flow, and engine orchestration.

### `src/infrastructure`

Contains external representations and data access concerns:

- repositories
- JSON seed/config data
- DTOs
- mappers

## Folder Mapping

### Current -> Target

- `core/constants` -> `src/domain/constants`
- `core/enums` -> `src/domain/enums`
- `core/features` -> `src/domain/features`
- `core/models` -> `src/domain/models`
- `core/results` -> `src/domain/results`
- `core/services` -> `src/domain/services`
- `core/utils` -> `src/domain/utils`

- `core/data-transfer-objects` -> `src/infrastructure/data-transfer-objects`
- `core/mappers` -> `src/infrastructure/mappers`
- `infra/repositories` -> `src/infrastructure/repositories`
- `assets/teams.json` -> `src/infrastructure/data/teams.json`
- `assets/championships.json` -> `src/infrastructure/data/championships.json`

- `use-cases` -> `src/use-cases`
- `game-engine` -> `src/game-engine`

- `src/components` -> `src/presentation/components`
- `src/pages` -> `src/presentation/pages`
- `src/contexts` -> `src/presentation/contexts`
- `src/providers` -> `src/presentation/providers`
- `src/locales` -> `src/presentation/locales`
- `src/assets` -> `src/presentation/assets`
  - except JSON seed files used by repositories, which move to `src/infrastructure/data`

## Architectural Rules

### Dependency Direction

Target dependency direction:

- `presentation` depends on `use-cases`, `game-engine`, and domain types when needed
- `use-cases` depends on `domain` and infrastructure access points as needed
- `game-engine` depends on `use-cases` and `domain`
- `infrastructure` depends on `domain`
- `domain` depends on nothing outside itself

### DTOs and Mappers

DTOs and mappers belong to infrastructure because they translate:

- raw persisted/external data
- into internal domain objects

They are adapter concerns, not domain concerns.

### JSON Files

`teams.json` and `championships.json` belong to infrastructure because they are external raw input data, even though they are used to build domain entities.

## Why This Structure Was Chosen

- avoids a junk-drawer `shared` folder
- keeps all source code under `src/`
- makes layered responsibilities explicit
- reflects the current architecture already emerging in the project
- avoids monorepo overhead while still improving clarity

## Recommended Migration Order

To reduce breakage, apply changes gradually in this order:

- [x] Move `infra/repositories` into `src/infrastructure/repositories`
- [x] Move JSON files into `src/infrastructure/data`
- [x] Move DTOs and mappers into `src/infrastructure`
- [x] Update repository imports
- [x] Move `core/*` into `src/domain/*`
- [x] Move `use-cases` and `game-engine` into `src/`
- [x] Move React UI folders into `src/presentation/*`
- [x] Update tests to mirror the new structure
- [ ] Add path aliases only after the structure is stable

## Scope Notes

- Keep the `docs/` folder at the repository root
- Keep this as a single-package project
- Do not introduce a monorepo structure as part of this refactor
