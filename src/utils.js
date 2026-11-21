import { useState, useEffect, useRef } from 'react'

const KEY = 'english-from-zero-progress'
const AUTH_KEY = 'english-from-zero-auth'
// 每个用户一份学习记录，保存在服务器上（见 progress-api.js），浏览器 localStorage 里按用户名留一份缓存，
// 这样换窗口、换浏览器、清缓存，登录同一个账号都能接着学
const localKey = name => `${KEY}:${name.toLowerCase()}`

export function loadAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) } catch { return null }
}

// mode: 'login' | 'register'，成功返回 { name, token }，失败抛出给用户看的错误文字
export async function signIn(mode, name, password) {
  let r, data
  try {
    r = await fetch(`/api/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password }) })
    data = await r.json()
  } catch { throw new Error('连不上服务器，请稍后再试') }
  if (!r.ok) throw new Error(data.error || '出错了，请重试')
  const auth = { name: data.name, token: data.token }
  // 注册新账号时，把这个浏览器里以前没登录时学的记录带进新账号
  const legacy = localStorage.getItem(KEY)
  if (mode === 'register' && legacy) { localStorage.setItem(localKey(auth.name), legacy); localStorage.removeItem(KEY) }
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  return auth
}

export function signOut(auth) {
  localStorage.removeItem(AUTH_KEY)
  fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` } }).catch(() => {})
}

function loadProgress(name) {
  try { return JSON.parse(localStorage.getItem(localKey(name))) || {} } catch { return {} }
}

function saveProgress(name, data) {
  try { localStorage.setItem(localKey(name), JSON.stringify(data)) } catch { /* 存储不可用时只依赖服务器 */ }
}

// onExpired：服务器不认这个登录（比如令牌失效），让用户重新登录
export function useProgress(auth, onExpired) {
  const [progress, setProgress] = useState(() => loadProgress(auth.name))
  const [ready, setReady] = useState(false)
  const timer = useRef(null)
  const headers = { Authorization: `Bearer ${auth.token}` }

  // 启动时取服务器上的记录，哪边更新用哪边
  useEffect(() => {
    let cancelled = false
    fetch('/api/progress', { headers })
      .then(r => {
        if (r.status === 401) { if (!cancelled) onExpired(); return null }
        return r.ok ? r.json() : null
      })
      .then(server => {
        if (cancelled || !server) return
        setProgress(local => ((server.updatedAt || 0) > (local.updatedAt || 0) ? server : local))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    saveProgress(auth.name, progress)
    if (!ready) return // 服务器记录还没取回前不上传，避免空记录覆盖
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetch('/api/progress', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(progress) })
        .then(r => { if (r.status === 401) onExpired() })
        .catch(() => {})
    }, 400)
  }, [progress, ready])

  // value 可以是函数：update('srs', old => ({ ...old, ... }))
  const update = (key, value) => setProgress(p => ({
    ...p, [key]: typeof value === 'function' ? value(p[key]) : value, updatedAt: Date.now(),
  }))
  return [progress, update, ready]
}

// ---- 发音 ----
// online：有道词典发音（音质接近真人，需联网）；system：浏览器/系统自带语音。online 失败时自动退回 system
const VOICE_KEY = 'english-from-zero-voice'
const defaultVoice = { source: 'online', accent: 'us', voiceURI: '', rate: 1 }

export function loadVoiceSettings() {
  try { return { ...defaultVoice, ...JSON.parse(localStorage.getItem(VOICE_KEY)) } } catch { return { ...defaultVoice } }
}
let voiceSettings = loadVoiceSettings()
export function saveVoiceSettings(s) {
  voiceSettings = s
  localStorage.setItem(VOICE_KEY, JSON.stringify(s))
}

const hasSynth = typeof window !== 'undefined' && 'speechSynthesis' in window

export function englishVoices() {
  return hasSynth ? speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').startsWith('en')) : []
}

// 自动挑选音质最好的系统语音：Edge 的 Natural、Chrome 的 Google、macOS 的 Premium/Enhanced 优先
function voiceScore(v, accent) {
  let s = 0
  if (/natural|online/i.test(v.name)) s += 5
  if (/premium|enhanced/i.test(v.name)) s += 4
  if (/google/i.test(v.name)) s += 3
  if (/samantha|ava|allison|susan|zoe|daniel|serena|aria|jenny|guy/i.test(v.name)) s += 2
  const lang = v.lang.replace('_', '-')
  if (lang === (accent === 'uk' ? 'en-GB' : 'en-US')) s += 2
  return s
}

function pickVoice() {
  const voices = englishVoices()
  const chosen = voices.find(v => v.voiceURI === voiceSettings.voiceURI)
  if (chosen) return chosen
  return voices.sort((a, b) => voiceScore(b, voiceSettings.accent) - voiceScore(a, voiceSettings.accent))[0]
}
export const bestVoiceName = () => pickVoice()?.name || ''

// 复用同一个 <audio>：Safari / iOS 只允许用户点过的元素继续自动播放，每句新建会被拦截
let audio = null
let finish = null // 正在读的那句的 resolve，打断时调用，免得连续朗读卡在半路
let gen = 0 // 每次打断 +1，speakAll 据此知道被打断了
export function stopSpeaking() {
  gen++
  if (audio) { audio.onended = audio.onerror = null; audio.pause() }
  if (hasSynth) speechSynthesis.cancel()
  const f = finish; finish = null; f?.()
}

