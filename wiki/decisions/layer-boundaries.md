---
title: Layer boundaries
type: decision
decided: 2025
status: implemented
supersedes: docs/FolderRestructuring.md, docs/RefactorPlan.md
---

# Layer boundaries

**Decision.** Keep the project a single-package layered application. Reorganise `src/` so
presentation concerns do not sit at the repository root beside domain, use-case, engine and
infrastructure concerns. **Not a monorepo migration.**

Fully implemented — every step of the original migration checklist is done. The *structure* is
documented in `CLAUDE.md` and visible in `src/`; this page keeps only the **reasoning**, which the
folder tree cannot state.

## Dependency direction

```
presentation → use-cases → domain
              game-engine ↗        infrastructure → domain
```

`domain` depends on nothing outside itself. Enforced **by convention only** — no lint rule, no build
step checks it. That is a known gap, not an oversight.

## Why things live where they do

| Placement | Reasoning |
|---|---|
| DTOs and mappers in `infrastructure` | They translate raw persisted/external data into domain objects. Adapter concerns, not domain concerns. |
| `teams.json` / `championships.json` in `infrastructure/data` | External raw input data, even though they build domain entities. |
| No `shared/` folder | Deliberately avoided as a junk drawer. |
| Everything under `src/` | Including `use-cases` and `game-engine`, which previously sat at the root. |
| Path aliases added **last** | Only after the structure was stable — which is why almost all code still uses relative imports. Aliases must be declared in `vite.config.ts`, `tsconfig.json` *and* `jest.config.js`. |

## What was rejected

- **A monorepo.** Overhead without benefit at this size.
- **A `shared` folder.** Becomes a junk drawer.

## Note on the old entity reference

`docs/RefactorPlan.md` listed every entity's fields. It was deleted rather than moved: it had drifted
(`numberOfPromotedTeams` for `numberOfPromotableTeams`, `timerSpeed` for `clockSpeed`, no
`leagueType`, no `phases`) and the models in `src/domain/models/` are self-documenting and
authoritative. Per the wiki's one rule, a fact derivable by reading the repo does not get a page.
Recoverable from git history if ever needed.
