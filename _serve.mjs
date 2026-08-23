// Tiny dependency-free static server for local preview/testing.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const ROOT = process.cwd()
const PORT = Number(process.argv[2] || 4321)

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}

http.createServer((req, res) => {
  let p = decodeURIComponent(url.parse(req.url).pathname)
  if (p.endsWith('/')) p += 'index.html'
  const file = path.join(ROOT, p)
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404'); return }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    res.end(buf)
  })
}).listen(PORT, '127.0.0.1', () => console.log('serving ' + ROOT + ' on http://127.0.0.1:' + PORT))
