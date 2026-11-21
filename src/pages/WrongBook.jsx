import { useState } from 'react'
import { removeWrong } from '../learning.js'
import { shuffle } from '../utils.js'
import Drill from '../components/Drill.jsx'
import Summary from '../lesson/Summary.jsx'

const kindLabel = id => ({ w: '单词', g: '语法', d: '对话' }[id[0]])

export default function WrongBook({ progress, update }) {
  const wrong = progress.wrong || {}
  const [items, setItems] = useState(null)
  const [result, setResult] = useState(null)
  const list = Object.entries(wrong).sort((a, b) => b[1].count - a[1].count)

  const finish = r => {
    // 第一次就答对的题移出错题本
    update('wrong', w => removeWrong(w, Object.keys(r.first).filter(id => r.first[id])))
    setResult(r); setItems(null)
  }

  if (items) {
    return <div className="card"><h2>错题重练</h2><Drill items={items} onFinish={finish} /></div>
  }
  if (result) {
    return <Summary result={result} title="错题练习完成" note="一次答对的题已移出错题本。"
      onNext={() => setResult(null)} nextLabel="好的" />
  }

  return (
    <div className="card">
      <h2>错题本<span className="pill">{list.length} 题</span></h2>
      <div className="desc">学习、复习和测试中答错的题都会收集在这里。重练时一次答对就移出。</div>
      {list.length === 0
        ? <div className="center desc mt">目前没有错题 👍</div>
        : (
          <>
            <button className="btn mb" onClick={() => setItems(shuffle(list.map(([, v]) => v.ex)).slice(0, 20))}>
              重练错题（最多 20 题）
            </button>
            {list.map(([id, v]) => (
              <div key={id} className="wrong-item">
                <span><span className="pill">{kindLabel(id)}</span> {v.ex.prompt}</span>
                <span><b>{v.ex.type === 'choice' ? v.ex.options[v.ex.answer] : v.ex.answer}</b>
                  <span className="muted"> · 错 {v.count} 次</span></span>
              </div>
            ))}
          </>
        )}
    </div>
  )
}
