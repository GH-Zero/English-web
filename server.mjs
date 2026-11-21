// 正式部署用：node server.mjs
// 同时提供 dist/ 里的页面和 /api/* 账号、学习记录接口（纯静态托管没有这些接口，进度没法按用户保存）
// 只依赖 Node 自带模块，服务器上不需要 npm install
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProgressApi } from './progress-api.js'

const ROOT = fileURLToPath(new URL('./dist/', import.meta.url))
const PORT = Number(process.env.PORT) || 3000
const progressApi = createProgressApi(fileURLToPath(new URL('./.data/', import.meta.url)))

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
}

async function serveStatic(req, res) {
  let path
  try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname) } catch { path = '/' }
  // normalize 后再拼接，挡住 ../ 越出 dist 目录
  let file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''))
  if (!file.startsWith(ROOT) || file.endsWith('/')) file = join(ROOT, 'index.html')
  try {
    const body = await readFile(file)
    res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream')
    // 文件名带哈希的资源可以长期缓存，index.html 每次都取新的，发新版后立即生效
    res.setHeader('Cache-Control', file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache')
    res.end(body)
  } catch {
    res.setHeader('Content-Type', TYPES['.html'])
    res.setHeader('Cache-Control', 'no-cache')
    res.end(await readFile(join(ROOT, 'index.html')))
  }
}

createServer((req, res) => progressApi(req, res, () => serveStatic(req, res)))
  .listen(PORT, () => console.log(`English from Zero: http://localhost:${PORT}`))
