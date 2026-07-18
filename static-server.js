const fs = require('fs')
const http = require('http')
const path = require('path')

const root = __dirname
const port = Number(process.env.PORT || 8080)

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
])

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, headers)
  res.end(body)
}

const safeResolve = (requestPath) => {
  const normalized = path.normalize(decodeURIComponent(requestPath)).replace(/^[/\\]+/, '')
  const resolved = path.resolve(root, normalized)
  return resolved.startsWith(root) ? resolved : null
}

const serveFile = (res, filePath) => {
  const stat = fs.statSync(filePath)
  const extension = path.extname(filePath).toLowerCase()
  const cacheControl = filePath.endsWith('index.html')
    ? 'no-store'
    : extension === '.css' || extension === '.js'
      ? 'no-cache'
      : 'public, max-age=604800'

  res.writeHead(200, {
    'Content-Type': mimeTypes.get(extension) || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': cacheControl,
  })
  fs.createReadStream(filePath).pipe(res)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname
  const filePath = safeResolve(pathname)

  if (!filePath) {
    return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' })
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath)
  }

  return serveFile(res, path.join(root, 'index.html'))
})

server.listen(port, '0.0.0.0', () => {
  console.log(`xizhou_web listening on http://0.0.0.0:${port}`)
})
