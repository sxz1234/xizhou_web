# 飞牛 OS Docker 部署

部署目录：

```bash
/vol1/1001/xizhou_web
```

首次部署后，局域网访问：

```text
http://192.168.1.93:8080
```

后续本机修改并推送到 GitHub 后，在飞牛 OS 上更新：

```bash
cd /vol1/1001/xizhou_web
git pull --ff-only
sudo docker compose up -d --build
```

如果需要换端口，在部署目录创建或修改 `.env`：

```bash
WEB_PORT=8080
```

然后重新启动：

```bash
sudo docker compose up -d --build
```
