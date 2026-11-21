import { useState, useEffect } from 'react'
import { speak } from '../utils.js'
import { wordLessonSet } from '../exercises.js'
import Drill from '../components/Drill.jsx'
import SpeakCheck from '../components/SpeakCheck.jsx'
import Summary from './Summary.jsx'

export default function WordLesson({ words, pool, onComplete, doneActions }) {
  const [stage, setStage] = useState('learn')
  const [i, setI] = useState(0)
  const [set, setSet] = useState(null)
  const [result, setResult] = useState(null)
  const w = words[i]

  useEffect(() => { if (stage === 'learn') speak(w.en) }, [i, stage])

  if (stage === 'learn') {
    return (
      <div className="card">
        <div className="steps-line">① 认识新词 → ② 三轮练习 → ③ 进入复习计划</div>
        <div className="drill-head"><span>新词 {i + 1} / {words.length}</span></div>
        <div className="progress-bar"><div style={{ width: `${((i + 1) / words.length) * 100}%` }} /></div>
        <div className="flashcard">
          <div className="fc-en">{w.en} <button className="speak-btn" onClick={() => speak(w.en)}>🔊</button></div>
          <div className="fc-ph">{w.ph}</div>
          <div className="fc-zh">{w.zh}</div>
          {w.def && w.def !== w.zh && <div className="fc-def">{w.def.split('\n').map((d, k) => <div key={k}>{d}</div>)}</div>}
          {w.ex && <div className="fc-ex" onClick={() => speak(w.ex)}>{w.ex} 🔊</div>}
          {w.ex && <div className="fc-exzh">{w.exZh}</div>}
          <SpeakCheck key={w.en} target={w.en} />
        </div>
        <div className="row mt">
          <button className="btn secondary" disabled={i === 0} onClick={() => setI(i - 1)}>上一个</button>
          {i < words.length - 1
            ? <button className="btn" onClick={() => setI(i + 1)}>下一个 →</button>
            : <button className="btn" onClick={() => { setSet(wordLessonSet(words, pool)); setStage('drill') }}>
                开始练习（{words.length * 3} 题）</button>}
        </div>
      </div>
    )
  }

  if (stage === 'drill') {
    return (
      <div className="card">
        <div className="steps-line">第一轮：看词选义 · 第二轮：听音辨词 / 看中文选词 · 第三轮：例句填空 / 拼写</div>
        <Drill items={set} onFinish={r => { setResult(r); setStage('done'); onComplete(r) }} />
      </div>
    )
  }

  return (
    <Summary result={result} title="这组新词学完了"
      note={`这 ${words.length} 个词已加入复习计划，明天开始按记忆曲线复习。`}
      extra={doneActions} />
  )
}
