import { useState, useRef, useEffect } from 'react'
import { speak, speakAll, stopSpeaking, normalize } from '../utils.js'
import { passageSet, dictationSet } from '../exercises.js'
import Drill from '../components/Drill.jsx'
import SpeakCheck from '../components/SpeakCheck.jsx'
import Summary from './Summary.jsx'

// 复述：用自己的话把短文内容说出来，再对照参考摘要和关键词
function Retell({ p, onDone }) {
  const [text, setText] = useState('')
  const [shown, setShown] = useState(false)
  const words = new Set(normalize(text).split(' '))
  const used = p.keys.filter(k => normalize(k).split(' ').every(w => words.has(w)))
  return (
    <>
      <div className="desc">用 1–3 句英文概括这篇{p.mode === 'listen' ? '听力' : '短文'}：谁、做了什么、结果或观点。尽量用上关键词。</div>
      <div className="hint-box">关键词提示：{p.keys.join(' · ')}</div>
      <textarea className="text-area" rows={3} value={text} disabled={shown} spellCheck={false}
        onChange={e => setText(e.target.value)} placeholder="打字，或点下面的按钮说出来" />
      {!shown && <SpeakCheck free target={p.summary} onResult={(s, heard) => heard && setText(t => (t ? t + ' ' : '') + heard)} />}
      {!shown
        ? <button className="btn mt" onClick={() => setShown(true)}>说完了，看参考复述</button>
        : (
          <div className="feedback-box">
            <div className="muted">关键词：{p.keys.map(k => <span key={k} className={`key ${used.includes(k) ? 'hit' : ''}`}>{used.includes(k) ? '✓' : '○'} {k}</span>)}</div>
            <div className="explain" style={{ cursor: 'pointer' }} onClick={() => speak(p.summary)}>参考复述：{p.summary} 🔊</div>
            <button className="btn mt" onClick={() => onDone(used.length / p.keys.length)}>继续 →</button>
          </div>
        )}
    </>
  )
}

// 听力：只听 → 答题 + 听写填空 → 复述 → 对照原文；阅读：读原文 → 答题 → 复述 → 复盘翻译
export default function PassageLesson({ p, onComplete }) {
  const listen = p.mode === 'listen'
  const hasRetell = !!p.summary
  const STEPS = listen
    ? ['只听不看', '答题与听写', ...(hasRetell ? ['复述'] : []), '对照原文']
    : ['阅读原文', '回答问题', ...(hasRetell ? ['复述'] : []), '复盘翻译']
  const [step, setStep] = useState(0)
  const [showZh, setShowZh] = useState(false)
  const [result, setResult] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [items] = useState(() => [...passageSet(p), ...(listen ? dictationSet(p) : [])])
  const run = useRef(0)
  const last = STEPS.length - 1

  // 播放途中点停止、点单句、做题时听题，都会打断整段播放，按钮随之恢复
  const playAll = async () => {
    const my = ++run.current
    setPlaying(true)
    await speakAll(p.lines.map(l => l.en))
    if (run.current === my) setPlaying(false)
  }
  const halt = () => { stopSpeaking(); setPlaying(false) }
  useEffect(() => () => { run.current++; stopSpeaking() }, [])

  const player = (
    <div className="row mb">
      {playing
        ? <button className="btn secondary" onClick={halt}>⏹ 停止</button>
        : <button className="btn secondary" onClick={playAll}>▶ {listen ? '播放录音' : '朗读全文'}</button>}
    </div>
  )

  const text = withZh => (
    <div className="passage">
      {p.lines.map((l, i) => (
        <span key={i} className="p-line" onClick={() => speak(l.en)}>
          {l.en}{withZh && <span className="p-zh">{l.zh}</span>}{' '}
        </span>
      ))}
    </div>
  )

  const header = (
    <>
      <h2>{p.title}<span className="pill">{listen ? '听力' : '阅读'}</span></h2>
      <div className="stepper">
        {STEPS.map((s, k) => <span key={k} className={k === step ? 'on' : k < step ? 'past' : ''}>{k + 1}. {s}</span>)}
      </div>
    </>
  )

  if (step === last && result) {
    return (
      <>
        <div className="card">
          {header}
          <div className="desc">点击句子可以单独再听。把没听懂 / 没读懂的句子跟读几遍。</div>
          {player}
          {text(true)}
        </div>
        <Summary result={result} title={listen ? '听力练习完成' : '阅读练习完成'} onNext={() => onComplete(result)} />
      </>
    )
  }

  return (
    <div className="card">
      {header}
      {step === 0 && (
        <>
          <div className="desc">
            {listen ? '不看原文，先完整听 2 遍，抓住人物、时间、地点、数字和说话目的。听完再答题。'
              : '先自己读一遍，遇到生词先根据上下文猜意思；实在读不懂再打开翻译。'}
          </div>
          {player}
          {!listen && (
            <>
              <label className="muted"><input type="checkbox" checked={showZh} onChange={e => setShowZh(e.target.checked)} /> 显示翻译</label>
              {text(showZh)}
            </>
          )}
          <button className="btn mt" onClick={() => setStep(1)}>{listen ? '听完了，开始答题 →' : '读完了，开始答题 →'}</button>
        </>
      )}
      {step === 1 && (
        <>
          <div className="desc">{listen ? '可以再播放录音，但先别看原文。最后几题是听写填空。' : '可以回看原文找依据。'}</div>
          {player}
          {!listen && text(false)}
          <Drill items={items} mode="test" onFinish={r => { setResult(r); halt(); setStep(2) }} />
        </>
      )}
      {hasRetell && step === 2 && <Retell p={p} onDone={() => setStep(3)} />}
    </div>
  )
}
