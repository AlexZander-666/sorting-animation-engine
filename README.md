# Sorting Animation Engine

A Vite + React + TypeScript project that visualizes sorting algorithms with synchronized animation steps, benchmarking, and documentation tailored for the course project requirements. The app supports six internal sorting algorithms plus an external merge simulation, and exposes dashboards, benchmarking reports, and AI-style commentary.

## Features
- Unified `SortAlgorithm` abstraction with command-style step recording (compare, swap, overwrite, external I/O).
- Visualizer with play/pause/reset controls, drag-to-seek via reset + fast-forward, and safeguards for >512 items or >200,000 recorded steps.
- Benchmark mode with Worker-based execution fallback to main thread plus algorithm skip thresholds (O(n²) ≤ 2,000, O(n log n) ≤ 50,000).
- External merge simulation showing disk chunks and memory buffers, including `split`, `load`, `write`, and `comparisonDetails` steps.
- Detailed report (`doc/Report.md`) and user manual (`doc/User_Manual.md`) that cover architecture, validation strategy, and full reproduction steps.

## Directory Layout
```
Course_Project_Plan/
├── src/                  # React + TS source (algorithms, components, contexts, utils, workers)
├── public/               # Static public assets consumed by Vite
├── release/dist/         # Production build output from `npm run build`
├── res/manual_images/    # Screenshots referenced in docs/manual
├── doc/                  # Report & user manual Markdown files
├── package.json          # Scripts and dependencies
└── README.md             # You are here
```

## Getting Started
### Prerequisites
- Node.js ≥ 20.19.0 (20.18.3 works with warnings); npm ships with Node.
- Modern browser (Chrome, Edge, or Firefox) for previewing the UI.

### Installation
```bash
# 从仓库根目录执行
npm install
```

### Development
```bash
npm run dev
# Visit the printed URL (default http://localhost:5173/)
```

### Linting
```bash
npm run lint
```

### Build & Preview
```bash
npm run build     # emits production bundle into release/dist/
npm run preview   # optional: serve the release build for local checks
```
The `release/dist/` directory is versioned because it is part of the submission package. For release-only consumption, serve that folder statically or run `npx serve release/dist`.

## Submission Checklist
1. Ensure `release/dist/` is refreshed via `npm run build`.
2. Include `src/`, `release/`, `res/`, and `doc/` when preparing the final archive (`学号姓名.zip` as required).
3. Keep `res/manual_images/` populated with the screenshots referenced in the docs.

## Documentation
- `doc/Report.md` – Course design report with system architecture, algorithms, testing strategy, and future work.
- `doc/User_Manual.md` – Step-by-step reproduction guide, UI walkthrough, benchmark instructions, and FAQ.
- `AGENTS.md` & `Project_Execution_Plan.md` – Additional guardrails, execution phases, and task guidelines.

## Notes
- Benchmark mode prefers Web Workers; when unsupported, it falls back to the main thread but enforces input thresholds to avoid UI freezes.
- External sort steps enforce logical memory capacity (10 elements) and surface errors when exceeded.
- Error messages and AI commentary flag skipped algorithms, oversized inputs, or invalid data to guide users toward safe usage.
