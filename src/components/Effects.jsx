import { useState, useEffect, useRef } from 'react'

// 页面特效：动态极光背景、鼠标跟随光斑、按钮点击涟漪、数字滚动
// 开启系统「减少动态效果」时全部关闭
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 光斑跟随鼠标的元素；嵌套时（任务在卡片里）每一层都更新位置
const SPOT = '.card, .stat, .task, .map-body'
// 点击出现涟漪的按钮
const RIPPLE = '.btn, nav button, .quiz-option'

function onPointerMove(e) {
  if (e.pointerType !== 'mouse') return
  for (let el = e.target.closest?.(SPOT); el; el = el.parentElement?.closest(SPOT)) {
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
}

function onPointerDown(e) {
  const el = e.target.closest?.(RIPPLE)
  if (!el || el.disabled || reduce()) return
  const r = el.getBoundingClientRect()
  const size = Math.max(r.width, r.height) * 2
  const dot = document.createElement('span')
  dot.className = 'ripple'
  dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`
  dot.addEventListener('animationend', () => dot.remove())
  el.appendChild(dot)
}

// 固定在最底层的背景：三团缓慢漂移的极光 + 两层闪烁星点
export function Backdrop() {
  useEffect(() => {
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])
  return (
    <div className="fx-bg" aria-hidden="true">
      <div className="aurora a1" /><div className="aurora a2" /><div className="aurora a3" />
      <div className="stars" /><div className="stars s2" />
    </div>
  )
}

// 把文字里的数字从 0 滚动到目标值，如 "12/5027"。只在第一次显示时滚动，之后数值变化直接更新
export function CountUp({ value, duration = 900 }) {
  const text = String(value)
  const played = useRef(false)
  const [shown, setShown] = useState(() => (reduce() ? text : text.replace(/\d+/g, '0')))

  useEffect(() => {
    if (played.current || reduce()) { setShown(text); return }
    const nums = (text.match(/\d+/g) || []).map(Number)
    let raf, start
    const tick = t => {
      start ??= t
      const k = Math.min(1, (t - start) / duration)
      const ease = 1 - (1 - k) ** 3
      let i = 0
      setShown(text.replace(/\d+/g, () => String(Math.round(nums[i++] * ease))))
      if (k < 1) raf = requestAnimationFrame(tick)
      else played.current = true
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text])

  return shown
}
