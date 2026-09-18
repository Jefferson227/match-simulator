---
title: The player's language lives outside the game state and the save
type: decision
ticket: MS-110
decided: 2026-09-17
status: implemented
asserts:
  - file: src/infrastructure/repositories/LanguageRepository.ts
    exists: true
  - file: src/presentation/pages/LanguageSelector/LanguageSelector.tsx
    exists: true
  - file: src/presentation/locales/en.json
    path: initialScreen.language
    equals: Language
  - file: src/presentation/locales/pt-BR.json
    path: initialScreen.language
    equals: Idioma
---

# The player's language lives outside the game state and the save

**Decision.** The player picks English or Brazilian Portuguese on a Language screen reached from
`InitialScreen`. The choice is a **presentation concern**. It is kept under its own `localStorage`
key, `match-simulator-language`. It is not a field of `GameState`, not part of the saved game, and
not a `GameAction`. The screen is reached with the existing `SET_CURRENT_SCREEN`. A switch calls
i18next directly, and react-i18next re-renders every `useTranslation` consumer by itself.

## 1. Why not in `GameState` or the save

- **It must outlive a game.** The player sets it before any save exists, and New Game must not reset
  it. Anything in `GameState` is rebuilt by New Game and replaced by Load Game.
- **The save format stays put.** [[ms-108-saved-game-size]] versions the save key and abandons
  unreadable saves. A language field would have meant a version bump, or a migration, for a value
  that has nothing to do with the game.
- **The engine has nothing to add.** `GameEngine` emits on every dispatch (the known limitation in
  `CLAUDE.md`). Routing a language change through it would re-render everything once more, with no
  state for any use case to read.
- *Rejected:* a `SET_LANGUAGE` action with a `language` field in `GameState` and the save.

## 2. First launch reads the device, not a hardcoded `en`

Before MS-110, `src/i18n.ts` hardcoded `lng: 'en'`. The ticket's premise was that the game already
followed the device locale. It did not, so detection is new behaviour, not a fix.

With no stored choice, any locale starting `pt`, including `pt-PT`, maps to `pt-BR`, since it is the
only Portuguese the game ships. Everything else maps to `en`. The fallback language stays `pt-BR`.

*Rejected:* `i18next-browser-languagedetector`. It adds a dependency, query-string and cookie
lookups the game does not want, and its own storage key. The in-repo helper is about 40 lines.

## 3. What is not translated

- **Domain error messages** (`OperationResult` errors, shown on `ErrorScreen` after "Error
  message:"). They are diagnostics, not labels. Translating them would give `domain` an i18n
  dependency, and [[layer-boundaries]] rules that out.
- **Seed data**: club, championship and phase names ("1ª Fase") are names, not labels.
- **The option labels themselves** read "English" and "Português (Brasil)" whatever language is
  active, so a player can always find their own.

> **Not asserted.** That no other code path writes the language into `GameState` or the save is a
> rule, not a value. `GameStateMapper` and `GameState` are the places that would break it.

## Verification

Tests, plus a manual run in Chrome: first launch both ways, switching, persistence across reload,
Load Game and New Game, and a full women's season walked in pt-BR. That run found two overflowing
labels on `TeamAdditionalInfo`, fixed in the same ticket. Longer Portuguese labels elsewhere wrap
to two lines but stay inside their boxes.
