// 生成 src/course/words.json：按词频挑选常用英文单词，配中文释义和中英例句
// 数据来源：ECDICT（https://github.com/skywind3000/ECDICT，MIT 协议）
//          Tatoeba 中英句对（https://www.manythings.org/anki/ ，CC BY 2.0 FR）
//          Tatoeba 里找不到例句的词，用 scripts/extra/part-*.json 里补写的例句
// 用法：node scripts/build-words.mjs <ecdict.csv> <cmn.txt> [数量，默认 5000]
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import * as OpenCC from 'opencc-js'

const [ecdictPath, cmnPath, limitArg] = process.argv.slice(2)
if (!ecdictPath || !cmnPath) {
  console.error('用法：node scripts/build-words.mjs <ecdict.csv> <cmn.txt> [数量]')
  process.exit(1)
}
const LIMIT = Number(limitArg) || 5000

function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

// ---- 1. 选词 ----
const rows = parseCsv(readFileSync(ecdictPath, 'utf8'))
const head = rows.shift()
const col = Object.fromEntries(head.map((h, i) => [h, i]))

const cleanLines = s => s.split('\\n').map(l => l.trim()).filter(l => l && !l.startsWith('['))

const candidates = []
for (const r of rows) {
  const en = r[col.word]
  if (!en || !/^[a-z][a-z'-]*[a-z]$|^a$/.test(en)) continue // 只要小写单词，排除专有名词、词组、符号
  const trans = cleanLines(r[col.translation] || '')
  if (!trans.length || /^abbr\./.test(trans[0]) || /人名|地名|缩写/.test(trans[0])) continue
  const exchange = r[col.exchange] || ''
  if (/(^|\/)0:/.test(exchange)) continue // 跳过变形词（went、children 等），只保留原形
  const tag = r[col.tag] || ''
  const oxford = r[col.oxford] === '1'
  const collins = Number(r[col.collins]) || 0
  if (!tag && !oxford && !collins) continue
  const frq = Number(r[col.frq]) || 0
  const bnc = Number(r[col.bnc]) || 0
  const raw = frq > 0 ? frq : bnc > 0 ? bnc * 1.2 : Infinity
  if (!isFinite(raw)) continue
  // 词频来自美国当代语料库，新闻、学术词偏多；用中考 / 高考 / 四级词表加权，让生活常用词排在前面
  const weight = /\bzk\b/.test(tag) ? 0.4 : /\bgk\b/.test(tag) ? 0.65 : /\bcet4\b/.test(tag) ? 0.9 : /\b(cet6|ky)\b/.test(tag) ? 1.2 : 1.8
  const rank = raw * weight
  const forms = exchange.split('/').filter(x => /^[pdi3rst]:/.test(x)).map(x => x.slice(2)).filter(Boolean)
  candidates.push({ en, rank, ph: r[col.phonetic] || '', trans, forms })
}
candidates.sort((a, b) => a.rank - b.rank)
const picked = candidates.slice(0, LIMIT)

// 释义：首行最多 3 个义项作为简短释义，前 3 行作为完整释义
function shortZh(lines) {
  const first = lines[0]
  const m = first.match(/^([a-z]+\.\s*)?(.*)$/)
  const pos = m[1] ? m[1].trim() + ' ' : ''
  const senses = m[2].split(/[,，;；]/).map(s => s.trim()).filter(Boolean).slice(0, 3)
  return (pos + senses.join('；')).slice(0, 28)
}

// ---- 2. 例句 ----
const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' })
const sentences = []
for (const ln of readFileSync(cmnPath, 'utf8').split('\n')) {
  const [en, zhRaw] = ln.split('\t')
  if (!en || !zhRaw || /[|"]/.test(en + zhRaw) || !/^[\x20-\x7E]+$/.test(en)) continue
  const zh = toSimplified(zhRaw)
  const tokens = en.toLowerCase().match(/[a-z']+/g) || []
  if (tokens.length < 4 || tokens.length > 14) continue
  sentences.push({ en, zh, tokens: new Set(tokens), len: tokens.length, used: 0 })
}
const index = new Map()
sentences.forEach((s, i) => { for (const t of s.tokens) { if (!index.has(t)) index.set(t, []); index.get(t).push(i) } })

function pickExample(w) {
  for (const keys of [[w.en], w.forms]) {
    const ids = [...new Set(keys.flatMap(k => index.get(k) || []))]
    if (!ids.length) continue
    // 优先用得少、长度接近 7 个词的句子
    ids.sort((a, b) => (sentences[a].used - sentences[b].used) * 10 + Math.abs(sentences[a].len - 7) - Math.abs(sentences[b].len - 7))
    const s = sentences[ids[0]]
    s.used++
    return [s.en, s.zh]
  }
  return ['', '']
}

// ECDICT 音标用 ASCII 近似写法，转换成标准 IPA 符号
const ipa = p => p.replace(/ә/g, 'ə').replace(/'/g, 'ˈ').replace(/[,.]/g, 'ˌ').replace(/:/g, 'ː')

// 词库里没配到例句的词，用补写的例句（scripts/extra/part-*.json：{ word: [英文, 中文] }）
const extraDir = new URL('./extra/', import.meta.url)
const extra = existsSync(extraDir)
  ? Object.assign({}, ...readdirSync(extraDir).filter(f => /^part-\d+\.json$/.test(f))
    .map(f => JSON.parse(readFileSync(new URL(f, extraDir), 'utf8'))))
  : {}

const out = picked.map(w => {
  const found = pickExample(w)
  const [ex, exZh] = found[0] ? found : (extra[w.en] || ['', ''])
  return [w.en, w.ph ? `/${ipa(w.ph)}/` : '', shortZh(w.trans), ex, exZh, w.trans.slice(0, 3).join('\n')]
})

writeFileSync(new URL('../src/course/words.json', import.meta.url), JSON.stringify(out))
const missing = out.filter(w => !w[3])
if (missing.length) {
  // 列出还缺例句的词，补写到 scripts/extra/ 后重新运行
  writeFileSync(new URL('./missing-examples.txt', import.meta.url), missing.map(w => `${w[0]}\t${w[2]}`).join('\n'))
}
const withEx = out.filter(w => w[3]).length
console.log(`words: ${out.length}, with example: ${withEx} (${Math.round((withEx / out.length) * 100)}%)`)
console.log('sample:', out.slice(0, 3), out.slice(2000, 2002), out.slice(-2))
