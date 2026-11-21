// 课程结构：6 个阶段，每个阶段有单词、短语、语法、对话、听读、口语六条线，各自按顺序学习
import u01 from './u01.js'
import u02 from './u02.js'
import u03 from './u03.js'
import u04 from './u04.js'
import u05 from './u05.js'
import u06 from './u06.js'
import u07 from './u07.js'
import u08 from './u08.js'
import u09 from './u09.js'
import u10 from './u10.js'
import u11 from './u11.js'
import u12 from './u12.js'
import g25 from './grammar/g25.js'
import g31 from './grammar/g31.js'
import g37 from './grammar/g37.js'
import g43 from './grammar/g43.js'
import g49 from './grammar/g49.js'
import g55 from './grammar/g55.js'
import g61 from './grammar/g61.js'
import d25 from './dialogues/d25.js'
import d35 from './dialogues/d35.js'
import d45 from './dialogues/d45.js'
import d55 from './dialogues/d55.js'
import p1 from './phrases/p1.js'
import p2 from './phrases/p2.js'
import p3 from './phrases/p3.js'
import p4 from './phrases/p4.js'
import p5 from './phrases/p5.js'
import p6 from './phrases/p6.js'
import p1b from './phrases/p1b.js'
import p2b from './phrases/p2b.js'
import p3b from './phrases/p3b.js'
import p4b from './phrases/p4b.js'
import p5b from './phrases/p5b.js'
import p6b from './phrases/p6b.js'
import r1 from './passages/s1.js'
import r2 from './passages/s2.js'
import r3 from './passages/s3.js'
import r4 from './passages/s4.js'
import r5 from './passages/s5.js'
import r6 from './passages/s6.js'
import r1a from './passages/s1a.js'
import r1b from './passages/s1b.js'
import r1c from './passages/s1c.js'
import r1d from './passages/s1d.js'
import r2a from './passages/s2a.js'
import r2b from './passages/s2b.js'
import r2c from './passages/s2c.js'
import r2d from './passages/s2d.js'
import r3a from './passages/s3a.js'
import r3b from './passages/s3b.js'
import r3c from './passages/s3c.js'
import r3d from './passages/s3d.js'
import r4a from './passages/s4a.js'
import r4b from './passages/s4b.js'
import r4c from './passages/s4c.js'
import r4d from './passages/s4d.js'
import r5a from './passages/s5a.js'
import r5b from './passages/s5b.js'
import r5c from './passages/s5c.js'
import r5d from './passages/s5d.js'
import r6a from './passages/s6a.js'
import r6b from './passages/s6b.js'
import r6c from './passages/s6c.js'
import r6d from './passages/s6d.js'
import k12 from './speaking/s12.js'
import k34 from './speaking/s34.js'
import k56 from './speaking/s56.js'
import k1 from './speaking/k1.js'
import k2 from './speaking/k2.js'
import k3 from './speaking/k3.js'
import k4 from './speaking/k4.js'
import k5 from './speaking/k5.js'
import k6 from './speaking/k6.js'
import freqWords from './words.json'

const STAGES = [1, 2, 3, 4, 5, 6]

// 数据里用 "a|b|c" 的紧凑写法，这里展开成对象
const pair = s => { const [en, zh] = s.split('|'); return { en, zh } }
const word = s => { const [en, ph, zh, ex, exZh] = s.split('|'); return { en, ph, zh, ex, exZh } }
const line = s => { const [role, en, zh] = s.split('|'); return { role: Number(role), en, zh } }

// 按阶段排序并标上位置 index；id 是稳定编号，学习记录用 id 记，以后插入新内容不会错位
const byStage = items => STAGES.flatMap(s => items.filter(x => x.stage === s)).map((x, index) => ({ ...x, index }))

const units = [u01, u02, u03, u04, u05, u06, u07, u08, u09, u10, u11, u12]

// 语法：原有 60 个每阶段 10 个；补充的 7 个按难度插入对应阶段末尾
const G61_STAGES = [2, 2, 3, 4, 4, 5, 5]
export const grammarList = byStage([
  ...[...units.flatMap(u => u.grammar), ...g25, ...g31, ...g37, ...g43, ...g49, ...g55]
    .map((g, i) => ({ ...g, id: i, stage: Math.floor(i / 10) + 1 })),
  ...g61.map((g, k) => ({ ...g, id: 60 + k, stage: G61_STAGES[k] })),
].map(g => ({ ...g, examples: g.examples.map(pair) })))

const D_PER_STAGE = [11, 10, 11, 11, 10, 11]
const dStageOf = i => { let n = 0; for (let s = 0; s < 6; s++) { n += D_PER_STAGE[s]; if (i < n) return s + 1 } return 6 }
export const dialogueList = byStage([...units.flatMap(u => u.dialogues), ...d25, ...d35, ...d45, ...d55]
  .map((d, i) => ({ ...d, id: i, stage: dStageOf(i), lines: d.lines.map(line), patterns: d.patterns.map(pair) })))

