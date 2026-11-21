// 把课程数据转换成统一的练习题
import { shuffle, sample } from './utils.js'

function distractors(word, pool, key, n = 3) {
  const others = pool.filter(w => w.en !== word.en && w[key] !== word[key])
  const seen = new Set()
  const picked = []
  for (const w of shuffle(others)) {
    if (seen.has(w[key])) continue
    seen.add(w[key]); picked.push(w[key])
    if (picked.length === n) break
  }
  return picked
}

function choice(id, base, correct, wrongs) {
  const options = shuffle([correct, ...wrongs])
  return { id, type: 'choice', ...base, options, answer: options.indexOf(correct) }
}

const exNote = w => (w.ex ? `${w.ex}（${w.exZh}）` : `${w.en} ${w.ph}：${w.zh}`)

// 看英文选中文
export function enToZh(w, pool) {
  return choice(`w:${w.en}:ez`, {
    word: w.en, prompt: w.en, sub: w.ph, audio: w.en, explain: exNote(w),
  }, w.zh, distractors(w, pool, 'zh'))
}

// 看中文选英文
export function zhToEn(w, pool) {
  return choice(`w:${w.en}:ze`, {
    word: w.en, prompt: `“${w.zh}” 的英文是？`, explain: exNote(w), audioAfter: w.en,
  }, w.en, distractors(w, pool, 'en'))
}

// 听音选单词
export function listenPick(w, pool) {
  return choice(`w:${w.en}:li`, {
    word: w.en, prompt: '听发音，选出你听到的单词', audio: w.en,
    explain: `${w.en} ${w.ph}：${w.zh}`,
  }, w.en, distractors(w, pool, 'en'))
}

// 看中文拼写
export function spell(w) {
  return {
    id: `w:${w.en}:sp`, type: 'input', word: w.en,
    prompt: `拼写：${w.zh}`, sub: `提示：${w.en[0]}${'_'.repeat(Math.max(w.en.length - 1, 0))}（${w.en.length} 个字符）`,
    answer: w.en, accept: [w.en], audioAfter: w.en, explain: exNote(w),
  }
}

