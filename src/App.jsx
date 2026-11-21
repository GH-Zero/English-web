import { useState, useEffect } from 'react'
import { letters, phonics } from './data.js'
import { useProgress, speak, loadAuth, signOut } from './utils.js'
import { dueWords, migrate } from './learning.js'
import Login from './pages/Login.jsx'
import Plan from './pages/Plan.jsx'
import Lesson from './pages/Lesson.jsx'
import Review from './pages/Review.jsx'
import WrongBook from './pages/WrongBook.jsx'
import Letters from './pages/Letters.jsx'
import VoiceSettings from './components/VoiceSettings.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'

// 先登录，每个用户各学各的进度
export default function App() {
  const [auth, setAuth] = useState(loadAuth)
  if (!auth) return <Login onLogin={setAuth} />
  const logout = () => { signOut(auth); setAuth(null) }
  return <Learner key={auth.name} auth={auth} onLogout={logout} />
}

function Learner({ auth, onLogout }) {
  const [tab, setTab] = useState('plan')
  const [lesson, setLesson] = useState(null)
  const [progress, update, ready] = useProgress(auth, onLogout)

  // 旧版 12 周课程的进度迁移到新结构（等学习记录加载完再执行）
  useEffect(() => {
    if (!ready) return
    const m = migrate(progress)
    if (m) for (const [k, v] of Object.entries(m)) update(k, v)
  }, [ready])

  if (!ready) return <div className="container center muted">正在加载学习记录…</div>

  const due = dueWords(progress.srs).length
  const wrongCount = Object.keys(progress.wrong || {}).length
  const tabs = [
    { id: 'plan', label: '学习计划' },
    { id: 'review', label: '每日复习', badge: due },
    { id: 'wrong', label: '错题本', badge: wrongCount },
    { id: 'letters', label: '发音入门' },
  ]
  const go = id => { setLesson(null); setTab(id); window.scrollTo(0, 0) }
  const openLesson = l => { setLesson({ ...l, key: Date.now() }); window.scrollTo(0, 0) }

  return (
    <>
      <header>
        <div className="header-inner">
          <div className="logo">English from Zero · 零基础学英语</div>
          <nav>
            {tabs.map(t => (
              <button key={t.id} className={!lesson && tab === t.id ? 'active' : ''} onClick={() => go(t.id)}>
                {t.label}{t.badge > 0 && <span className="badge">{t.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="row header-tools">
            <VoiceSettings />
            <ThemeToggle />
            <span className="muted user-name" title={auth.name}>{auth.name}</span>
            <button className="voice-toggle" onClick={() => { if (confirm('确定退出登录？')) onLogout() }}>退出</button>
          </div>
        </div>
      </header>
      <div className="container">
        {lesson
          ? <Lesson key={lesson.key} lesson={lesson} progress={progress} update={update} onBack={() => go('plan')} />
          : <>
              {tab === 'plan' && <Plan progress={progress} update={update} openLesson={openLesson} setTab={go} />}
              {tab === 'review' && <Review progress={progress} update={update} />}
              {tab === 'wrong' && <WrongBook progress={progress} update={update} />}
              {tab === 'letters' && <Letters letters={letters} phonics={phonics} speak={speak} />}
            </>}
      </div>
    </>
  )
}
