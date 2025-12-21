# 项目审查与改进方案（2025-12-12）

## 发现的问题
- [高] `README.md:30` 指向不存在的路径 `Course_Project_Plan`，当前仓库根目录直接包含源码与资源，按文档指令进入目录会失败。
- [中] `README.md:59-61` 引用缺失的 `Project_Execution_Plan.md` 文件，导致贡献者找不到承诺的执行计划。
- [中] `res/manual_images/` 仅有占位 README，`doc/Report.md` 与 `doc/User_Manual.md` 中要求的 `ui_overview.png`、`external_view.png`、`benchmark.png` 等截图缺失，交付包不完整。
- [中] `doc/Audit_Report.md` 内容已与现有代码状态不符（例如声称外排使用 40 元素内存、数据解析丢失 0 等），继续保留会误导读者。
- [中] `src/components/Dashboard.tsx:60-84` 对超过 `MAX_VISUAL_ELEMENTS` 的输入仅截断后继续可视化；`Detailed_Prompts.md` 规范要求“超限直接拦截并提示改用 Benchmark”，当前行为存在规范偏差且可能让用户误以为完整数据被展示。
- [低] `src/algorithms/ExternalSort.ts` 内部硬编码 `MEMORY_CAPACITY = 10`，但 `utils/constants.ts` 已定义 `MEMORY_LIMIT`。两处未统一，未来调整阈值或 UI 提示时容易遗漏。
- [低] `src/components/BenchmarkReport.tsx` 中被阈值跳过的算法使用枚举 slug（如 `externalMerge`）作为展示名，而实际运行成功时展示类名 `ExternalSort`，表格可读性与一致性较差。

## 改进方案
1. **修正文档路径**：更新 `README.md` 的安装步骤，移除或改为实际存在的根目录路径；若仍需 `Course_Project_Plan/` 结构，则补充对应目录并移动内容保持一致。
2. **补齐缺失文档**：补充 `Project_Execution_Plan.md`（或在 `README.md` 中删除该引用），确保外部读者能找到执行计划或不会被误导。
3. **完善交付资源**：按照报告和手册要求生成并存放截图至 `res/manual_images/`，同步更新两份文档中的文件名/路径，移除占位说明。
4. **刷新审查报告**：重写 `doc/Audit_Report.md` 或用当前文件替换，反映最新代码与风险，避免过时结论造成误解。
5. **严格执行可视化上限**：在数据录入和 `SortingVisualizer` 初始化阶段对超限数据直接拒绝播放并提示改用 Benchmark，移除截断继续的逻辑，使行为与规范一致。
6. **统一内存阈值常量**：将外排序的内存上限引用到 `utils/constants.ts` 的 `MEMORY_LIMIT`（或删除未用常量），并在 UI/文档中统一来源，避免配置漂移。
7. **优化 Benchmark 展示名**：为跳过的算法复用与执行成功行一致的可读名称（如 `ExternalSort`/中文标签），确保表格呈现一致且易读。
