# 项目审查报告（改进方案）

## 问题清单
- [高] 数据解析缺陷：`src/utils/data.ts:13-19` 在 `filter(Boolean)` 之后才转数字，导致合法的 `0` 被丢弃，也无法解析换行分隔/空格分隔的样本文件，与用户手册描述（CSV/TXT 多行数字）不符。
- [高] 外部排序仿真与规格不符：`src/algorithms/ExternalSort.ts:10-105` 使用全局 `MEMORY_LIMIT=40` 且强制 `chunkCount ≤ 4`，会在 160+ 个元素时直接抛错，与文档中“10 元素内存上限、可扩展到大规模 Benchmark”冲突；块内排序后只记录首个 `writeToDisk`，多路归并阶段也没有内存容量检查或分块加载指令，磁盘/内存视图无法反映真实过程。
- [中] 可视化超限处理偏弱：`src/components/SortingVisualizer.tsx:246-287` 对超过 `MAX_VISUAL_ELEMENTS` 的输入仅截断并继续运行，没有按设计给出“仅支持 Benchmark 模式”的硬拦截；步骤超限同样只在生成后抛错，缺少用户提示。
- [中] Benchmark 未真正暂停动画：`src/components/BenchmarkReport.tsx:81-171` 仅调用 `setVisualizerState({ status: 'paused' })`，未触发实际的 `pause` handler，若可视化正在播放会继续占用计时器并与 Benchmark 争用数据。
- [中] Worker 支持状态未落地：`src/context/SortingContext.tsx:12-40` 没有 `isWorkerSupported`/模式标志，UI 无法提示 Worker 降级或据此调整阈值策略，偏离 `Project_Execution_Plan.md` 的阶段 1 要求。
- [中] 构建产物未被 ESLint 忽略：`eslint.config.js:8-12` 仅忽略 `dist/`，未忽略已版本化的 `release/dist/`，`npm run lint` 会扫描压缩后的构建文件，容易报格式错误或导致性能退化。
- [中] 文档与资源缺失：`Project_Execution_Plan.md` 声明与 `Detailed_Prompts.md`、`Audit_Report.md` 对齐，但仓库缺失前者；`doc/Report.md`、`doc/User_Manual.md` 要求的 `res/manual_images/` 目录和截图也不存在。
- [低] 入口信息占位：`index.html:7-12` 标题仍为 `temp`，与交付名称不符，易影响评分或 SEO。
- [中] 缺少自动化校验：未提供 `src/__tests__` 或同目录下的 `.test.ts/.test.tsx` 覆盖核心排序逻辑、外排序内存限制和动画步数边界，违背仓库指南中的测试建议。

## 改进计划
1. **修复数据解析**：重写 `parseInputToArray`，支持逗号/换行/空格分隔，保留 `0`，并在 Dashboard 侧对超出范围的值给出提示。
2. **重构外排序仿真**：在 `ExternalSort` 内部定义 `MEMORY_CAPACITY=10` 和内存计数；允许任意块数切分；在每次加载/写回时检查容量；为每个写回动作记录完整的 `writeToDisk`，并在多路归并时按输出缓冲块更新磁盘状态。
3. **加强可视化拦截与提示**：在 `SortingVisualizer` 初始化前检测元素数和预估步数，超过阈值直接阻断播放并提示切换 Benchmark；保留截断逻辑仅用于显示的同时提供显式警告。
4. **确保 Benchmark 暂停动画**：通过 `VisualizerContext` 调用实际的 `pause` handler（或暴露新的 `pausePlayback`），在跑分前清理计时器，避免与动画并行。
5. **补充 Worker 能力标志**：在 `SortingContext` 初始化时检测 Worker 支持，暴露 `isWorkerSupported`；Dashboard/Benchmark 根据该标志提示降级并可调整阈值/按钮状态。
6. **更新 ESLint 忽略列表**：在 `eslint.config.js` 增加 `release/dist/**`、`node_modules/**` 等规则，避免对构建产物和依赖进行 lint。
7. **补齐文档与资源**：补充 `Detailed_Prompts.md`（提示规则/AI 评语逻辑）和本审查文件；创建 `res/manual_images/` 并放置 README/手册引用的截图。
8. **完善入口与品牌信息**：将 `index.html` 的标题/描述更新为项目正式名称，确保发布页信息一致。
9. **增加自动化测试**：为各排序算法添加单元测试，覆盖 `run(true)/run(false)` 一致性、步数上限、外排序内存容量错误分支和阈值跳过策略。