// 单词：前 240 个是按主题编排的入门词，之后按常用程度排列（来自 ECDICT + Tatoeba，见 scripts/build-words.mjs）
const themed = units.flatMap(u => u.words.map(word))
const themedSet = new Set(themed.map(w => w.en.toLowerCase()))
const words = [
  ...themed,
  ...freqWords.filter(([en]) => !themedSet.has(en.toLowerCase()))
    .map(([en, ph, zh, ex, exZh, def]) => ({ en, ph, zh, ex, exZh, def })),
]
const per = Math.ceil(words.length / 6)
export const wordList = byStage(words.map((w, i) => ({ ...w, stage: Math.floor(i / per) + 1 })))

// 短语与搭配：同一短语只保留第一次出现
const seen = new Set(wordList.map(w => w.en.toLowerCase()))
const PHRASES = [[p1, p1b], [p2, p2b], [p3, p3b], [p4, p4b], [p5, p5b], [p6, p6b]]
export const phraseList = byStage(PHRASES.flatMap((files, s) => files.flat().map(str => {
  const [en, zh, ex, exZh] = str.split('|')
  return { en, ph: '', zh, ex, exZh, stage: s + 1, phrase: true }
})).filter(p => { const k = p.en.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true }))

// 听读：每阶段原有 6 篇 + 补充 24 篇；id 带上文件标记，保证已完成记录不错位
const PASSAGES = [
  { '': r1, a: r1a, b: r1b, c: r1c, d: r1d }, { '': r2, a: r2a, b: r2b, c: r2c, d: r2d },
  { '': r3, a: r3a, b: r3b, c: r3c, d: r3d }, { '': r4, a: r4a, b: r4b, c: r4c, d: r4d },
  { '': r5, a: r5a, b: r5b, c: r5c, d: r5d }, { '': r6, a: r6a, b: r6b, c: r6c, d: r6d },
]
export const passageList = byStage(PASSAGES.flatMap((files, s) => Object.entries(files).flatMap(([tag, list]) =>
  list.map((p, k) => ({ ...p, id: `${s + 1}${tag}-${k}`, stage: s + 1, lines: p.lines.map(pair) })))))

// 口语：原有每阶段 6 个 + 补充 9 个
const oldSpeaking = [k12, k34, k56].flatMap((list, g) => list.map((t, k) => ({
  ...t, type: t.type || 'qa', id: `${g * 2 + Math.floor(k / 6) + 1}-${k % 6}`, stage: g * 2 + Math.floor(k / 6) + 1,
})))
const newSpeaking = [k1, k2, k3, k4, k5, k6].flatMap((list, s) => list.map((t, k) => ({ ...t, id: `${s + 1}k-${k}`, stage: s + 1 })))
export const speakingList = byStage([...oldSpeaking, ...newSpeaking])

const STAGE_INFO = [
  { title: '入门 A1', goal: '打招呼、介绍自己和家人，说数字、时间和位置' },
  { title: '基础 A1+', goal: '描述日常生活和爱好，能点餐、购物、问路' },
  { title: '初级 A2', goal: '讲过去的经历和未来的计划，用完成时谈经验' },
  { title: '初中级 A2+', goal: '表达义务、推测和建议，处理看病、出行、住宿' },
  { title: '中级 B1', goal: '用条件句、被动语态、从句处理生活事务' },
  { title: '中级 B1+', goal: '虚拟语气与高级句式，应付工作沟通和深入交流' },
]

// 每条线在该阶段的位置范围 [start, end)
function range(list, stage) {
  const xs = list.filter(x => x.stage === stage)
  return xs.length ? [xs[0].index, xs[xs.length - 1].index + 1] : [0, 0]
}

export const stages = STAGE_INFO.map((s, i) => ({
  ...s,
  id: i + 1,
  words: range(wordList, i + 1),
  phrases: range(phraseList, i + 1),
  grammar: range(grammarList, i + 1),
  dialogues: range(dialogueList, i + 1),
  passages: range(passageList, i + 1),
  speaking: range(speakingList, i + 1),
}))

// 记词型（单词、短语）：学过 = 已进入复习计划；课程型：学过 = 完成记录里有它的 id
export const TRACKS = {
  words: { label: '单词', kind: 'srs', list: wordList },
  phrases: { label: '短语', kind: 'srs', list: phraseList },
  grammar: { label: '语法', kind: 'lesson', list: grammarList, done: 'gDone' },
  dialogues: { label: '对话', kind: 'lesson', list: dialogueList, done: 'dDone' },
  passages: { label: '听读', kind: 'lesson', list: passageList, done: 'rDone' },
  speaking: { label: '口语', kind: 'lesson', list: speakingList, done: 'sDone' },
}

export const BATCH = 10 // 每组新词 / 短语个数
export const stageOf = item => stages[item.stage - 1]
