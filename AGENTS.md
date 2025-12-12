# Repository Guidelines

## Project Structure & Module Organization
Keep the deliverables inside `Course_Project_Plan/` so the root stays lean. That folder currently holds `README.md` (project instructions and architecture), `Detailed_Prompts.md` (task breakdowns), and the scaffolded modules described in the README. Within the submitted zip, mirror the recommended tree: `src/algorithms`, `src/components`, `src/utils`, a `release/` bundle, `res/manual_images/`, and `doc/` for reports and manuals. Treat `src/` as the primary workspace for TypeScript/React code, with `algorithms` owning the animation-layer logic and `components` owning the UI.

## Build, Test, and Development Commands
- `npm install`: populate `node_modules` before any command.
- `npm run build`: emits the production bundle into `release/dist/` (as sketched in the README) and needs to complete before you export deliverables.
- `npm run start` or `npm run dev`: spin up the dev server so you can interact with the visualization during development; keep the browser pointed at `http://localhost:3000` (or whatever port the frontend prints) to validate animation steps while coding.
- `npm run lint`/`npm run format` (if present): run these before commits to ensure consistent formatting across `.ts`, `.tsx`, and `.json` files.

## Coding Style & Naming Conventions
Embrace TypeScript/React idioms: 2-space indentation, trailing commas only where the formatter demands, and short, descriptive identifiers (e.g., `SortingStats`, `SortAlgorithm`). Keep React components in PascalCase; algorithm classes inherit from `SortAlgorithm` and stay in `src/algorithms`. Prefer camelCase for functions and object properties, and keep folder names plural for collections (`algorithms`, `components`, `utils`).

## Testing Guidelines
The project currently relies on the standard Node.js stack, so drop new tests under `src/__tests__` or beside the modules they target with `.test.ts`/`.test.tsx` suffixes. Run `npm test` (or the configured script) to execute the suite. Aim to cover core animation/state transitions and ensure `SortAlgorithm` subclasses emit the expected `AnimationStep` arrays before merging. Provide sample inputs in the README if you add new scenarios.

## Commit & Pull Request Guidelines
This repo is not yet history-backed, so adopt a consistent format such as `type(scope): short description` (e.g., `feat(algorithms): add merge sort tracing`). Each PR should bundle a short summary, testing steps, and, if relevant, a screenshot of the UI or test output that proves the change works locally.

## Optional Notes
Document any AI commentary helpers you add in `Detailed_Prompts.md` so future contributors understand how rules or heuristics are wired into the simulation logic described in the README.
