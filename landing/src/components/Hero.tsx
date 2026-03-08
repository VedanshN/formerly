import { useState, useEffect, useRef } from 'react'
import './Hero.css'

const PROMPTS = [
  'A feedback form for our Python bootcamp with ratings and comments',
  'Office potluck sign-up with dish type and dietary restrictions checkboxes',
  'Employee satisfaction survey with a 1–5 scale on 8 topics',
  'Event RSVP with name, attendance, and meal preference dropdown',
  'Bug report form for our app with severity and steps to reproduce',
]

function useTypewriter(texts: string[], speed = 42, pause = 2200) {
  const [display, setDisplay] = useState('')
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[textIdx]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && charIdx <= current.length) {
      timeout = setTimeout(() => setCharIdx(i => i + 1), speed)
    } else if (!deleting && charIdx > current.length) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(i => i - 1), speed / 2)
    } else {
      setDeleting(false)
      setTextIdx(i => (i + 1) % texts.length)
    }

    setDisplay(current.slice(0, charIdx))
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, textIdx, texts, speed, pause])

  return display
}

export default function Hero() {
  const typed = useTypewriter(PROMPTS)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--mx', `${x}%`)
      el.style.setProperty('--my', `${y}%`)
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section className="hero" ref={ref}>
      <div className="hero__grid-overlay" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__eyebrow">
          <span className="label">Chrome Extension</span>
          <span className="hero__eyebrow-sep">—</span>
          <span className="hero__eyebrow-sub">Google Forms, automated</span>
        </div>

        <h1 className="hero__headline">
          Stop <em>building</em> forms.<br />
          Just <em>describe</em> them.
        </h1>

        <p className="hero__sub">
          Type what you need. Formerly talks to AI, then builds the
          entire Google Form directly in your Drive — every question,
          type, and option, exactly right.
        </p>

        {/* Fake prompt terminal */}
        <div className="hero__terminal" aria-label="Example prompt">
          <div className="hero__terminal-bar">
            <span /><span /><span />
            <span className="hero__terminal-label">Formerly prompt</span>
          </div>
          <div className="hero__terminal-body">
            <span className="hero__terminal-prefix">→ </span>
            <span className="hero__terminal-typed">{typed}</span>
            <span className="hero__terminal-cursor" aria-hidden="true">|</span>
          </div>
        </div>

        <div className="hero__actions">
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="hero__btn-primary"
          >
            Add to Chrome
            <span className="hero__btn-arrow">→</span>
          </a>
          <span className="hero__note">Free · No account required · Uses your own Google Drive</span>
        </div>
      </div>

      {/* Floating form preview */}
      <div className="hero__form-preview container" aria-hidden="true">
        <div className="hero__form-card">
          <div className="hero__form-header">
            <div className="hero__form-title-bar" />
            <div className="hero__form-desc-bar" />
          </div>
          {['Name', 'Department', 'Overall rating', 'Comments'].map((q, i) => (
            <div key={q} className="hero__form-question" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
              <div className="hero__form-q-label">{q}</div>
              <div className={`hero__form-q-input ${i === 2 ? 'is-radio' : i === 3 ? 'is-textarea' : ''}`}>
                {i === 2 && (
                  <div className="hero__form-radios">
                    {[1,2,3,4,5].map(n => <span key={n} className={n <= 4 ? 'active' : ''} />)}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="hero__form-badge">
            <span className="hero__form-badge-dot" />
            Built by Formerly
          </div>
        </div>
      </div>
    </section>
  )
}
