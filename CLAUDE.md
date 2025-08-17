# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based football/soccer match simulator with PWA capabilities. The application simulates football matches between Brazilian championship teams (Série A, B, and C) with detailed player movement, actions, and match mechanics.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint for code quality
- `npm test` - Run Jest tests
- `npm run preview` - Preview production build

## Architecture

### State Management
The application uses React Context + useReducer pattern with three main contexts:
- **GeneralContext**: App-wide state including current screen, base team, match teams, and clock speed
- **ChampionshipContext**: Championship-related data and state
- **MatchContext**: Match simulation state and controls

### Screen Navigation
The app uses a screen-based navigation system controlled by `state.screenDisplayed`:
- `InitialScreen` - Landing page
- `ChampionshipSelector` - Choose championship
- `TeamManager` - Manage team details
- `TeamSelector` - Select teams for matches
- `MatchSimulator` - Run match simulation
- `TeamStandings` - View league tables
- `TeamAdditionalInfo` - Team details view
- `ChampionshipDetails` - Championship information
- `TeamViewer` - Team roster and player details

### Project Structure
- `src/components/` - React components organized by feature
- `src/contexts/` - React contexts for state management
- `src/reducers/` - State reducers and helpers
- `src/services/` - Business logic and data services
- `src/assets/championship-teams/` - Team data organized by league (JSON files)
- `src/types/` - TypeScript type definitions
- `src/locales/` - i18n translation files (en.json, pt-BR.json)

### Match Simulation Logic
The core simulation follows detailed rules documented in:
- `ActionLogic.md` - Player actions, decision making, and success rates
- `MoveLogic.md` - Player movement patterns and field positioning

Key concepts:
- Players have positions (GK, DF, MF, FW) with different behavior patterns
- Actions include Move, Pass, Shoot, Intercept, Defend Shot
- Field is divided into defensive, middle, and offensive zones
- Success rates vary by field position and player force (1-99)

### Team Data Structure
Teams are stored as JSON files with:
- Basic info (name, country, league)
- Player rosters with positions, forces, and attributes
- Located in `src/assets/championship-teams/` by league

### Testing
- Jest + React Testing Library setup
- Test files located alongside components (`.test.tsx`)
- Setup file: `src/setupTests.ts`

### Internationalization
- Uses react-i18next for i18n
- Supports English and Portuguese (Brazil)
- Translation files in `src/locales/`

### Build & Deployment
- Vite build system with React SWC plugin
- PWA support via vite-plugin-pwa
- TailwindCSS for styling
- TypeScript with strict mode enabled

### Code Quality
- ESLint with React-specific rules
- TypeScript strict mode with additional checks
- No unused locals/parameters enforcement