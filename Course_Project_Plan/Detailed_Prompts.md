# 规则提示与 AI 评语逻辑说明

本项目的“AI 评点”与保护机制基于以下规则模板：

1. **阈值保护**  
   - O(n²) 算法（冒泡、选择、插入）在 `QUADRATIC_THRESHOLD`（默认 2000）以上跳过；  
   - O(n log n) 算法及外部归并在 `N_LOG_N_THRESHOLD`（默认 50000）以上跳过；  
   - 被跳过的算法在 Benchmark 表格中标记 `skipped: true`，评语必须包含跳过原因提示。

2. **Worker 降级提示**  
   - 在 `SortingContext` 中暴露 `isWorkerSupported`，用于 UI/逻辑判断是否可用 Web Worker。  
   - 如 Worker 创建失败，Benchmark 自动降级到主线程并仍应用阈值保护。

3. **评语生成策略（`generateAICommentary`）**  
   - 汇总最快/最慢算法及写入次数最多的算法，生成“最佳表现”“最慢”“写入次数最多”三条信息。  
   - 若数据规模大且快速排序胜出，补充 O(n log n) 优势说明；若小规模且冒泡最快，提示常数优势。  
   - 若存在跳过算法，附加“为保护浏览器响应能力，以下算法被跳过：...”。

4. **外排序内存限制**  
   - `ExternalSort` 内部固定 `MEMORY_CAPACITY = 10`，任何加载或块大小超过该容量会抛出错误。  
   - 记录步骤顺序：`splitToChunks` → `loadChunkToMemory`（逐块）→ 块内排序并 `writeToDisk` → 多路归并期间的 `loadChunkToMemory` / `comparisonDetails` / `writeToDisk`。

5. **可视化保护**  
   - 可视化模式最大元素数 512；超过则直接拦截并提示改用 Benchmark。  
   - 动画步骤上限 200,000；超过抛错并提示缩减输入或切换 Benchmark。

6. **交互提示**  
   - 输入解析接受逗号/空格/换行；可视化模式下会将 0/负数钳制到 `MIN_VALUE=5`，Benchmark 模式可查看原始值；文件导入超过 10MB 提示错误。  
   - Benchmark 前先暂停可视化，避免计时器干扰。

如需扩展新算法或调整阈值，请同步更新本文件，确保评语和保护逻辑一致。
