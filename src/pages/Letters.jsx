import { useState } from 'react'
import pron from '../course/pronunciation.js'

function SoundGrid({ items, speak }) {
  return (
    <div className="pron-grid">
      {items.map(s => (
        <div key={s.ipa} className="pron-card">
          <div className="ipa">/{s.ipa}/</div>
          <div className="ws">{s.words.map(w => <button key={w} onClick={() => speak(w)}>{w} 🔊</button>)}</div>
          <div className="tip">{s.tip}</div>
        </div>
      ))}
    </div>
  )
}

export default function Letters({ letters, phonics, speak }) {
  const [tab, setTab] = useState('letters')
  const tabs = [
    { id: 'letters', label: '字母与拼读' },
    { id: 'vowels', label: `元音 ${pron.vowels.length} 个` },
    { id: 'consonants', label: `辅音 ${pron.consonants.length} 个` },
    { id: 'rules', label: '重音 · 连读 · 语调' },
  ]
  return (
    <>
      <div className="card">
        <h2>发音入门</h2>
        <div className="desc">先认字母和音标，再学连读、弱读、语调。点击任何单词或句子都能听发音，听完马上模仿。</div>
        <div className="stepper">
          {tabs.map(t => (
            <span key={t.id} className={tab === t.id ? 'on' : ''} style={{ cursor: 'pointer' }} onClick={() => setTab(t.id)}>{t.label}</span>
          ))}
        </div>
      </div>

      {tab === 'letters' && (
        <>
          <div className="card">
            <h2>26 个字母</h2>
            <div className="desc">点击卡片听发音</div>
            <div className="letter-grid">
              {letters.map(l => (
                <div key={l.ch} className="letter-card" onClick={() => speak(l.ch)}>
                  <div className="big">{l.ch}{l.ch.toLowerCase()}</div>
                  <div className="sound">{l.sound}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2>常见发音规律（自然拼读入门）</h2>
            <div className="desc">先记住这几条规律，见词能读、听音能拼</div>
            {phonics.map(p => (
              <div className="word-item" key={p.title} style={{ marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div className="desc">{p.tip}</div>
                </div>
                <button className="btn secondary" onClick={() => speak(p.words.join(', '))}>
                  {p.words.join(' · ')}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'vowels' && <div className="card"><h2>元音</h2><SoundGrid items={pron.vowels} speak={speak} /></div>}
      {tab === 'consonants' && <div className="card"><h2>辅音</h2><SoundGrid items={pron.consonants} speak={speak} /></div>}

      {tab === 'rules' && pron.rules.map(r => (
        <div key={r.title} className="card">
          <h2>{r.title}</h2>
          <ul className="grammar-points">{r.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
          {r.examples.map((e, i) => {
            const [en, zh] = e.split('|')
            return (
              <div key={i} className="sentence" style={{ cursor: 'pointer' }} onClick={() => speak(en)}>
                <div className="en">{en} 🔊</div>
                <div className="zh">{zh}</div>
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}
