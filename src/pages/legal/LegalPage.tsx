import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LEGAL } from '../../lib/legal'

const DOCS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/cookies', label: 'Cookies' },
]

/** Shared frame for the legal pages: switcher, title, date and a short summary box. */
export default function LegalPage({
  title,
  summary,
  children,
}: {
  title: string
  summary: ReactNode
  children: ReactNode
}) {
  return (
    <main className="container page legal">
      <nav className="legal-nav" aria-label="Legal">
        {DOCS.map((d) => (
          <NavLink key={d.to} to={d.to}>
            {d.label}
          </NavLink>
        ))}
      </nav>
      <article className="legal-doc">
        <p className="eyebrow">Legal</p>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated {LEGAL.lastUpdated}</p>
        <div className="legal-summary">
          <strong>The short version</strong>
          {summary}
        </div>
        {children}
      </article>
    </main>
  )
}

/** A link that leaves the site, opened in a new tab. */
export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

export function Mail() {
  return <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
}
