# 项目审查报告（状态更新 2025-12-21）

> 本文件用于说明上一版审查中提到的问题已被收敛，避免过时结论误导阅卷或后续开发。

## 当前状态概览
- **数据解析已收敛**：`sanitizeInput` 支持逗号/空格/换行，默认会将 0/负数钳制到 `MIN_VALUE=5` 以保证柱状图可见，并在 Dashboard 进行文案提示。输入大小超出 512 会直接阻断动画并提示切换 Benchmark。
- **外部排序模型完善**：`ExternalSort` 固定 `MEMORY_LIMIT=10` 分块并记录 `split → load → comparisonDetails → write` 全链路，视图区分候选块/胜出块、内存进度和输出块进度。
- **播放/调速稳定**：播放状态机迁移至 hook，速度使用 `useRef` + 计时器重调度；柱状图使用稳定 key；暂停/重置会显式取消 `setTimeout` 与 `requestAnimationFrame`。
- **Benchmark 可靠性**：跑分前强制暂停动画，支持取消/进度显示/多次运行取中位数；Worker 支持状态通过 `isWorkerSupported` 暴露，失败自动降级到主线程。
- **工程与规范**：`eslint.config.js` 忽略 `release/dist` 与 `node_modules`；`index.html` 标题已更新；未使用的 context 字段已移除，算法标签在 `utils/labels.ts` 统一。
- **测试覆盖**：Vitest 覆盖算法 `run(true)/run(false)` 一致性、步骤上限、外排分块不超内存、阈值跳过保护、输入解析（含换行/空格）。新增数据分布预设与相关文案在 README/使用手册同步。

> 历史审查条目已被吸收进上述状态概览，如需查看旧版本，请查阅 git 历史。
