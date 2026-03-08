import './UseCases.css'

const CASES = [
  {
    role: 'Teacher',
    prompt: '"Quiz on Chapter 4 of To Kill a Mockingbird — 5 multiple-choice questions, 2 paragraph answers"',
    result: '7 questions, auto-graded quiz format',
  },
  {
    role: 'HR Manager',
    prompt: '"Quarterly employee satisfaction survey with 1–5 scale ratings on work-life balance, management, and growth"',
    result: '8 scale questions + open comment field',
  },
  {
    role: 'Event Organiser',
    prompt: '"RSVP for the company holiday party — attendance, meal preference, and plus-one info"',
    result: 'Multi-section RSVP form, ready to share',
  },
  {
    role: 'Developer',
    prompt: '"Bug report form for our iOS app — severity dropdown, reproduction steps paragraph, iOS version short answer"',
    result: 'Structured bug report, 4 question types used',
  },
]

export default function UseCases() {
  return (
    <section className="usecases section">
      <div className="container">
        <span className="label">Who Uses It</span>
        <h2 className="usecases__heading">One tool.<br /><em>Every occasion.</em></h2>

        <div className="usecases__grid">
          {CASES.map(c => (
            <div className="usecase-card" key={c.role}>
              <div className="usecase-card__role">{c.role}</div>
              <blockquote className="usecase-card__prompt">{c.prompt}</blockquote>
              <div className="usecase-card__result">
                <span className="usecase-card__check">✓</span>
                {c.result}
              </div>
            </div>
          ))}
        </div>

        {/* CTA block */}
        <div className="usecases__cta">
          <p className="usecases__cta-text">
            Whatever your form, Formerly builds it in the time it takes<br />to type one sentence.
          </p>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="usecases__cta-btn"
          >
            Add to Chrome — it's free <span>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
