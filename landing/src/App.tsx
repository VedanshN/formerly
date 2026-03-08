import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import UseCases from './components/UseCases'
import Footer from './components/Footer'

function App() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className={`app ${mounted ? 'app--mounted' : ''}`}>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <UseCases />
      <Footer />
    </div>
  )
}

export default App
