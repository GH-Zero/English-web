import { useState } from 'react'
import { signIn } from '../utils.js'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegister = mode === 'register'

  const submit = async e => {
    e.preventDefault()
    if (isRegister && password !== password2) return setError('两次输入的密码不一样')
    setBusy(true)
    setError('')
    try { onLogin(await signIn(mode, name.trim(), password)) } catch (err) { setError(err.message) }
    setBusy(false)
  }
  const switchMode = () => { setMode(isRegister ? 'login' : 'register'); setError('') }

  return (
    <div className="container login">
      <div className="hero">
        <h1>English from Zero<span className="sep"> · </span><span className="nowrap">零基础学英语</span></h1>
        <p>登录后学习进度保存在服务器上，换浏览器、换电脑都能接着学</p>
      </div>
      <form className="card login-form" onSubmit={submit}>
        <h2>{isRegister ? '注册新账号' : '登录'}</h2>
        <input className="text-input" placeholder="用户名" autoComplete="username"
          value={name} onChange={e => setName(e.target.value)} required />
        <input className="text-input" type="password" placeholder={isRegister ? '密码（至少 6 位）' : '密码'}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password} onChange={e => setPassword(e.target.value)} required />
        {isRegister && (
          <input className="text-input" type="password" placeholder="再输一次密码" autoComplete="new-password"
            value={password2} onChange={e => setPassword2(e.target.value)} required />
        )}
        {error && <div className="feedback no">{error}</div>}
        <div className="row">
          <button className="btn" disabled={busy}>{isRegister ? '注册并开始学习' : '登录'}</button>
          <button type="button" className="btn secondary" onClick={switchMode}>
            {isRegister ? '已有账号，去登录' : '没有账号？注册'}
          </button>
        </div>
      </form>
    </div>
  )
}
