import { useState } from 'react'

export default function Words({ groups, speak, progress, update }) {
  const idx = progress.wordLesson ?? 0
  const group = groups[idx]
  const done = idx >= groups.length

  const finish = () => {
    if (idx + 1 > (progress.wordLesson ?? 0)) update('wordLesson', idx + 1)
  }

  if (done) {
    return (
      <div className="card center">
        <h2>🎉 全部词汇课程已完成！</h2>
        <div className="desc mt">可以去「测验闯关」检验一下，或去「简单对话」实战运用。</div>
        <button className="btn mt" onClick={() => update('wordLesson', 0)}>重新学习</button>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>{group.title}<span className="pill">第 {idx + 1} / {groups.length} 课</span></h2>
      <div className="desc">点击右侧按钮听发音，跟读 2-3 遍再进入下一课</div>
      <div className="word-list">
        {group.words.map(w => (
          <div className="word-item" key={w.en}>
            <div>
              <span className="en">{w.en}</span>
              <span className="ph">{w.ph}</span>
              <div className="zh">{w.zh}</div>
            </div>
            <button className="speak-btn" title="听发音" onClick={() => speak(w.en)}>🔊</button>
          </div>
        ))}
      </div>
      <div className="mt" style={{ display: 'flex', gap: 10 }}>
        <button className="btn secondary" disabled={idx === 0}
          onClick={() => update('wordLesson', idx - 1)}>上一课</button>
        <button className="btn" onClick={finish}>我学会了，下一课 →</button>
      </div>
    </div>
  )
}
