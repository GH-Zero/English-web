import { useState, useEffect } from 'react'
import { loadVoiceSettings, saveVoiceSettings, englishVoices, bestVoiceName, speak } from '../utils.js'

const SAMPLE = 'Hello! Nice to meet you. How are you today?'

export default function VoiceSettings() {
  const [open, setOpen] = useState(false)
  const [s, setS] = useState(loadVoiceSettings)
  const [voices, setVoices] = useState(englishVoices)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => setVoices(englishVoices())
    speechSynthesis.addEventListener('voiceschanged', load)
    return () => speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  const set = patch => { const next = { ...s, ...patch }; setS(next); saveVoiceSettings(next) }

  return (
    <div className="voice-settings">
      <button className="voice-toggle" onClick={() => setOpen(!open)}>🔊 发音设置</button>
      {open && (
        <div className="voice-panel">
          <div className="vs-row">
            <b>发音来源</b>
            <label><input type="radio" checked={s.source === 'online'} onChange={() => set({ source: 'online' })} />
              在线真人级发音（有道词典，需联网）</label>
            <label><input type="radio" checked={s.source === 'system'} onChange={() => set({ source: 'system' })} />
              浏览器内置语音（离线可用）</label>
          </div>
          <div className="vs-row">
            <b>口音</b>
            <label><input type="radio" checked={s.accent === 'us'} onChange={() => set({ accent: 'us' })} /> 美式</label>
            <label><input type="radio" checked={s.accent === 'uk'} onChange={() => set({ accent: 'uk' })} /> 英式</label>
          </div>
          {s.source === 'system' && (
            <div className="vs-row">
              <b>系统语音</b>
              <select value={s.voiceURI} onChange={e => set({ voiceURI: e.target.value })}>
                <option value="">自动选择最佳（{bestVoiceName() || '无'}）</option>
                {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}（{v.lang}）</option>)}
              </select>
            </div>
          )}
          <div className="vs-row">
            <b>语速 {s.rate.toFixed(1)}x</b>
            <input type="range" min="0.6" max="1.2" step="0.1" value={s.rate}
              onChange={e => set({ rate: Number(e.target.value) })} />
          </div>
          <div className="row">
            <button className="btn" onClick={() => speak(SAMPLE)}>▶ 试听</button>
            <button className="btn secondary" onClick={() => setOpen(false)}>完成</button>
          </div>
          {s.source === 'system' && (
            <div className="muted mt-s">
              提示：Edge 浏览器自带的 “Natural” 语音音质最好；Mac 可在「系统设置 → 辅助功能 → 朗读内容 → 系统声音」下载 Premium 版英文语音。
            </div>
          )}
        </div>
      )}
    </div>
  )
}
