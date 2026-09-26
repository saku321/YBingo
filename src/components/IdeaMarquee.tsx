import { useEffect, useState, type CSSProperties } from 'react'
import { fetchPopularIdeas } from '../lib/api'
import { FALLBACK_IDEAS } from '../lib/bingo'

/** Popular squares from public cards, topped up with a starter list. */
export function usePopularIdeas(limit = 24): string[] {
  const [ideas, setIdeas] = useState<string[]>(FALLBACK_IDEAS)
  useEffect(() => {
    let active = true
    fetchPopularIdeas(limit)
      .then((popular) => {
        if (!active || popular.length === 0) return
        const seen = new Set(popular.map((p) => p.toLowerCase()))
        const merged = [...popular, ...FALLBACK_IDEAS.filter((f) => !seen.has(f.toLowerCase()))]
        setIdeas(merged.slice(0, Math.max(limit, 24)))
      })
      .catch(() => {
        /* offline or not set up yet: keep the starter list */
      })
    return () => {
      active = false
    }
  }, [limit])
  return ideas
}

const DOTS = ['var(--blue)', 'var(--red)', 'var(--yellow)', 'var(--green)', 'var(--orange)']

export default function IdeaMarquee({ onPick }: { onPick: (idea: string) => void }) {
  const ideas = usePopularIdeas()

  return (
    <section className="marquee" aria-label="Popular squares">
      <span className="marquee-label">Popular squares</span>
      <div className="marquee-row">
        <div className="marquee-track">
          {[...ideas, ...ideas].map((idea, i) => (
            <button
              key={`${idea}-${i}`}
              className="idea-chip"
              onClick={() => onPick(idea)}
              tabIndex={i >= ideas.length ? -1 : 0}
              aria-hidden={i >= ideas.length}
            >
              <span className="idea-dot" style={{ '--dot': DOTS[i % DOTS.length] } as CSSProperties} aria-hidden />
              {idea}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
