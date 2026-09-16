import React, { useState } from 'react'
import LoginPage from './log'
import HomePage from './home'
import './index.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <>
      {isLoggedIn ? (
        <HomePage />
      ) : (
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      )}
    </>
  )
}

export default App
