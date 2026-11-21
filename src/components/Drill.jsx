import { useState } from 'react'
import Exercise from './Exercise.jsx'

// 一组练习。learn 模式：答错的题排到队尾，直到全部答对；test 模式：每题只答一次
export default function Drill({ items, mode = 'learn', onFinish }) {
  const [queue, setQueue] = useState(items)
  const [attempt, setAttempt] = useState(0)
  const [first, setFirst] = useState({}) // id -> 第一次是否答对
  const [doneCount, setDoneCount] = useState(0)

  const ex = queue[0]
  const done = ok => {
    const nextFirst = ex.id in first ? first : { ...first, [ex.id]: ok }
    let rest = queue.slice(1)
    let finished = doneCount
    if (ok || mode === 'test') finished++
    else rest = [...rest, ex]
    setFirst(nextFirst); setDoneCount(finished); setAttempt(a => a + 1)
    if (rest.length === 0) {
      const wrong = items.filter(it => nextFirst[it.id] === false)
      const correct = items.length - wrong.length
      onFinish({ first: nextFirst, wrong, correct, total: items.length })
    } else setQueue(rest)
  }

  if (!ex) return null
  const retry = ex.id in first
  return (
    <div>
      <div className="drill-head">
        <span>已完成 {doneCount} / {items.length}</span>
        {retry && <span className="pill warn">再练一次</span>}
      </div>
      <div className="progress-bar"><div style={{ width: `${(doneCount / items.length) * 100}%` }} /></div>
      <Exercise key={`${ex.id}-${attempt}`} ex={ex} onDone={done} />
    </div>
  )
}
