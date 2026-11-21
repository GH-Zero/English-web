import { useState } from 'react'
import { speak } from '../utils.js'
import { grammarSet } from '../exercises.js'
import Drill from '../components/Drill.jsx'
import Summary from './Summary.jsx'

export default function GrammarLesson({ g, onComplete }) {
  const [stage, setStage] = useState('learn')
  const [result, setResult] = useState(null)

  if (stage === 'learn') {
    return (
      <div className="card">
        <div className="steps-line">① 看讲解和例句 → ② 做练习（错题会重做）</div>
        <h2>{g.title}</h2>
        <ul className="grammar-points">
          {g.points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
        <h3 className="sub-title">例句（点击听发音，大声读 3 遍）</h3>
        {g.examples.map((e, i) => (
          <div key={i} className="sentence" onClick={() => speak(e.en)} style={{ cursor: 'pointer' }}>
            <div className="en">{e.en} 🔊</div>
            <div className="zh">{e.zh}</div>
          </div>
        ))}
        <button className="btn mt" onClick={() => setStage('drill')}>开始练习（{g.exercises.length} 题）</button>
      </div>
    )
  }

  if (stage === 'drill') {
    return (
      <div className="card">
        <h2>{g.title} · 练习</h2>
        <Drill items={grammarSet(g)} onFinish={r => { setResult(r); setStage('done') }} />
      </div>
    )
  }

  return <Summary result={result} title="语法课完成" onNext={() => onComplete(result)} />
}
