import { useState, useEffect, useRef } from 'react'
import { speak, normalize } from '../utils.js'

function isCorrect(ex, value) {
  if (ex.type === 'choice') return value === ex.answer
  if (ex.type === 'order') return normalize(value.join(' ')) === normalize(ex.answer)
  return ex.accept.some(a => normalize(a) === normalize(value))
}

// 单道题：choice 选择 / input 填写 / order 连词成句
export default function Exercise({ ex, onDone }) {
  const [value, setValue] = useState(ex.type === 'order' ? [] : ex.type === 'input' ? '' : null)
  const [result, setResult] = useState(null) // null | true | false
  const inputRef = useRef(null)

  useEffect(() => {
    if (ex.audio) speak(ex.audio)
    inputRef.current?.focus()
  }, [ex])

  const check = v => {
    if (result != null) return
    const ok = isCorrect(ex, v)
    setResult(ok)
    if (ex.audioAfter) speak(ex.audioAfter)
  }

  const correctText = ex.type === 'choice' ? ex.options[ex.answer] : ex.answer
  const answered = result != null

  return (
    <div>
      <div className="ex-prompt">
        {ex.prompt}
        {ex.audio && <button className="speak-btn ml" onClick={() => speak(ex.audio)}>🔊</button>}
      </div>
      {ex.sub && <div className="ex-sub">{ex.sub}</div>}

      {ex.type === 'choice' && ex.options.map((opt, i) => {
        let cls = 'quiz-option'
        if (answered) {
          if (i === ex.answer) cls += ' correct'
          else if (i === value) cls += ' wrong'
        }
        return (
          <button key={i} className={cls} disabled={answered}
            onClick={() => { setValue(i); check(i) }}>{opt}</button>
        )
      })}

      {ex.type === 'input' && (
        <form onSubmit={e => { e.preventDefault(); if (value.trim()) check(value) }} className="row">
          <input ref={inputRef} className="text-input" value={value} disabled={answered}
            autoCapitalize="off" autoComplete="off" spellCheck={false}
            onChange={e => setValue(e.target.value)} placeholder="输入英文后按回车" />
          {!answered && <button className="btn" disabled={!value.trim()}>检查</button>}
        </form>
      )}

      {ex.type === 'order' && (
        <>
          <div className="token-line">
            {value.length === 0 && <span className="muted">点击下面的单词组成句子</span>}
            {value.map((t, i) => (
              <button key={i} className="token" disabled={answered}
                onClick={() => setValue(value.filter((_, j) => j !== i))}>{ex.tokens[t]}</button>
            ))}
          </div>
          <div className="token-pool">
            {ex.tokens.map((t, i) => (
              <button key={i} className="token" disabled={answered || value.includes(i)}
                onClick={() => setValue([...value, i])}>{t}</button>
            ))}
          </div>
          {!answered && (
            <button className="btn mt" disabled={value.length !== ex.tokens.length}
              onClick={() => check(value.map(i => ex.tokens[i]))}>检查</button>
          )}
        </>
      )}

      {answered && (
        <div className={`feedback-box ${result ? 'ok' : 'no'}`}>
          <div>{result ? '✓ 回答正确' : <>✗ 正确答案：<b>{correctText}</b></>}</div>
          {ex.explain && <div className="explain">{ex.explain}</div>}
          <button className="btn mt" autoFocus onClick={() => onDone(result)}>继续 →</button>
        </div>
      )}
    </div>
  )
}
