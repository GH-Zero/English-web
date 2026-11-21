export default function Home({ setTab, progress }) {
  const items = [
    { id: 'letters', title: '1. 字母与音标', desc: '认识 26 个字母和常见发音规律' },
    { id: 'words', title: '2. 基础词汇', desc: '5 组高频入门词汇，点击可听发音' },
    { id: 'dialogues', title: '3. 简单对话', desc: '3 个日常场景，学会开口说' },
    { id: 'quiz', title: '4. 测验闯关', desc: '10 道题检验学习成果', badge: progress.quizBest != null ? `最好成绩 ${progress.quizBest} 分` : null },
  ]
  return (
    <>
      <div className="hero">
        <h1>零基础，也能学好英语</h1>
        <p>从字母到对话，一步步来。点击卡片开始学习 →</p>
      </div>
      <div className="grid steps">
        {items.map(it => (
          <div key={it.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setTab(it.id)}>
            <h2>{it.title}{it.badge && <span className="pill">{it.badge}</span>}</h2>
            <div className="desc">{it.desc}</div>
            <button className="btn secondary">开始学习</button>
          </div>
        ))}
      </div>
    </>
  )
}
