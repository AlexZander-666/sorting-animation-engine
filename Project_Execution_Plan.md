# Project Execution Plan

本文件为仓库约定的执行计划与协作指引，便于新贡献者快速对齐工作方式。

## 目标与范围
- 交付一个可运行的排序动画与 Benchmark 演示（React + TypeScript）。
- 遵循 `AGENTS.md` 中的目录、脚本与编码规范。
- 保持 `src/` 为主要开发目录，`release/dist/` 存放构建产物，`res/manual_images/` 存放文档截图。

## 阶段规划
1. **环境与规范对齐**
   - 运行 `npm install`，确保 Node 20+。
   - 阅读 `AGENTS.md`、`README.md`，确认目录与提交要求。
2. **功能迭代**
   - 优先实现/修复核心逻辑：算法步骤记录、可视化保护（元素数与步数阈值）、Benchmark 跳过策略、外排序内存约束。
   - 文档与 UI 同步更新，确保提示与行为一致。
3. **质量保障**
   - 增补或修复单元测试（`vitest`），覆盖步骤上限、阈值跳过、外排序内存、数据解析等关键路径。
   - 如有 lint/format 脚本可选运行（`npm run lint`）。
4. **交付与打包**
   - 构建发布包：`npm run build`，产物位于 `release/dist/`。
   - 更新 `doc/`、`res/manual_images/`，确保 README/手册引用的资源齐全。
   - 打包提交所需目录：`src/`、`release/`、`res/`、`doc/`，遵循课程命名要求。

## 角色与职责
- **开发者**：在 `src/` 目录内实现算法、组件、工具函数，保持 2 空格缩进与 TS/React 规范。
- **文档维护者**：同步更新 `README.md`、`doc/Report.md`、`doc/User_Manual.md` 与提示文件。
- **审查者**：补充/更新 `doc/Audit_Findings_*.md`，列出风险与改进建议。

## 变更准则
- 遵循 `type(scope): message` 提交格式（若启用 Git）。
- 不要删除构建产物目录，但在构建前可清理旧产物。
- 需要新增辅助规则/提示时，同步更新 `Detailed_Prompts.md` 以保持一致性。

## 参考
- `AGENTS.md`：仓库守则与结构要求。
- `Detailed_Prompts.md`：AI 评语与阈值保护规则。
- `doc/Audit_Findings_*.md`：历次审查与改进建议。
