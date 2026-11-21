import { CountUp } from '../components/Effects.jsx'

// 练习结束后的总结
export default function Summary({ result, title, note, onNext, nextLabel = '完成今天的任务 ✓', extra }) {
  const pct = Math.round((result.correct / result.total) * 100)
  return (
    <div className="card center">
      <h2>{title}</h2>
      <div className="score-big mt"><CountUp value={`${pct}%`} /></div>
      <div className="desc">首次答对 {result.correct} / {result.total} 题</div>
      {note && <div className="desc">{note}</div>}
      {result.wrong.length > 0 && (
        <div className="wrong-list">
          <div className="muted">以下题目已放进错题本：</div>
          {result.wrong.map(ex => (
            <div key={ex.id} className="wrong-item">
              <span>{ex.prompt}</span>
              <b>{ex.type === 'choice' ? ex.options[ex.answer] : ex.answer}</b>
            </div>
          ))}
        </div>
      )}
      {extra}
      {onNext && <button className="btn mt" onClick={onNext}>{nextLabel}</button>}
    </div>
  )
}
