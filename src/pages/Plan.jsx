import { useState } from 'react'
import { stages, TRACKS, wordList, phraseList, BATCH } from '../course/index.js'
import { dueWords, MASTERED_BOX, stageStatus, nextItem, itemUnlocked, learnedCount } from '../learning.js'
import { streak, todayStr, addDays } from '../utils.js'
import { CountUp } from '../components/Effects.jsx'

const GOALS = [20, 30, 50, 80, 100, 150]
const LESSON_TRACKS = [
  { key: 'grammar', name: '语法', btn: '学语法', tip: '讲解 + 10 道练习' },
  { key: 'dialogues', name: '对话', btn: '练对话', tip: '听读 → 回忆 → 角色扮演 → 句子重组' },
  { key: 'passages', name: '听读', btn: '去听读', tip: '听力 / 阅读理解、听写、复述' },
  { key: 'speaking', name: '口语', btn: '练口语', tip: '看中文说英文 + 问答 / 描述 / 讲述 / 观点' },
]

function Bar({ label, n, total, color }) {
  return (
    <div className="map-track" style={{ '--c': color }}>
      <div className="mini-label"><span>{label}</span><span>{n}/{total}</span></div>
      <div className="map-bar"><div style={{ width: `${total ? (n / total) * 100 : 0}%` }} /></div>
    </div>
  )
}

// 课程地图里每条线的颜色（随主题变化，定义在 styles.css 的 --t-*）
const TRACK_COLORS = Object.fromEntries(['words', 'phrases', 'grammar', 'dialogues', 'passages', 'speaking'].map(k => [k, `var(--t-${k})`]))
// 课程地图里一条线超过 FOLD_OVER 课就折叠，只显示 FOLD_SHOW 课
const FOLD_OVER = 12
const FOLD_SHOW = 10

// 环形进度
function Ring({ pct }) {
  const r = 22, c = 2 * Math.PI * r
  return (
    <svg className="map-ring" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} className="ring-bg" />
      <circle cx="26" cy="26" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ '--len': c }} />
      <text x="26" y="30" textAnchor="middle"><CountUp value={`${pct}%`} /></text>
    </svg>
  )
}

