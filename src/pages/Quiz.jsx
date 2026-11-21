import { useState } from 'react'
import { speak } from '../utils.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Quiz({ bank, progress, update }) {
  const [questions, setQuestions] = useState(null)
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const start = () => {
    setQuestions(shuffle(bank))
    setIdx(0); setPicked(null); setScore(0); setFinished(false)
  }

  if (!questions) {
    return (
      <div className="card center">
        <h2>测验闯关</h2>
        <div className="desc mt">共 {bank.length} 道选择题，涵盖前面所有课程内容</div>
        {progress.quizBest != null && <div className="desc">历史最好成绩：{progress.quizBest} 分</div>}
        <button className="btn mt" onClick={start}>开始闯关</button>
      </div>
    )
  }

  if (finished) {
    const pass = score >= 8
    return (
      <div className="card center">
        <h2>{pass ? '🎉 太棒了！' : '继续加油！'}</h2>
        <div className="score-big mt">{score} / {questions.length}</div>
        <div className="desc mt">
          {pass ? '基础掌握得很好，可以继续扩展词汇和对话场景。' : '建议回到对应课程复习一下，再来挑战。'}
        </div>
        <button className="btn mt" onClick={start}>再来一次</button>
      </div>
    )
  }

  const q = questions[idx]
  const pick = i => {
    if (picked != null) return
    setPicked(i)
    if (i === q.answer) setScore(s => s + 1)
  }
  const next = () => {
    if (idx + 1 >= questions.length) {
      const final = score
      if (progress.quizBest == null || final > progress.quizBest) update('quizBest', final)
      setFinished(true)
    } else {
      setIdx(idx + 1); setPicked(null)
    }
  }

  return (
    <div className="card">
      <h2>第 {idx + 1} / {questions.length} 题</h2>
      <div className="progress-bar"><div style={{ width: `${(idx / questions.length) * 100}%` }} /></div>
      <div style={{ fontSize: 17, marginBottom: 16 }}>{q.q}</div>
      {q.options.map((opt, i) => {
        let cls = 'quiz-option'
        if (picked != null) {
          if (i === q.answer) cls += ' correct'
          else if (i === picked) cls += ' wrong'
        }
        return (
          <button key={i} className={cls} disabled={picked != null} onClick={() => pick(i)}>
            {opt}
          </button>
        )
      })}
      <div className={`feedback ${picked == null ? '' : picked === q.answer ? 'ok' : 'no'}`}>
        {picked == null ? '' : picked === q.answer ? '✓ 回答正确！' : `✗ 正确答案：${q.options[q.answer]}`}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn" disabled={picked == null} onClick={next}>
          {idx + 1 >= questions.length ? '查看成绩' : '下一题 →'}
        </button>
        <button className="btn secondary" onClick={() => speak(q.q)}>🔊 听题目</button>
      </div>
    </div>
  )
}
