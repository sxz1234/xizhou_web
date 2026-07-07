# 网页透传工具

## 用法

1. 把 `dist/web-tunnel-launcher.exe` 放到你的网站根目录（和 `index.html` 同级）
2. 复制 `launcher.config.json.example` 为 `launcher.config.json`
3. 将 `launcher.config.json` 里的 `tunnelMode` 保持为 `quick`
4. 双击 exe

## 效果

- 本机启动 `http://127.0.0.1:4173`
- Cloudflare Tunnel 会自动给出一个临时公网链接
- 关闭 exe 后，公网立即失效

## 说明

这版是测试随机链接用的，不要求固定域名。
如果要固定链接，请后续切换为 Cloudflare 命名隧道并填写 `publicHostname`。