export default function Plan({ progress, update, openLesson, setTab }) {
  const srs = progress.srs || {}
  const goal = progress.dailyGoal || 30
  const todayLog = progress.log?.[todayStr()] || {}
  const due = dueWords(srs).length
  const mastered = Object.values(srs).filter(s => s.box >= MASTERED_BOX).length
  const statuses = stages.map(s => stageStatus(progress, s, TRACKS))
  const current = stages.find((s, i) => statuses[i].unlocked && !statuses[i].passed) || stages[stages.length - 1]
  const cur = statuses[current.id - 1]
  const [openStage, setOpenStage] = useState(current.id)
  const [expanded, setExpanded] = useState({})
  const next = key => nextItem(progress, stages, TRACKS, key)

  const wordsLearned = learnedCount(progress, wordList)
  const phrasesLearned = learnedCount(progress, phraseList)
  const remaining = wordList.length - wordsLearned
  const doneOf = key => Object.keys(progress[TRACKS[key].done] || {}).length

  const stats = [
    { n: streak(progress.log), label: '连续学习（天）' },
    { n: `${wordsLearned}/${wordList.length}`, label: '单词' },
    { n: `${phrasesLearned}/${phraseList.length}`, label: '短语' },
    { n: mastered, label: '已掌握词条' },
    { n: `${doneOf('grammar')}/${TRACKS.grammar.list.length}`, label: '语法' },
    { n: `${doneOf('dialogues')}/${TRACKS.dialogues.list.length}`, label: '对话' },
    { n: `${doneOf('passages')}/${TRACKS.passages.list.length}`, label: '听读' },
    { n: `${doneOf('speaking')}/${TRACKS.speaking.list.length}`, label: '口语' },
  ]

  const nextWord = next('words')
  const nextPhrase = next('phrases')
  const missing = Object.entries(TRACKS).filter(([k]) => cur.counts[k].n < cur.counts[k].total)
    .map(([k, t]) => `${t.label} ${cur.counts[k].n}/${cur.counts[k].total}`)

  return (
    <>
      <div className="hero">
        <h1>6 个阶段，从零到能用英语沟通</h1>
        <p>单词、短语、语法、对话、听读、口语六条线同时推进，每个阶段通过结业测试再进入下一阶段。节奏由你决定。</p>
      </div>

      <div className="stat-row eight">
        {stats.map(s => <div key={s.label} className="stat"><div className="n"><CountUp value={s.n} /></div><div className="l">{s.label}</div></div>)}
      </div>

      <div className="card today">
        <div className="week-head">
          <h2>今日任务 · 第 {current.id} 阶段 {current.title}</h2>
          <label className="muted">每天新词
            <select className="goal-select" value={goal} onChange={e => update('dailyGoal', Number(e.target.value))}>
              {GOALS.map(g => <option key={g} value={g}>{g} 个</option>)}
            </select>
          </label>
        </div>
        <div className="today-tasks">
          <div className="task">
            <div><b>复习</b>
              <div className="desc">{due > 0 ? `${due} 个单词 / 短语到了复习时间，先复习再学新的` : wordsLearned ? '今天没有到期的复习 ✓' : '学完第一组新词后开始'}</div>
            </div>
            <button className="btn secondary" disabled={!due} onClick={() => setTab('review')}>去复习</button>
          </div>
          <div className="task">
            <div><b>单词</b>（今天 {todayLog.words || 0} / {goal}）
              <div className="desc">{nextWord ? `下一组从第 ${nextWord.index + 1} 个起，每组 ${BATCH} 个` : '本阶段单词已学完'}</div>
              <div className="progress-bar thin"><div style={{ width: `${Math.min(100, ((todayLog.words || 0) / goal) * 100)}%` }} /></div>
            </div>
            <button className="btn" disabled={!nextWord} onClick={() => openLesson({ type: 'words' })}>学一组单词</button>
          </div>
          <div className="task">
            <div><b>短语与搭配</b>（今天 {todayLog.phrases || 0}）
              <div className="desc">{nextPhrase ? `短语动词和固定搭配，下一组：${nextPhrase.en} …` : '本阶段短语已学完'}</div>
            </div>
            <button className="btn" disabled={!nextPhrase} onClick={() => openLesson({ type: 'phrases' })}>学一组短语</button>
          </div>
          {LESSON_TRACKS.map(t => {
            const it = next(t.key)
            return (
              <div className="task" key={t.key}>
                <div><b>{t.name}</b>
                  <div className="desc">{it ? `第 ${it.index + 1} 课：${it.title}` : `本阶段${t.name}已学完`}<span className="muted"> · {t.tip}</span></div>
                </div>
                <button className="btn" disabled={!it} onClick={() => openLesson({ type: t.key, index: it.index })}>{t.btn}</button>
              </div>
            )
          })}
          <div className="task">
            <div><b>阶段结业测试</b>
              <div className="desc">
                {cur.passed ? '已通过' : cur.ready ? '本阶段内容全部学完，可以参加测试了' : `还差：${missing.join('，')}`}
              </div>
            </div>
            <button className="btn" disabled={!cur.ready || cur.passed} onClick={() => openLesson({ type: 'test', stage: current })}>参加测试</button>
          </div>
        </div>
        <div className="desc mt-s">
          按每天 {goal} 个新词，剩余 {remaining} 个单词约 {Math.ceil(remaining / goal)} 天学完（预计 {addDays(todayStr(), Math.ceil(remaining / goal))}）。
          建议每天约 2 小时：先复习（含语法综合复习）→ 1–3 组单词 → 1 组短语 → 语法、对话各 1 课 → 听读 1–2 篇 → 口语 1 个话题。
        </div>
      </div>

      <div className="card">
        <h2>课程地图</h2>
        <div className="desc">
          完成前一课才能学下一课。不会读音标？先看
          <a href="#" onClick={e => { e.preventDefault(); setTab('letters') }}>「发音入门」</a>。
        </div>
        <div className="map">
          {stages.map((s, i) => {
            const st = statuses[i]
            const counts = Object.values(st.counts)
            const total = counts.reduce((a, c) => a + c.total, 0)
            const pct = total ? Math.floor((counts.reduce((a, c) => a + c.n, 0) / total) * 100) : 0
            const state = st.passed ? 'passed' : !st.unlocked ? 'locked' : s.id === current.id ? 'current' : 'open'
            const isOpen = openStage === s.id
            return (
              <div key={s.id} className={`map-stage ${state}`}>
                <div className="map-node">{st.passed ? '✓' : st.unlocked ? s.id : '🔒'}</div>
                <div className="map-body">
                  <div className="map-head" onClick={() => setOpenStage(isOpen ? null : s.id)}>
                    <div className="map-title">
                      <div className="map-kicker">
                        STAGE {s.id}
                        <span className={`map-status ${state}`}>
                          {st.passed ? `已通过 ${progress.tests?.[s.id]} 分` : state === 'current' ? '进行中' : st.unlocked ? '已解锁' : '未解锁'}
                        </span>
                      </div>
                      <b>{s.title}</b>
                      <div className="desc">{s.goal}</div>
                    </div>
                    <Ring pct={pct} />
                    <span className={`map-chevron ${isOpen ? 'up' : ''}`}>▾</span>
                  </div>
                  <div className="map-tracks">
                    {Object.entries(TRACKS).map(([k, t]) => <Bar key={k} label={t.label} n={st.counts[k].n} total={st.counts[k].total} color={TRACK_COLORS[k]} />)}
                  </div>
                  {isOpen && (
                    <div className="map-lessons">
                      {LESSON_TRACKS.map(t => {
                        const doneMap = progress[TRACKS[t.key].done] || {}
                        const nextId = next(t.key)?.id
                        const items = TRACKS[t.key].list.slice(...s[t.key])
                        // 课太多（如听读每阶段 30 篇）时只显示当前进度附近的几课，可展开全部
                        const fold = items.length > FOLD_OVER && !expanded[`${s.id}-${t.key}`]
                        const firstUndone = items.findIndex(it => !(it.id in doneMap))
                        const start = fold ? Math.max(0, Math.min((firstUndone < 0 ? items.length : firstUndone) - 2, items.length - FOLD_SHOW)) : 0
                        const shown = fold ? items.slice(start, start + FOLD_SHOW) : items
                        const toggle = () => setExpanded(e => ({ ...e, [`${s.id}-${t.key}`]: !e[`${s.id}-${t.key}`] }))
                        return (
                          <div key={t.key} className="map-col" style={{ '--c': TRACK_COLORS[t.key] }}>
                            <div className="map-col-head">
                              <span>{t.name}</span>
                              <span className="muted">{st.counts[t.key].n}/{st.counts[t.key].total}</span>
                            </div>
                            {fold && start > 0 && <button className="map-fold top" onClick={toggle}>前 {start} 课已收起 · 点击展开</button>}
                            {shown.map(it => {
                              const done = it.id in doneMap
                              const open = itemUnlocked(progress, stages, TRACKS, t.key, it)
                              const isNext = it.id === nextId
                              return (
                                <button key={it.id} className={`lesson-row ${done ? 'done' : ''} ${isNext ? 'next' : ''}`} disabled={!open}
                                  onClick={() => openLesson({ type: t.key, index: it.index })}>
                                  <span className="dot">{done ? '✓' : open ? '' : '🔒'}</span>
                                  <span className="lesson-name">
                                    {it.index + 1}. {it.title}{it.mode && <span className="muted">（{it.mode === 'listen' ? '听力' : '阅读'}）</span>}
                                  </span>
                                  {done ? <span className="score">{doneMap[it.id]} 分</span> : isNext && <span className="go">开始 →</span>}
                                </button>
                              )
                            })}
                            {items.length > FOLD_OVER && (
                              <button className="map-fold" onClick={toggle}>
                                {fold ? `展开全部 ${items.length} 课（还有 ${items.length - FOLD_SHOW} 课）▾` : '收起 ▴'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="muted center credits">
        词库释义来自 <a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noreferrer">ECDICT</a>（MIT），
        部分例句来自 <a href="https://tatoeba.org" target="_blank" rel="noreferrer">Tatoeba</a>（CC BY 2.0 FR）
      </div>
    </>
  )
}
