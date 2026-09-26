import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { safeNext } from '../lib/format'
import { Spinner } from '../components/ui'

/**
 * Landing page for OAuth (Google / X) and email-confirmation redirects.
 * supabase-js exchanges the ?code=… for a session on startup; we wait for
 * that, then continue to where the user was going.
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const next = safeNext(query.get('next'))
    const providerError = query.get('error_description') ?? hash.get('error_description')
    if (providerError) {
      setProblem(providerError.replace(/\+/g, ' '))
      return
    }

    let done = false
    const finish = () => {
      if (done) return
      done = true
      navigate(next, { replace: true })
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish()
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish()
      else if (query.get('code')) {
        // The code was valid but this browser didn't start the flow (e.g. the
        // confirmation email was opened on another device). The email is
        // confirmed server-side, so signing in normally works.
        setProblem('Your email is confirmed, but this browser needs you to sign in once more.')
      } else {
        setProblem('That sign-in link is missing or has expired.')
      }
    })

    return () => data.subscription.unsubscribe()
  }, [navigate])

  return (
    <main className="auth-page">
      <div className="auth-card auth-card--center">
        {problem ? (
          <>
            <h1>Almost there</h1>
            <p>{problem}</p>
            <Link to="/login" className="btn btn--primary">
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <Spinner />
            <p>Signing you in…</p>
          </>
        )}
      </div>
    </main>
  )
}
