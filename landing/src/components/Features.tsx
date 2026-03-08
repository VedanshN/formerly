import { useRef } from 'react'
import './Features.css'

const FEATURES = [
  {
    icon: '⚡',
    title: 'Seconds, not minutes',
    body: 'From prompt to fully-built form faster than you can click through the Google Forms UI twice.',
  },
  {
    icon: '🎯',
    title: 'Picks the right type',
    body: 'The model identifies Short Answer, Paragraph, Multiple Choice, Checkboxes, and Dropdown questions automatically from context.',
  },
  {
    icon: '🔐',
    title: 'Official OAuth only',
    body: 'We never see your Google credentials. Authentication goes through Google\'s own identity flow — no third-party tokens, no stored data.',
  },
  {
    icon: '🚫',
    title: 'No key needed',
    body: 'Users don\'t need to sign up, manage API keys, or configure anything. Install, sign in, go.',
  },
  {
    icon: '🛠️',
    title: 'Fully editable output',
    body: 'The form lands in your Google Drive like any other form. Edit, share, or re-theme it however you like.',
  },
  {
    icon: '🌐',
    title: 'Every question type',
    body: 'Short answer, paragraphs, multiple choice with all options generated, checkboxes, and dropdowns — all from a single prompt.',
  },
]

export default function Features() {
  const ref = useRef<HTMLElement>(null)

  return (
    <section className="features section" ref={ref}>
      <div className="container">
        <span className="label">What You Get</span>
        <h2 className="features__heading">Built for people who<br /><em>just want it done.</em></h2>
        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feature-card"
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__body">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
