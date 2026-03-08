import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__left">
          <div className="footer__logo">
            <span className="footer__logo-mark">F</span>ormerly
          </div>
          <p className="footer__tagline">
            Forms, automated.<br />
            <span className="footer__tagline-sub">Built for humans. Powered by AI. Delivered to Drive.</span>
          </p>
        </div>

        <nav className="footer__links" aria-label="Footer navigation">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="mailto:hello@formerly.app">Contact</a>
          <a href="https://github.com/VedanshN/formerly" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>

      <div className="container footer__bottom">
        <span className="footer__copy">© {new Date().getFullYear()} Formerly. All rights reserved.</span>
        <span className="footer__mono">v1.0.0</span>
      </div>
    </footer>
  )
}
