import React, { useEffect, useState } from 'react'
import HomePage from './home'
import AboutPage from './about'
import ContactsPage from './contacts'
import HerbPedia from './HerbPedia'
import AdminPanel from './AdminPanel'
import './index.css'

function App() {
  const [page, setPage] = useState(() => window.location.hash.slice(1))

  useEffect(() => {
    const syncPage = () => setPage(window.location.hash.slice(1))
    window.addEventListener('hashchange', syncPage)
    return () => window.removeEventListener('hashchange', syncPage)
  }, [])

  return (
    <>
      {page === 'about-page' ? <AboutPage /> :
      page === 'contact-page' ? <ContactsPage /> :
      page === 'herbpedia-page' ? <HerbPedia /> :
      page === 'admin-panel' ? <AdminPanel /> :
      <HomePage />}
    </>
  )
}

export default App
