const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const localtunnel = require('localtunnel');

const EXE_DIR = process.pkg ? path.dirname(process.execPath) : process.cwd();
const ROOT_CANDIDATES = [
  process.env.SITE_ROOT,
  process.cwd(),
  EXE_DIR,
  path.resolve(EXE_DIR, '..'),
].filter(Boolean);

const ROOT = ROOT_CANDIDATES.find(candidate => fs.existsSync(path.join(candidate, 'index.html'))) || EXE_DIR;
const PORT = Number(process.env.PORT || 4173);
const CONFIG_PATH = path.join(ROOT, 'launcher.config.json');

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

const loadConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) return {};

  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.error(`无法读取 ${path.basename(CONFIG_PATH)}，请检查 JSON 格式。`);
    console.error(error.message);
    process.exit(1);
  }
};

const config = loadConfig();
const cloudflared = process.env.CLOUDFLARED_PATH || config.cloudflaredPath || 'cloudflared';
const tunnelMode = (process.env.TUNNEL_MODE || config.tunnelMode || 'named').toLowerCase();
const tunnelName = process.env.CLOUDFLARED_TUNNEL_NAME || config.tunnelName || '';
const cloudflaredConfig = process.env.CLOUDFLARED_CONFIG || config.cloudflaredConfig || '';
const publicHostname = process.env.PUBLIC_HOSTNAME || config.publicHostname || '';

const resolveContentType = filePath => MIME_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';

const safeJoin = requestPath => {
  const normalized = path.normalize(decodeURIComponent(requestPath)).replace(/^([/\\])+/, '');
  const resolved = path.resolve(ROOT, normalized);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
};

const sendNotFound = res => {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
};

const serveFile = (res, filePath) => {
  const stat = fs.statSync(filePath);
  const headers = {
    'Content-Type': resolveContentType(filePath),
    'Content-Length': stat.size,
    'Cache-Control': 'no-store',
  };
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
};

const startStaticServer = () => {
  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
    const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const filePath = safeJoin(pathname);

    if (!filePath || !fs.existsSync(filePath)) {
      if (pathname === '/index.html') {
        return sendNotFound(res);
      }
      const fallbackIndex = path.join(ROOT, 'index.html');
      if (fs.existsSync(fallbackIndex)) {
        return serveFile(res, fallbackIndex);
      }
      return sendNotFound(res);
    }

    if (fs.statSync(filePath).isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      if (fs.existsSync(indexFile)) {
        return serveFile(res, indexFile);
      }
      return sendNotFound(res);
    }

    return serveFile(res, filePath);
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`本地网站已启动：http://127.0.0.1:${PORT}`);
    if (publicHostname) {
      console.log(`固定公网地址（需已配置 Cloudflare 隧道）：https://${publicHostname}`);
    } else if (tunnelMode === 'quick' || !tunnelName) {
      console.log('公网为临时链接，请查看 cloudflared 输出中的 trycloudflare.com 地址');
    } else {
      console.log(`正在启动命名隧道「${tunnelName}」，公网地址以 Cloudflare 控制台绑定的域名为准`);
    }
    console.log('关闭本窗口后，公网访问将停止。');
  });

  return server;
};

const parseTunnelUrl = text => {
  const cloudflareMatch = text.match(/https:\/\/[-\w]+\.trycloudflare\.com/i);
  if (cloudflareMatch) return cloudflareMatch[0];

  const localTunnelMatch = text.match(/your url is:\s*(https:\/\/[-\w.]+\.loca\.lt)/i);
  if (localTunnelMatch) return localTunnelMatch[1];

  return null;
};

const attachTunnelLogging = child => {
  let tunnelReady = false;
  let buffer = '';

  const handleOutput = chunk => {
    const text = chunk.toString('utf8');
    buffer += text;
    process.stdout.write(text);

    if (!tunnelReady) {
      const url = parseTunnelUrl(buffer);
      if (url) {
        tunnelReady = true;
        console.log(`\n公网预览地址：${url}`);
        console.log('关闭本窗口后，公网访问将停止。');
      }
    }
  };

  child.stdout?.on('data', handleOutput);
  child.stderr?.on('data', handleOutput);

  return child;
};

const spawnCloudflared = () => {
  const args = ['tunnel'];
  if (cloudflaredConfig) {
    args.push('--config', cloudflaredConfig);
  }

  if (tunnelMode === 'quick' || !tunnelName) {
    args.push('--url', `http://127.0.0.1:${PORT}`);
  } else {
    args.push('run', tunnelName);
  }

  return spawn(cloudflared, args, {
    cwd: ROOT,
    stdio: 'pipe',
    windowsHide: true,
  });
};

const startLocalTunnel = async () => {
  const tunnel = await localtunnel({ port: PORT });
  console.log(`\n公网预览地址：${tunnel.url}`);
  console.log('关闭本窗口后，公网访问将停止。');
  return tunnel;
};

const startTunnel = async () => {
  try {
    const child = spawnCloudflared();
    attachTunnelLogging(child);

    child.on('error', async error => {
      if (error.code === 'ENOENT') {
        console.log('未找到 cloudflared，改用 localtunnel 临时公网链接。');
        try {
          const tunnel = await startLocalTunnel();
          process.on('exit', () => tunnel.close());
        } catch (fallbackError) {
          console.error('localtunnel 启动失败：');
          console.error(fallbackError);
          process.exit(1);
        }
        return;
      }

      console.error(error);
      process.exit(1);
    });

    child.on('exit', code => {
      if (code && code !== 0) {
        process.exitCode = code;
      }
    });

    return child;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const main = async () => {
  const server = startStaticServer();
  const tunnel = await startTunnel();

  const shutdown = signal => {
    console.log(`收到 ${signal}，正在关闭服务...`);
    if (tunnel?.kill) tunnel.kill();
    if (tunnel?.close) tunnel.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1200).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

main();
