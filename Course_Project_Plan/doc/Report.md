# 算法动画展示引擎 —— 课程设计报告

> **作者**：马奕聪 / 2450417  
> **提交目录**：`src/`、`release/`、`res/`、`doc/`  
> **引用图片**：存放于 `res/manual_images/` 中，例如 `ui_overview.png`

---

## 1. 项目概述

### 1.1 项目背景
本项目旨在构建一个基于 Web 的排序算法动画展示引擎，通过可配置的数据源、动画播控与横向性能对比，帮助学习者理解内部排序与外排序的执行过程。项目强调：

- **接口 / 抽象层设计**：统一的 `SortAlgorithm` 抽象类以及各种 `SortStep` 指令；
- **动画可视化体验**：柱状图 + 外部排序磁盘/内存双层视图；
- **数据分析与 Benchmark**：一次性跑完 7 种算法并给出“AI”点评。

### 1.2 目标与范围
- 支持 6 种内排序 + 1 种外部归并排序；
- 可视化比较 / 交换 / 写入动作，并提供暂停、重置、拖拽等交互；
- 允许自定义数据源、随机生成、文件导入；
- 提供可切换的 Benchmark 模式，输出执行时间、比较次数、交换次数与内存估算；
- 产出课程报告与用户手册，确保根据文档即可重现环境。

### 1.3 评分要点对照
| 指标 | 设计落实 | 说明 |
| --- | --- | --- |
| 代码合理性 | 同步命令模式、抽象类 + 策略工厂 | `src/algorithms/*.ts` |
| 动画效果 | 柱状图、外部排序磁盘/内存视图、颜色标识 | `SortingVisualizer.tsx` |
| 展示有效性 | Dashboard 控制、Benchmark 表格 + AI 点评 | `Dashboard.tsx` / `BenchmarkReport.tsx` |

---

## 2. 需求分析

### 2.1 功能需求
1. **算法支持**：冒泡、选择、插入、快速、归并、堆排序，以及模拟外部归并排序；
2. **交互控制**：播放、暂停、速度调节、进度拖拽、数据集管理；
3. **数据源**：手动输入、随机生成、CSV/TXT 文件导入，且支持不同规模；
4. **Benchmark**：一次运行全部算法，输出统计数据 + AI 规则点评；
5. **结果展示**：柱状图/磁盘视图、性能表、截图 / 文档。

### 2.2 非功能需求
- **性能**：在动画模式下限制元素数量（≤512），并对步骤数量设置上限（200,000）；Benchmark 支持 Web Worker 或阈值跳过，避免 UI 假死；
- **可靠性**：采用 `SortStep` 命令录制，确保 `run(true)` 与 `run(false)` 结果一致；
- **可扩展性**：通过 `SortingAlgorithmType` 枚举和工厂函数可轻松添加新算法；
- **可重现性**：`npm install → npm run dev/build` 即可启动 / 构建。

---

## 3. 系统设计

### 3.1 高层架构
```
src/
├── types.ts                 # type 定义 & enums
├── context/
│   ├── SortingContext.tsx   # 全局数据 & 配置
│   └── VisualizerContext.tsx# 播放状态 & 控制接口
├── algorithms/
│   ├── SortAlgorithm.ts     # 抽象基类
│   ├── *.ts                 # 6 内排序 + 外部归并
│   └── index.ts             # 工厂方法
├── components/
│   ├── Dashboard.tsx        # 数据输入 & 控制
│   ├── SortingVisualizer.tsx# 可视化引擎
│   └── BenchmarkReport.tsx  # 跑分 & AI 点评
├── utils/                   # 常量、随机数据、Benchmark 工具
└── workers/benchmarkWorker.ts # Web Worker for Benchmark
```

### 3.2 命令模式 (Command Pattern)
- `SortAlgorithm` 同步执行 `sort(recordSteps)`，内部仅调用 `compare / swap / overwrite` 等基础操作；
- 若 `recordSteps = true`，则把动作封装成 `SortStep` 推入数组；否则只更新计数器，不记录步骤；
- UI 通过 `SortingVisualizer` 逐条取出 `SortStep`，以 `Reset + 快速重放` 实现拖拽到任意步骤。

### 3.3 播放控制与上下文
- `SortingContext`：维护数组、算法、速度、模式；
- `VisualizerContext`：暴露 `play/pause/reset/seek` 钩子，供 Dashboard 播放控件调用；
- `SortingVisualizer` 注册 handler，并在组件内部管理 `requestAnimationFrame + setTimeout` 循环。

