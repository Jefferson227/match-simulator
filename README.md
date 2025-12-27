# Match Simulator

## 📝 Description
Arcade-inspired football manager that lets you pick a club, set your formation, and simulate a season across Brazilian championships with quick match loops and standings tracking.

## 🎮 Try it live
- Play now: https://match-simulator.netlify.app/

## 🛠️ Stack
- Vite + React + TypeScript for a fast, component-first UI.
- Tailwind CSS (v4) for the pixel-art styling and responsive layout.
- React Contexts coordinate global state: `GeneralContext` routes screens, `ChampionshipContext` stores league/team data, and `MatchContext` drives fixtures and results.
- i18next handles translations for on-screen text.

## 💻 Installation
1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Optional: run tests with `npm test` or build for production with `npm run build`.

## 🤝 Contribution
- Fork the repository, base your work on the `dev` branch, and open a pull request back to `dev`.
- Please keep changes scoped and include tests or notes on how to verify gameplay flows when relevant.
