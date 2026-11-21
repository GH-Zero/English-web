import { useState, useEffect } from 'react'

// 主题：dark 深色科技 / light 浅色清新。保存在本浏览器里
// index.html 里有一段同样逻辑的小脚本，页面加载前先套上主题，避免闪一下
const KEY = 'english-from-zero-theme'
const THEMES = [
  { id: 'dark', icon: '🌙', label: '深色' },
  { id: 'light', icon: '☀️', label: '浅色' },
]

function apply(theme) {
  document.documentElement.dataset.theme = theme
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(KEY)
    return THEMES.some(t => t.id === saved) ? saved : 'dark'
  })

  useEffect(() => {
    apply(theme)
    localStorage.setItem(KEY, theme)
  }, [theme])

  const i = Math.max(0, THEMES.findIndex(t => t.id === theme))
  const nextTheme = THEMES[(i + 1) % THEMES.length]
  return (
    <button className="voice-toggle" title={`切换为${nextTheme.label}主题`} onClick={() => setTheme(nextTheme.id)}>
      {nextTheme.icon}<span className="theme-label"> {nextTheme.label}</span>
    </button>
  )
}
