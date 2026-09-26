import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <main className="container page">
      <EmptyState
        title="That square isn’t on the card"
        action={
          <Link to="/" className="btn btn--primary">
            Back home
          </Link>
        }
      >
        The page you’re looking for doesn’t exist.
      </EmptyState>
    </main>
  )
}
