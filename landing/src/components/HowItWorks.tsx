import { useEffect, useRef } from 'react'
import './HowItWorks.css'

const STEPS = [
  {
    num: '01',
    title: 'Click & Sign In',
    body: 'Open the extension from your Chrome toolbar. Sign in once with Google — we only ask for permission to manage your Forms.',
    detail: 'chrome.identity.getAuthToken()',
  },
  {
    num: '02',
    title: 'Describe Your Form',
    body: 'Type a plain-English prompt into the popup. Be as specific or vague as you want — the AI infers structure, question types, and answer options.',
    detail: 'gpt-4o-mini · JSON schema',
  },
  {
    num: '03',
    title: 'Form Appears in Drive',
    body: 'Formerly calls the official Google Forms API with your OAuth token. A new tab opens directly to the finished, editable form.',
    detail: 'forms.googleapis.com/v1/forms',
  },
]

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('is-visible') },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    )
    obs.observe(el)
    // Trigger immediately if already in viewport
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add('is-visible')
    }
    return () => obs.disconnect()
  }, [ref])
}

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)

  return (
    <section className="hiw section" ref={ref}>
      <div className="container">
        <div className="hiw__header">
          <span className="label">Process</span>
          <h2 className="hiw__heading">Three steps.<br /><em>Ten seconds.</em></h2>
        </div>

        <div className="hiw__steps">
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className="hiw__step"
              style={{ '--delay': `${i * 0.12}s` } as React.CSSProperties}
            >
              <div className="hiw__step-num">{s.num}</div>
              <div className="hiw__step-content">
                <h3 className="hiw__step-title">{s.title}</h3>
                <p className="hiw__step-body">{s.body}</p>
                <code className="hiw__step-detail">{s.detail}</code>
              </div>
              {i < STEPS.length - 1 && <div className="hiw__connector" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
