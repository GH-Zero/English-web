import { useState } from 'react'
import { canListen, canRecord, isEmbedded, listen, similarity, startRecording, speak } from '../utils.js'

const ERRORS = {
  'not-allowed': '麦克风权限被拒绝：请点地址栏左侧的图标，允许本网站使用麦克风',
  'service-not-allowed': '麦克风权限被拒绝：请点地址栏左侧的图标，允许本网站使用麦克风',
  'audio-capture': '没有检测到麦克风，请检查耳机或麦克风是否连接',
  'no-speech': '没有听到声音：点击按钮后请马上大声读出来',
  network: '语音识别服务连不上（Chrome 的识别走 Google 服务器，国内网络通常无法访问）',
  'language-not-supported': '当前浏览器不支持英文识别',
}
// 这些错误重试也没用，本次打开页面期间直接改用录音对比
const FATAL = ['network', 'language-not-supported']
let recognitionBroken = false

// 跟读：优先用语音识别打分；识别不可用时改为“录音 + 和标准发音对比”
// free 模式用于自由回答：没有标准句，只把识别出的文字交给 onResult
export default function SpeakCheck({ target, onResult, free = false }) {
  const [mode, setMode] = useState(canListen && !recognitionBroken ? 'recognize' : 'record')
  const [state, setState] = useState('idle') // idle | listening | recording | done | error
  const [msg, setMsg] = useState('')
  const [score, setScore] = useState(0)
  const [recorder, setRecorder] = useState(null)
  const [myAudio, setMyAudio] = useState(null)

  if (isEmbedded) {
    return (
      <div className="speak-check">
        <span className="muted">跟读需要麦克风，编辑器内置浏览器不支持。请用 Chrome / Edge / Safari 打开 {typeof location !== 'undefined' && location.origin}</span>
      </div>
    )
  }
  if (!canListen && !canRecord) return null

  const recognize = async () => {
    setState('listening')
    try {
      const alts = await listen()
      if (!alts.length) throw 'no-speech'
      if (free) { setMsg(alts[0]); setScore(1); setState('done'); onResult?.(1, alts[0]); return }
      const best = alts.reduce((a, b) => (similarity(b, target) > similarity(a, target) ? b : a))
      const s = similarity(best, target)
      setMsg(best); setScore(s); setState('done')
      onResult?.(s, best)
    } catch (e) {
      setState('error')
      setMsg(ERRORS[e] || `识别失败（${e}），请再试一次`)
      if (FATAL.includes(e)) { recognitionBroken = true; if (canRecord) setMode('record') }
    }
  }

  const record = async () => {
    if (recorder) {
      const url = await recorder.stop()
      setRecorder(null); setMyAudio(url); setState('done')
      new Audio(url).play()
      return
    }
    try {
      setMyAudio(null)
      setRecorder(await startRecording())
      setState('recording')
    } catch (e) {
      setState('error')
      setMsg(e?.name === 'NotAllowedError' ? ERRORS['not-allowed'] : ERRORS['audio-capture'])
    }
  }

  if (mode === 'record') {
    return (
      <div className="speak-check col">
        {state === 'error' && <span className="no">{msg}</span>}
        <div className="row center-row">
          <button className={`btn ${recorder ? '' : 'secondary'}`} onClick={record}>
            {recorder ? '⏹ 说完了，停止录音' : free ? '🎙 录音回答' : '🎙 录音跟读'}
          </button>
          {myAudio && <button className="btn secondary" onClick={() => new Audio(myAudio).play()}>▶ 我的录音</button>}
          {myAudio && !free && <button className="btn secondary" onClick={() => speak(target)}>▶ 标准发音</button>}
        </div>
        {myAudio && !free && (
          <div className="row center-row">
            <span className="muted">对比一下，读得像吗？</span>
            <button className="btn secondary" onClick={() => onResult?.(1, target)}>👍 差不多</button>
            <button className="btn secondary" onClick={record}>再录一次</button>
          </div>
        )}
        {!myAudio && !recorder && (
          <span className="muted">{free ? '录下自己的回答，再和参考回答对比' : '录下自己的声音，和标准发音对比着听'}</span>
        )}
      </div>
    )
  }

  return (
    <div className="speak-check">
      <button className="btn secondary" disabled={state === 'listening'} onClick={recognize}>
        {state === 'listening' ? '🎙 正在听…请说出来' : free ? '🎤 说出回答' : '🎤 跟读'}
      </button>
      {state === 'done' && free && <span className="ok">识别到：“{msg}”</span>}
      {state === 'done' && !free && (
        <span className={score >= 0.8 ? 'ok' : 'no'}>
          识别到：“{msg}” · {Math.round(score * 100)} 分{score >= 0.8 ? ' 👍' : '，再试试'}
        </span>
      )}
      {state === 'error' && <span className="no">{msg}</span>}
      {state === 'error' && canRecord && (
        <button className="btn secondary" onClick={() => { setState('idle'); setMode('record') }}>改用录音对比</button>
      )}
    </div>
  )
}
