## Release 说明

该目录存放已经通过 `npm run build` 生成的静态站点，可直接用于部署或查阅作业成品。

### 文件结构

- `dist/`：Vite 构建输出，包含 `index.html` 与 `assets/` 目录。可复制到任意静态服务器（如 Nginx、Apache）或通过 `npx serve dist` 本地预览。

### 使用提示

1. 若仅需最终展示，执行：
   ```bash
   cd release/dist
   npx serve .   # 或者使用任意 HTTP 静态服务器
   ```
2. 更多环境准备、开发模式和部署步骤请参考 `doc/User_Manual.md`。