// 例句填空：把单词从例句中挖掉
export function sentenceFill(w) {
  const re = new RegExp(`\\b${w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  if (!w.ex || !re.test(w.ex)) return spell(w)
  return {
    id: `w:${w.en}:sf`, type: 'input', word: w.en,
    prompt: w.ex.replace(re, '____'), sub: `${w.exZh}（提示：${w.zh}）`,
    answer: w.en, accept: [w.en], audioAfter: w.ex, explain: `${w.en}：${w.zh}`,
  }
}

const wordMakers = [enToZh, zhToEn, listenPick, sentenceFill, spell]

// 新词课：每个词三轮（认 → 听 → 用），由易到难
export function wordLessonSet(words, pool) {
  return [
    ...shuffle(words).map(w => enToZh(w, pool)),
    ...shuffle(words).map(w => (Math.random() < 0.5 ? listenPick(w, pool) : zhToEn(w, pool))),
    ...shuffle(words).map(w => (Math.random() < 0.6 ? sentenceFill(w) : spell(w))),
  ]
}

export function randomWordEx(w, pool) {
  const make = wordMakers[Math.floor(Math.random() * wordMakers.length)]
  return make(w, pool)
}

function toTokens(en) {
  return shuffle(en.replace(/[.,!?]/g, '').split(' ').filter(Boolean))
}

// 连词成句
export function orderEx(id, en, zh, explain) {
  return { id, type: 'order', prompt: `连词成句：${zh}`, answer: en, tokens: toTokens(en), audioAfter: en, explain }
}

// 把答案填回题干，得到可朗读的完整英文句子；含中文则不朗读
function filled(q, answer) {
  if (!q.includes('___')) return null
  const s = q.replace('___', answer).replace(/\s*[(（].*?[)）]/g, '').replace(/—— */g, '')
  return /^[\x20-\x7E]+$/.test(s) ? s : null
}

// 语法练习：c=选择 f=填空 r=连词成句
export function grammarSet(g) {
  return g.exercises.map((e, i) => {
    const id = `g:${g.id}:${i}`
    const explain = e.why || g.title
    if (e.c) {
      return { id, type: 'choice', prompt: e.c, sub: e.zh, options: e.o, answer: e.a, explain, audioAfter: filled(e.c, e.o[e.a]) }
    }
    if (e.f) {
      const accept = [].concat(e.a)
      return { id, type: 'input', prompt: e.f, sub: e.zh, answer: accept[0], accept, explain, audioAfter: filled(e.f, accept[0]) }
    }
    return orderEx(id, e.r, e.zh, explain)
  })
}

// 对话句子拿来连词成句（太短或太长的跳过）
export function dialogueOrderSet(d) {
  return d.lines
    .map((l, i) => ({ ...l, i }))
    .filter(l => { const n = l.en.split(' ').length; return n >= 3 && n <= 12 })
    .map(l => orderEx(`d:${d.id}:${l.i}`, l.en, l.zh, `出自对话「${d.title}」`))
}

// 听读理解题
export function passageSet(p) {
  return p.questions.map((q, k) => ({
    id: `r:${p.id}:${k}`, type: 'choice', prompt: q.c, sub: q.zh, options: q.o, answer: q.a, explain: q.why,
  }))
}

// 听写填空：从听力原文里挑 3 句，各挖掉一个较长的实词，听音补全
const STOP = new Set(['about', 'there', 'their', 'these', 'those', 'which', 'would', 'could', 'should', 'because', 'every', 'other'])
export function dictationSet(p, n = 3) {
  const picks = sample(p.lines.map((l, i) => ({ ...l, i })), n)
  return picks.map(l => {
    const words = l.en.match(/[A-Za-z]+/g) || []
    const target = words.filter(w => w.length >= 5 && !STOP.has(w.toLowerCase())).sort((a, b) => b.length - a.length)[0] || words[0]
    return {
      id: `r:${p.id}:dict${l.i}`, type: 'input', prompt: '听写填空：' + l.en.replace(new RegExp(`\\b${target}\\b`), '____'),
      sub: l.zh, audio: l.en, answer: target, accept: [target], audioAfter: l.en, explain: l.en,
    }
  })
}

// 语法综合复习：从学过的语法里抽题，错得多、分数低的语法点抽得多
export function grammarReviewSet(grammars, gDone = {}, wrong = {}, n = 20) {
  const wrongBy = {}
  for (const id of Object.keys(wrong)) { const m = id.match(/^g:(\d+):/); if (m) wrongBy[m[1]] = (wrongBy[m[1]] || 0) + wrong[id].count }
  const pool = grammars.flatMap(g => {
    const w = 1 + 2 * (wrongBy[g.id] || 0) + (100 - (gDone[g.id] ?? 100)) / 20
    return grammarSet(g).map(ex => ({ ex, w }))
  })
  const out = []
  while (out.length < n && pool.length) {
    let r = Math.random() * pool.reduce((s, x) => s + x.w, 0)
    const k = pool.findIndex(x => (r -= x.w) <= 0)
    out.push(pool.splice(k < 0 ? 0 : k, 1)[0].ex)
  }
  return out
}

// 看中文说英文：从对话和语法例句里抽句子
export function translateItems(dialogues, grammars, n) {
  const pool = [
    ...dialogues.flatMap(d => d.lines.filter(l => { const k = l.en.split(' ').length; return k >= 4 && k <= 12 })),
    ...grammars.flatMap(g => g.examples),
  ]
  return sample(pool, n)
}

// 阶段测试：单词 10 + 短语 4 + 语法 12 + 对话 6
export const TEST_SIZE = { words: 10, phrases: 4, grammar: 12, dialogues: 6 }
export function stageTestSet(stage, { wordList, phraseList, grammarList, dialogueList }) {
  const ws = wordList.slice(...stage.words)
  const ps = phraseList.slice(...stage.phrases)
  const words = sample(ws, TEST_SIZE.words).map(w => randomWordEx(w, ws))
  const phrases = ps.length >= 4 ? sample(ps, TEST_SIZE.phrases).map(w => randomWordEx(w, ps)) : []
  const grammar = sample(grammarList.slice(...stage.grammar).flatMap(grammarSet), TEST_SIZE.grammar)
  const dia = sample(dialogueList.slice(...stage.dialogues).flatMap(dialogueOrderSet), TEST_SIZE.dialogues)
  return shuffle([...words, ...phrases, ...grammar, ...dia])
}
