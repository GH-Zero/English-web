import { useState } from 'react'

export default function Dialogues({ dialogues, speak }) {
  const [idx, setIdx] = useState(0)
  const d = dialogues[idx]
  return (
    <div className="card">
      <h2>{d.title}<span className="pill">{idx + 1} / {dialogues.length}</span></h2>
      <div className="desc">点击句子听发音，试着大声跟读</div>
      {d.lines.map((l, i) => (
        <div className={`sentence ${l.right ? 'right' : ''}`} key={i}>
          <div className="who">{l.who}</div>
          <div className="en" style={{ cursor: 'pointer' }} onClick={() => speak(l.en)}>{l.en} 🔊</div>
          <div className="zh">{l.zh}</div>
        </div>
      ))}
      <div className="mt" style={{ display: 'flex', gap: 10 }}>
        <button className="btn secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>上一个</button>
        {idx < dialogues.length - 1
          ? <button className="btn" onClick={() => setIdx(idx + 1)}>下一个场景 →</button>
          : <button className="btn secondary" onClick={() => setIdx(0)}>回到第一个</button>}
      </div>
    </div>
  )
}
