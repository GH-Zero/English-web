import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

// 账号和学习记录接口，每个用户一份记录，换窗口、换浏览器登录同一个账号都能读到
// 开发服务器（vite.config.js）和正式部署用的 server.mjs 共用这一份
//   dataDir/users.json            用户名 → 密码哈希、记录文件 id
//   dataDir/sessions.json         登录令牌 → 用户
//   dataDir/progress/<id>.json    每个用户的学习记录（<id>.bak.json 是上一版）
const MAX_BYTES = 10 * 1024 * 1024
const NAME_RE = /^[\p{L}\p{N}_-]{2,20}$/u
const MAX_FAILS = 10 // 同一用户名 10 分钟内密码错 10 次就暂时锁住，防止被猜密码
const LOCK_MS = 10 * 60 * 1000

const hashPassword = (password, salt) => scryptSync(password, salt, 32).toString('hex')

export function createProgressApi(dataDir) {
  const USERS = dataDir + 'users.json'
  const SESSIONS = dataDir + 'sessions.json'
  const PROGRESS_DIR = dataDir + 'progress/'

  const readJson = (file, fallback) => {
    try { return JSON.parse(readFileSync(file, 'utf8')) } catch { return fallback }
  }
  const writeJson = (file, data) => {
    writeFileSync(file + '.tmp', JSON.stringify(data))
    renameSync(file + '.tmp', file)
  }
  mkdirSync(PROGRESS_DIR, { recursive: true })
  // 无原型对象：用户名是 "__proto__" 之类时也只是普通键
  const users = Object.assign(Object.create(null), readJson(USERS, {}))
  const sessions = Object.assign(Object.create(null), readJson(SESSIONS, {}))
  const fails = new Map()

  const send = (res, status, data) => { res.statusCode = status; res.end(JSON.stringify(data)) }

  function readBody(req, res, cb) {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > MAX_BYTES) { send(res, 413, { error: '数据太大' }); req.destroy() }
    })
    req.on('end', () => {
      if (res.writableEnded) return
      let data
      try { data = JSON.parse(body) } catch { data = null }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return send(res, 400, { error: '数据格式不对' })
      cb(data)
    })
  }

  function newSession(key) {
    const token = randomBytes(24).toString('hex')
    sessions[token] = { user: key, at: Date.now() }
    writeJson(SESSIONS, sessions)
    return token
  }

  function currentUser(req) {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '')
    const s = token && Object.hasOwn(sessions, token) ? sessions[token] : null
    return s && users[s.user] ? users[s.user] : null
  }

  function register(req, res) {
    readBody(req, res, ({ name, password }) => {
      name = String(name || '').trim()
      if (!NAME_RE.test(name)) return send(res, 400, { error: '用户名 2–20 个字，只能用中文、字母、数字、_ 或 -' })
      if (typeof password !== 'string' || password.length < 6) return send(res, 400, { error: '密码至少 6 位' })
      const key = name.toLowerCase()
      if (Object.hasOwn(users, key)) return send(res, 409, { error: '这个用户名已经被注册了' })
      const salt = randomBytes(16).toString('hex')
      users[key] = { name, salt, hash: hashPassword(password, salt), id: randomBytes(12).toString('hex'), createdAt: Date.now() }
      writeJson(USERS, users)
      send(res, 200, { ok: true, name, token: newSession(key) })
    })
  }

  function login(req, res) {
    readBody(req, res, ({ name, password }) => {
      const key = String(name || '').trim().toLowerCase()
      const f = fails.get(key)
      if (f && f.count >= MAX_FAILS && Date.now() - f.at < LOCK_MS) return send(res, 429, { error: '密码错误次数太多，请 10 分钟后再试' })
      const u = Object.hasOwn(users, key) ? users[key] : null
      const ok = u && typeof password === 'string' &&
        timingSafeEqual(Buffer.from(hashPassword(password, u.salt), 'hex'), Buffer.from(u.hash, 'hex'))
      if (!ok) {
        const count = f && Date.now() - f.at < LOCK_MS ? f.count + 1 : 1
        fails.set(key, { count, at: Date.now() })
        return send(res, 401, { error: '用户名或密码不对' })
      }
      fails.delete(key)
      send(res, 200, { ok: true, name: u.name, token: newSession(key) })
    })
  }
  function logout(req, res) {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '')
    if (token && Object.hasOwn(sessions, token)) { delete sessions[token]; writeJson(SESSIONS, sessions) }
    send(res, 200, { ok: true })
  }

  function progress(req, res) {
    const u = currentUser(req)
    if (!u) return send(res, 401, { error: '请先登录' })
    const file = PROGRESS_DIR + u.id + '.json'
    if (req.method === 'GET') {
      res.end(existsSync(file) ? readFileSync(file, 'utf8') : '{}')
      return
    }
    if (req.method !== 'POST') return send(res, 405, {})
    readBody(req, res, data => {
      if (existsSync(file)) copyFileSync(file, PROGRESS_DIR + u.id + '.bak.json') // 保留上一版，防止误覆盖
      writeJson(file, data)
      send(res, 200, { ok: true })
    })
  }

  const routes = new Map([['/api/register', register], ['/api/login', login], ['/api/logout', logout], ['/api/progress', progress]])

  return function progressApi(req, res, next) {
    const route = routes.get(req.url.split('?')[0])
    if (!route) return next()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    if (route !== progress && req.method !== 'POST') return send(res, 405, {})
    route(req, res)
  }
}
