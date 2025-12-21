# Sorting Animation Engine

A Vite + React + TypeScript project that visualizes sorting algorithms with synchronized animation steps, benchmarking, and documentation tailored for the course project requirements. The app supports six internal sorting algorithms plus an external merge simulation, and exposes dashboards, benchmarking reports, and AI-style commentary.

## Features
- Unified `SortAlgorithm` abstraction with command-style step recording (compare, swap, overwrite, external I/O).
- Visualizer with play/pause/reset controls, drag-to-seek via reset + fast-forward, and safeguards for >512 items or >200,000 recorded steps.
- Auto down-sampling for large arrays plus dataset presets (random, nearly-sorted, reverse, duplicate-heavy, outliers) to illustrate different input distributions.
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

## Developer Guide (快速上手扩展)
### 新增排序算法
1. 在 `src/types.ts` 中为新算法添加 `SortingAlgorithmType` 枚举项。
2. 在 `src/algorithms/` 中创建对应的 `XxxSort.ts`，继承 `SortAlgorithm`，仅通过 `compare / swap / overwrite`（及外排 I/O 步骤）修改内部数组。
3. 在 `src/algorithms/index.ts` 的 `createAlgorithm` 工厂中注册新算法。
4. （如需显示标签）在 `src/utils/labels.ts` 添加映射；UI 会自动读取。
5. 如需要新的阈值或护栏，更新 `src/utils/constants.ts` 与 `Detailed_Prompts.md`。
6. 补充单测（`src/__tests__/algorithms.test.ts`），确保 `run(true)` / `run(false)` 结果一致。

### SortStep 语义速查
- `compare { indices: [i, j] }`：只读比较；UI 高亮 active。
- `swap { indices: [i, j] }`：交换两位置。
- `overwrite { index, value }`：写入指定位置。
- `splitToChunks { chunks }`：外排分块。
- `loadChunkToMemory { chunkId, data }`：外排将块加载到内存。
- `writeToDisk { chunkId, index, value }`：外排写回磁盘/输出块。
- `comparisonDetails { indices, winnerIndex }`：外排归并时的候选与胜出块。

### 护栏参数（可调但需同步文档）
- 元素上限：`MAX_VISUAL_ELEMENTS = 512`
- 步骤上限：`MAX_STEPS = 200_000`
- 外排内存上限：`MEMORY_LIMIT = 10`（概念演示）
- Benchmark 阈值：O(n²) `QUADRATIC_THRESHOLD = 2_000`；O(n log n) `N_LOG_N_THRESHOLD = 50_000`

### Benchmark 运行策略
- Web Worker 优先，无法使用时主线程降级并保留阈值保护。
- 每个算法默认运行 3 次，展示中位/均值；运行中可取消，取消后会重置状态。

## Notes
- Benchmark 模式若环境不支持 Worker，会自动降级到主线程并仍执行阈值保护。
- 外部归并的内存上限为 10（概念演示），超限会抛出错误提示。
- 护栏与错误提示会主动指出跳过的算法、超大数据或无效输入，便于用户调整。