function speakSystem(text) {
  return new Promise(resolve => {
    if (!hasSynth) return resolve()
    finish = resolve
    const u = new SpeechSynthesisUtterance(text)
    const v = pickVoice()
    if (v) u.voice = v
    u.lang = v?.lang || 'en-US'
    u.rate = 0.9 * voiceSettings.rate
    u.onend = resolve
    u.onerror = resolve
    speechSynthesis.speak(u)
  })
}

function speakOnline(text) {
  return new Promise(resolve => {
    const type = voiceSettings.accent === 'uk' ? 1 : 2
    const a = audio ||= new Audio()
    const my = gen
    let settled = false
    const settle = fn => () => { if (settled) return; settled = true; a.onended = a.onerror = null; fn() }
    // 在线发音失败（断网、被拦截）时改用系统语音读这一句；已被打断就直接结束
    const fallback = settle(() => (gen === my ? speakSystem(text).then(resolve) : resolve()))
    finish = settle(resolve)
    a.onended = finish
    a.onerror = fallback
    a.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`
    a.defaultPlaybackRate = a.playbackRate = voiceSettings.rate
    a.play().catch(fallback)
  })
}

// 读完再 resolve
export function speakAsync(text) {
  return voiceSettings.source === 'online' ? speakOnline(text) : speakSystem(text)
}

// 连续朗读多句（整段对话 / 听力录音）。中途被 stopSpeaking 或 speak 打断就不再往下读；读完返回 true
export async function speakAll(texts) {
  stopSpeaking()
  const my = gen
  for (const t of texts) {
    await speakAsync(t)
    if (gen !== my) return false
  }
  return true
}

export function speak(text) {
  stopSpeaking()
  speakAsync(text)
}

// 部分浏览器语音列表是异步加载的，提前触发一次
if (hasSynth) speechSynthesis.getVoices()

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
// IDE 内置浏览器等嵌入式环境调用麦克风会整页变灰卡死，只在正式浏览器里启用麦克风功能：
// Chrome / Edge 的 userAgentData 带有品牌名，嵌入式 Chromium 只有 "Chromium"；Safari 没有 userAgentData
function isRealBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/Electron/i.test(ua)) return false
  const brands = navigator.userAgentData?.brands?.map(b => b.brand) || []
  if (brands.some(b => /Google Chrome|Microsoft Edge/.test(b))) return true
  return !navigator.userAgentData && /Safari/.test(ua) && !/Chrome|Chromium/.test(ua)
}
export const isEmbedded = !isRealBrowser()
export const canListen = !!Recognition && !isEmbedded
export const canRecord = !isEmbedded && typeof window !== 'undefined' && !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder)

// 本机离线识别（Chrome 142+ 支持）是否可用；不可用就走浏览器的在线识别服务
let localMode = null
async function useLocal() {
  if (localMode != null) return localMode
  localMode = false
  if (!Recognition?.available) return false
  try {
    const opts = { langs: ['en-US'], processLocally: true }
    let status = await Recognition.available(opts)
    if (status === 'downloadable' || status === 'downloading') status = (await Recognition.install(opts)) ? 'available' : status
    localMode = status === 'available'
  } catch { /* 不支持就用在线识别 */ }
  return localMode
}

// 识别一句英文，返回候选文本数组；失败时 reject 错误码（network / not-allowed / no-speech ...）
export async function listen() {
  const local = await useLocal()
  return new Promise((resolve, reject) => {
    const r = new Recognition()
    r.lang = 'en-US'
    r.interimResults = false
    r.maxAlternatives = 3
    if (local) r.processLocally = true
    let got = false
    r.onresult = e => { got = true; resolve([...e.results[0]].map(a => a.transcript)) }
    r.onerror = e => reject(e.error)
    r.onend = () => { if (!got) reject('no-speech') }
    r.start()
  })
}

// 录一段音（说完点停止），返回可播放的音频地址
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const rec = new MediaRecorder(stream)
  const chunks = []
  rec.ondataavailable = e => chunks.push(e.data)
  const done = new Promise(resolve => {
    rec.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      resolve(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })))
    }
  })
  rec.start()
  return { stop: () => { rec.stop(); return done } }
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n)
}

export function normalize(s) {
  return s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()
}

// 目标句中有多少比例的词出现在用户的句子里
export function similarity(said, target) {
  const want = normalize(target).split(' ')
  const got = normalize(said).split(' ')
  let hit = 0
  for (const w of want) {
    const i = got.indexOf(w)
    if (i >= 0) { hit++; got.splice(i, 1) }
  }
  return want.length ? hit / want.length : 0
}

export function todayStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(str, n) {
  const [y, m, d] = str.split('-').map(Number)
  return todayStr(new Date(y, m - 1, d + n))
}

// 连续学习天数：从今天（或昨天）往前数有学习记录的天
export function streak(log = {}) {
  let day = todayStr()
  if (!log[day]) day = addDays(day, -1)
  let n = 0
  while (log[day]) { n++; day = addDays(day, -1) }
  return n
}
