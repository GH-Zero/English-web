import { useState, useEffect } from 'react'
import { speak, speakAll, stopSpeaking, similarity } from '../utils.js'
import { dialogueOrderSet } from '../exercises.js'
import Drill from '../components/Drill.jsx'
import SpeakCheck from '../components/SpeakCheck.jsx'
import Summary from './Summary.jsx'

const STEPS = ['听读', '回忆', '角色扮演', '句子重组']

function Lines({ d, hideEn, revealed, onReveal }) {
  return d.lines.map((l, i) => (
    <div className={`sentence ${l.role === 1 ? 'right' : ''}`} key={i}>
      <div className="who">{d.roles[l.role]}</div>
      {hideEn && !revealed[i]
        ? <div className="en hidden-en" onClick={() => onReveal(i)}>先在心里说出英文，再点击查看</div>
        : <div className="en" style={{ cursor: 'pointer' }} onClick={() => speak(l.en)}>{l.en} 🔊</div>}
      <div className="zh">{l.zh}</div>
    </div>
  ))
}

function RolePlay({ d, onFinish }) {
  const [me, setMe] = useState(null)
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [checked, setChecked] = useState(null)
  const [scores, setScores] = useState([])
  const line = d.lines[i]

  useEffect(() => {
    if (me != null && line && line.role !== me) speak(line.en)
  }, [me, i])

  if (me == null) {
    return (
      <div className="center">
        <div className="desc">选择你要扮演的角色。电脑说对方的台词，轮到你时根据中文说出或写出英文。</div>
        <div className="row center-row">
          {d.roles.map((r, k) => <button key={k} className="btn" onClick={() => setMe(k)}>我演「{r}」</button>)}
        </div>
      </div>
    )
  }

  const next = s => {
    const all = s == null ? scores : [...scores, s]
    setScores(all); setText(''); setChecked(null)
    if (i + 1 >= d.lines.length) onFinish(all)
    else setI(i + 1)
  }

  const history = d.lines.slice(0, i)
  return (
    <div>
      {history.map((l, k) => (
        <div className={`sentence ${l.role === 1 ? 'right' : ''}`} key={k}>
          <div className="who">{d.roles[l.role]}</div><div className="en">{l.en}</div>
        </div>
      ))}
      {line.role !== me ? (
        <div className={`sentence ${line.role === 1 ? 'right' : ''} current`}>
          <div className="who">{d.roles[line.role]}</div>
          <div className="en" onClick={() => speak(line.en)} style={{ cursor: 'pointer' }}>{line.en} 🔊</div>
          <div className="zh">{line.zh}</div>
          <button className="btn mt" onClick={() => next(null)}>听懂了 →</button>
        </div>
      ) : (
        <div className="sentence current">
          <div className="who">轮到你（{d.roles[me]}）：{line.zh}</div>
          <form className="row" onSubmit={e => { e.preventDefault(); if (text.trim()) setChecked(similarity(text, line.en)) }}>
            <input className="text-input" value={text} disabled={checked != null} autoComplete="off"
              spellCheck={false} onChange={e => setText(e.target.value)} placeholder="写出这句英文，或点击跟读直接说" />
            {checked == null && <button className="btn" disabled={!text.trim()}>检查</button>}
          </form>
          {checked == null && <SpeakCheck target={line.en} onResult={(s, heard) => { setText(heard); setChecked(s) }} />}
          {checked != null && (
            <div className={`feedback-box ${checked >= 0.8 ? 'ok' : 'no'}`}>
              <div>{checked >= 0.8 ? '✓ 说得好' : '再对照一下'}（匹配度 {Math.round(checked * 100)}%）</div>
              <div className="explain" onClick={() => speak(line.en)} style={{ cursor: 'pointer' }}>标准说法：{line.en} 🔊</div>
              <button className="btn mt" onClick={() => next(checked)}>继续 →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DialogueLesson({ d, onComplete }) {
  const [step, setStep] = useState(0)
  const [revealed, setRevealed] = useState({})
  const [roleScore, setRoleScore] = useState(null)
  const [result, setResult] = useState(null)

  const playAll = () => speakAll(d.lines.map(l => l.en))
  useEffect(() => () => stopSpeaking(), [])

  const header = (
    <>
      <h2>{d.title}</h2>
      <div className="stepper">
        {STEPS.map((s, k) => <span key={k} className={k === step ? 'on' : k < step ? 'past' : ''}>{k + 1}. {s}</span>)}
      </div>
    </>
  )

  if (result) {
    return (
      <Summary result={result} title="对话课完成"
        note={roleScore != null ? `角色扮演平均匹配度 ${Math.round(roleScore * 100)}%` : null}
        onNext={() => onComplete(result)} />
    )
  }

  return (
    <div className="card">
      {header}
      {step === 0 && (
        <>
          <div className="desc">先完整听一遍，再逐句点击跟读，注意语调。</div>
          <button className="btn secondary mb" onClick={playAll}>▶ 播放整段对话</button>
          <Lines d={d} />
          <h3 className="sub-title">本课句型</h3>
          {d.patterns.map((p, k) => (
            <div key={k} className="word-item mb-s" onClick={() => speak(p.en)} style={{ cursor: 'pointer' }}>
              <div><span className="en-s">{p.en}</span><div className="zh">{p.zh}</div></div><span>🔊</span>
            </div>
          ))}
          <button className="btn mt" onClick={() => setStep(1)}>下一步：遮住英文回忆 →</button>
        </>
      )}
      {step === 1 && (
        <>
          <div className="desc">只看中文，先自己说出英文，再点击核对。全部翻开后进入下一步。</div>
          <Lines d={d} hideEn revealed={revealed} onReveal={k => setRevealed({ ...revealed, [k]: true })} />
          <button className="btn mt" disabled={Object.keys(revealed).length < d.lines.length}
            onClick={() => setStep(2)}>下一步：角色扮演 →</button>
        </>
      )}
      {step === 2 && (
        <RolePlay d={d} onFinish={scores => {
          setRoleScore(scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null)
          setStep(3)
        }} />
      )}
      {step === 3 && <Drill items={dialogueOrderSet(d)} onFinish={setResult} />}
    </div>
  )
}
