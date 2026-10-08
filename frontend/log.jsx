import React, { useState } from 'react'
import './log.css'

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (email.trim()) onLogin?.()
  }

  return (
    <main className="login-container">
      <section className="login-card">
        <header className="login-header">
          <h1>HerbVisionAI</h1>
          <p>Enter your email to continue</p>
        </header>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <button className="login-button" type="submit">Continue</button>
        </form>
      </section>
      <div className="background-decoration" />
    </main>
  )
}

export default LoginPage
