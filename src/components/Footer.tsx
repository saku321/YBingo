import { Link } from 'react-router-dom'
import { Logo } from './Header'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div className="footer-brand">
          <Logo />
          <p>Write down what you think the year will bring. Cross squares off as it happens.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/">Explore cards</Link>
          <Link to="/new">Create a card</Link>
          <Link to="/premium">Premium</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </div>
      <div className="container footer-base">
        <span>© {new Date().getFullYear()} YearlyBingos</span>
        <nav className="footer-legal" aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  )
}
