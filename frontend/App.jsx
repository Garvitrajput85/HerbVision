import React, { useState } from 'react'
import LoginPage from './log'
import HomePage from './home'
import './index.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  return (
    <>
      {isLoggedIn ? (
        <HomePage onRequireLogin={() => setIsLoggedIn(false)} />
      ) : (
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      )}
    </>
  )
}

export default App