### 3.4 外排序模拟
- 每个 `SortStep` 包含 `splitToChunks`、`loadChunkToMemory`、`writeToDisk`、`comparisonDetails` 等指令；
- 通过 `MEMORY_LIMIT` 模拟内存限制，超限时直接抛出错误提示；
- 可视化层显示上半部分（内存缓冲区）与下半部分（磁盘块），并强调为“浏览器环境下的逻辑演示”。

---

## 4. 核心模块实现

| 模块 | 说明 |
| --- | --- |
| `SortAlgorithm` 抽象类 | 定义 `run(recordSteps)`、`compare`/`swap`/`overwrite`、统计信息与步骤上限保护 |
| 内排序六兄弟 | 冒泡/选择/插入基于简单循环；快速/归并/堆排序采用递归实现，统一调用基类钩子 |
| `ExternalSort` | 依据 chunk 分割 → 块内排序 → 多路归并生成外排序指令 |
| `SortingVisualizer` | 在命令模式下执行动画，支持拖拽、暂停/继续、外部视图 |
| `Dashboard` | 数据输入、文件导入、随机生成、算法选择、速度滑块、播放/进度控制 |
| `BenchmarkReport` | 启动 Web Worker 执行 `run(false)`，或依赖阈值策略跳过；输出表格 + `generateAICommentary` |

---

## 5. 关键技术与难点

### 5.1 同步命令录制
- 解决了旧方案中 `async/await` 与 Benchmark 模式冲突的问题；
- 可保证 `run(false)` 在毫秒级完成，适合在 Worker 中批量运行。

### 5.2 性能保护
- 可视化模式：元素数 ≤512、步骤 ≤ 200,000、拖拽使用重放策略；
- Benchmark 模式：优先用 Worker，若不支持则根据算法复杂度限制输入规模（O(n²) ≤ 2,000；O(n log n) ≤ 50,000）；
- 当算法被跳过时，在表格与 AI 点评中同步提示。

### 5.3 外部排序可视化
- 通过 `SortStep` 扩展指令配合 UI 双视图，实现“磁盘块 -> 内存 -> 磁盘回写”的动画效果；
- 内存容量固定为 10 个元素，`loadChunkToMemory` 超限立即抛错，所有写回都记录为 `writeToDisk`，并在多路归并期间同步更新“输出块”；
- `comparisonDetails` 用于高亮某次多路归并的候选块与获胜块。

---

## 6. 界面与交互示例
> 以下截图请放在 `res/manual_images/` 中，并在手册中引用：

| 描述 | 建议截图文件 |
| --- | --- |
| Dashboard + 播放控制 | `../res/manual_images/ui_overview.png` |
| 外排序磁盘/内存视图 | `../res/manual_images/external_view.png` |
| Benchmark 表格与 AI 点评 | `../res/manual_images/benchmark.png` |

---

## 7. 测试与验证
- **自测脚本**：手工验证 `run(true)` 与 `run(false)` 排序结果一致；
- **功能测试**：输入随机数组、手动输入、CSV 文件；播放/暂停/拖拽、速度调节；
- **压力测试**：对不同算法逐步增大输入，确认阈值提示和“跳过���逻辑；
- **构建测试**：`npm run build` 直接产出 `release/dist/`，以 `npm run preview` 验证发布版本。

---

## 8. 构建与部署
| 步骤 | 指令 | 说明 |
| --- | --- | --- |
| 安装依赖 | `npm install` | Node.js ≥ 20.18.3（推荐 20.19+） |
| 开发模式 | `npm run dev` | 打开 `http://localhost:5173/` |
| 代码检查 | `npm run lint` | 可选 |
| 构建发布 | `npm run build` | 直接生成 `release/dist/`（无需手动复制） |
| 预览发布版 | `npm run preview` | 验证打包成果 |

---

## 9. 总结与展望

### 9.1 成果总结
- 完成了 7 种算法的统一动画架构；
- 提供成熟的控制面板与 Benchmark 分析；
- 外排序视图和 AI 点评增强了展示有效性；
- 符合作业要求的文档与打包结构。

### 9.2 改进方向
- 增加更多算法（如 Shell、Radix 等）；
- 提供移动端布局或响应式优化；
- 接入真实 AIGC 接口，输出更丰富的自动化点评；
- 引入单元测试框架（Jest + RTL）覆盖核心逻辑；
- 支持动画导出为 GIF / 视频。

---

> **附录**：更多截图与日志请参考 `res/manual_images/` 及 `README.md`。如需 PDF 可将本 Markdown 转换后提交。
