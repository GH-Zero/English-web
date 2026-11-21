// 间隔复习（Leitner 盒子）与学习记录
import { todayStr, addDays } from './utils.js'

// 盒子编号 -> 下次复习间隔（天）
const INTERVALS = [1, 1, 2, 4, 7, 15, 30]
export const MAX_BOX = INTERVALS.length - 1
export const MASTERED_BOX = 4

export function addToSrs(srs = {}, words) {
  const next = { ...srs }
  const due = addDays(todayStr(), 1)
  for (const w of words) if (!next[w.en]) next[w.en] = { box: 1, due }
  return next
}

export function gradeSrs(srs = {}, results) {
  const next = { ...srs }
  const today = todayStr()
  for (const [en, ok] of Object.entries(results)) {
    const cur = next[en] || { box: 1 }
    const box = ok ? Math.min(cur.box + 1, MAX_BOX) : 1
    next[en] = { box, due: addDays(today, INTERVALS[box]) }
  }
  return next
}

export function dueWords(srs = {}) {
  const today = todayStr()
  return Object.keys(srs).filter(en => srs[en].due <= today)
}

// 错题本：key -> { ex, count }
export function addWrong(wrong = {}, exercises) {
  const next = { ...wrong }
  for (const ex of exercises) {
    next[ex.id] = { ex, count: (next[ex.id]?.count || 0) + 1 }
  }
  return next
}

export function removeWrong(wrong = {}, ids) {
  const next = { ...wrong }
  for (const id of ids) delete next[id]
  return next
}

export function logActivity(log = {}, field, n = 1) {
  const day = todayStr()
  const cur = log[day] || {}
  return { ...log, [day]: { ...cur, [field]: (cur[field] || 0) + n } }
}

// ---- 课程进度 ----
// progress 字段：wordPos 已学到第几个词；gDone / dDone 已完成的语法 / 对话（下标 -> 分数）；passed 已通过的阶段
export const stageUnlocked = (p, stage) => stage.id === 1 || !!p.passed?.[stage.id - 1]

const isDone = (p, track, item) => (track.kind === 'srs' ? !!p.srs?.[item.en] : item.id in (p[track.done] || {}))

// 每条线在本阶段完成了多少
export function stageStatus(p, stage, TRACKS) {
  const counts = {}
  let ready = true
  for (const [key, track] of Object.entries(TRACKS)) {
    const items = track.list.slice(...stage[key])
    const n = items.filter(it => isDone(p, track, it)).length
    counts[key] = { n, total: items.length }
    if (n < items.length) ready = false
  }
  return { counts, ready, unlocked: stageUnlocked(p, stage), passed: !!p.passed?.[stage.id] }
}

// 课程型的下一课（已解锁阶段里第一个没完成的）；没有则返回 null
export function nextItem(p, stages, TRACKS, key) {
  const track = TRACKS[key]
  for (const s of stages) {
    if (!stageUnlocked(p, s)) return null
    const item = track.list.slice(...s[key]).find(it => !isDone(p, track, it))
    if (item) return item
  }
  return null
}

// 记词型的下一组：当前阶段里还没学过的前 n 个
export function nextBatch(p, stages, TRACKS, key, n) {
  const first = nextItem(p, stages, TRACKS, key)
  if (!first) return []
  const track = TRACKS[key]
  const stage = stages[first.stage - 1]
  return track.list.slice(first.index, stage[key][1]).filter(it => !isDone(p, track, it)).slice(0, n)
}

// 课程型：本阶段第一课，或前一课已完成，才能学
export function itemUnlocked(p, stages, TRACKS, key, item) {
  const stage = stages[item.stage - 1]
  if (!stageUnlocked(p, stage)) return false
  const track = TRACKS[key]
  return item.index === stage[key][0] || isDone(p, track, track.list[item.index - 1])
}

export const learnedCount = (p, list) => list.filter(it => p.srs?.[it.en]).length

// 旧版（12 周 × 7 天）进度迁移到新结构。语法、对话的 id 与旧版下标一致，v2 记录可直接沿用
export function migrate(p) {
  if (p.v >= 3) return null
  if (p.v === 2) return { v: 3 }
  const gDone = {}, dDone = {}
  for (const k of Object.keys(p.done || {})) {
    const unit = Math.floor(k / 7), dow = k % 7
    if (dow === 2 || dow === 3) gDone[unit * 2 + dow - 2] = p.done[k].score ?? 100
    if (dow === 4 || dow === 5) dDone[unit * 2 + dow - 4] = p.done[k].score ?? 100
  }
  return { v: 3, gDone, dDone, dailyGoal: p.dailyGoal || 30 }
}
