// 单独部署接口：node api-server.mjs（和 progress-api.js、package.json 放在同一目录）
// 前端放静态站点，接口单独跑在一个端口；只依赖 Node 自带模块，服务器上不需要 npm install
//   PORT         接口端口，默认 3001
//   DATA_DIR     数据目录，默认同目录下的 .data/
//   CORS_ORIGIN  前端和接口不同域名时，允许调用的前端地址，多个用逗号隔开，默认 *
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { createProgressApi } from './progress-api.js'

const PORT = Number(process.env.PORT) || 3001
const DATA_DIR = process.env.DATA_DIR
  ? process.env.DATA_DIR.replace(/\/?$/, '/')
  : fileURLToPath(new URL('./.data/', import.meta.url))
const ORIGINS = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean)
const progressApi = createProgressApi(DATA_DIR)

// 登录令牌放在 Authorization 头里，不用 cookie，所以跨域时不需要 Allow-Credentials
function cors(req, res) {
  const origin = req.headers.origin
  if (!origin) return
  if (ORIGINS.includes('*')) res.setHeader('Access-Control-Allow-Origin', '*')
  else if (ORIGINS.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin') }
  else return
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

createServer((req, res) => {
  cors(req, res)
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end() }
  progressApi(req, res, () => {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: '接口不存在' }))
  })
}).listen(PORT, () => console.log(`English from Zero API: http://localhost:${PORT}/api`))
