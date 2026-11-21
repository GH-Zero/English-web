import { useState, useEffect } from 'react'
import { speak, similarity, normalize } from '../utils.js'
import SpeakCheck from '../components/SpeakCheck.jsx'

// 第一部分：看中文说英文
function Translate({ items, onDone }) {
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [score, setScore] = useState(null)
  const [scores, setScores] = useState([])
  const it = items[i]

  const check = t => { setText(t); setScore(similarity(t, it.en)) }
  const next = () => {
    const all = [...scores, score]
    setScores(all); setText(''); setScore(null)
    if (i + 1 >= items.length) onDone(all)
    else setI(i + 1)
  }

  return (
    <>
      <div className="drill-head"><span>看中文说英文 {i + 1} / {items.length}</span></div>
      <div className="ex-prompt">{it.zh}</div>
      <div className="ex-sub">先说出来（或写出来），再对照标准说法</div>
      <form className="row" onSubmit={e => { e.preventDefault(); if (text.trim()) check(text) }}>
        <input className="text-input" value={text} disabled={score != null} autoComplete="off" spellCheck={false}
          onChange={e => setText(e.target.value)} placeholder="输入英文，或点击下方按钮直接说" />
        {score == null && <button className="btn" disabled={!text.trim()}>检查</button>}
      </form>
      {score == null && <SpeakCheck key={i} target={it.en} onResult={(s, heard) => check(heard || it.en)} />}
      {score != null && (
        <div className={`feedback-box ${score >= 0.8 ? 'ok' : 'no'}`}>
          <div>{score >= 0.8 ? '✓ 表达正确' : '对照一下标准说法'}（匹配度 {Math.round(score * 100)}%）</div>
          <div className="explain" style={{ cursor: 'pointer' }} onClick={() => speak(it.en)}>标准说法：{it.en} 🔊</div>
          <button className="btn mt" onClick={next}>继续 →</button>
        </div>
      )}
    </>
  )
}

// 第二部分：围绕话题自由回答
function Topic({ topic, onDone }) {
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [shown, setShown] = useState(false)
  const [hint, setHint] = useState(false)
  const [scores, setScores] = useState([])
  const it = topic.items[i]

  useEffect(() => { speak(it.q) }, [i])

  const words = new Set(normalize(text).split(' '))
  const used = it.keys.filter(k => normalize(k).split(' ').every(w => words.has(w)))
  const next = self => {
    const all = [...scores, self]
    setScores(all); setText(''); setShown(false); setHint(false)
    if (i + 1 >= topic.items.length) onDone(all)
    else setI(i + 1)
  }

  return (
    <>
      <div className="drill-head"><span>话题「{topic.title}」 问题 {i + 1} / {topic.items.length}</span></div>
      <div className="ex-prompt">{it.q}<button className="speak-btn ml" onClick={() => speak(it.q)}>🔊</button></div>
      <div className="ex-sub">{it.zh}</div>
      {hint
        ? <div className="hint-box">句子框架：{it.hint}</div>
        : <button className="btn secondary mb" onClick={() => setHint(true)}>💡 给我一点提示</button>}
      <textarea className="text-area" rows={3} value={text} disabled={shown} spellCheck={false}
        onChange={e => setText(e.target.value)} placeholder="用自己的话回答，2–3 句就好。可以打字，也可以点下面的按钮说出来。" />
      {!shown && <SpeakCheck key={i} free target={it.sample} onResult={(s, heard) => heard && setText(t => (t ? t + ' ' : '') + heard)} />}
      {!shown
        ? <button className="btn mt" onClick={() => setShown(true)}>{text.trim() ? '说完了，看参考回答' : '想不出来，直接看参考回答'}</button>
        : (
          <div className="feedback-box">
            <div className="muted">关键词：{it.keys.map(k => (
              <span key={k} className={`key ${used.includes(k) ? 'hit' : ''}`}>{used.includes(k) ? '✓' : '○'} {k}</span>
            ))}</div>
            <div className="explain" style={{ cursor: 'pointer' }} onClick={() => speak(it.sample)}>参考回答：{it.sample} 🔊</div>
            <div className="muted mt-s">把参考回答大声读 2 遍，再用自己的情况改写一遍。</div>
            <div className="row mt">
              <button className="btn" onClick={() => next(1)}>👍 我能说出来</button>
              <button className="btn secondary" onClick={() => next(0.5)}>还要多练</button>
            </div>
          </div>
        )}
    </>
  )
}

const TYPE = { qa: '话题问答', describe: '描述', narrate: '讲述经历', opinion: '表达观点' }

export default function SpeakingLesson({ topic, translate, onComplete }) {
  const [part, setPart] = useState(0)
  const [tScores, setTScores] = useState([])

  const avg = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1)
  return (
    <div className="card">
      <h2>口语表达 · {topic.title}<span className="pill">{TYPE[topic.type] || '话题问答'}</span></h2>
      <div className="stepper">
        <span className={part === 0 ? 'on' : 'past'}>1. 看中文说英文</span>
        <span className={part === 1 ? 'on' : ''}>2. 话题自由回答</span>
      </div>
      {part === 0 && <Translate items={translate} onDone={s => { setTScores(s); setPart(1) }} />}
      {part === 1 && (
        <Topic topic={topic} onDone={s => {
          const score = (avg(tScores) + avg(s)) / 2
          onComplete({ correct: Math.round(score * 100), total: 100, wrong: [], first: {} })
        }} />
      )}
    </div>
  )
}
