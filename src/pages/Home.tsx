import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import BingoTicket from '../components/BingoTicket'
import BoardTile from '../components/BoardTile'
import Card3D from '../components/Card3D'
import { EmptyState, Icon, Spinner } from '../components/ui'
import { errorMessage, fetchFeed, likedBoardIds } from '../lib/api'
import { CENTER, SAMPLE_SQUARES, defaultYear, winningCells } from '../lib/bingo'
import type { Board, Cell, FeedSort } from '../lib/types'

const PAGE = 6

// Marking order that finishes the middle column for a satisfying BINGO.
const MARK_ORDER = [6, 2, 18, 7, 22, 13, 17, 11, 0, 24]

function HeroCard() {
  const year = defaultYear()
  const [step, setStep] = useState(4)
  const reduced = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])

  useEffect(() => {
    if (reduced) return
    const t = window.setInterval(() => setStep((s) => (s >= MARK_ORDER.length + 3 ? 0 : s + 1)), 900)
    return () => window.clearInterval(t)
  }, [reduced])

  const cells: Cell[] = SAMPLE_SQUARES.map((text, i) => ({
    text,
    marked: i === CENTER || MARK_ORDER.slice(0, Math.min(step, MARK_ORDER.length)).includes(i),
  }))
  const wins = winningCells(cells)

  return (
    <div className="hero-card">
      <Card3D>
        <BingoTicket cells={cells} year={year} size="lg" wins={wins} />
      </Card3D>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [sort, setSort] = useState<FeedSort>('new')
  const [boards, setBoards] = useState<Board[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState<Set<string>>(new Set())

  const load = useCallback(
    async (s: FeedSort, p: number) => {
      setLoading(true)
      setError(null)
      try {
        const rows = await fetchFeed(s, p, PAGE)
        setBoards((prev) => (p === 0 ? rows : [...prev, ...rows.filter((r) => !prev.some((x) => x.id === r.id))]))
        setHasMore(rows.length === PAGE)
        if (p === 0) setLiked(new Set())
        if (user && rows.length) {
          const ids = await likedBoardIds(user.id, rows.map((r) => r.id))
          setLiked((prev) => new Set([...(p === 0 ? [] : prev), ...ids]))
        }
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  useEffect(() => {
    setPage(0)
    void load(sort, 0)
  }, [sort, load])

  const year = defaultYear()

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Predictions for {year}</p>
            <h1>
              That wasn’t on my bingo card.
              <em> Now it is.</em>
            </h1>
            <p className="hero-lede">
              Fill a card with 24 predictions for {year}, share it, and cross squares off as they come true.
            </p>
            <div className="hero-actions">
              <Link
                to={user ? '/new' : '/login?mode=signup&next=%2Fnew'}
                className="btn btn--primary btn--lg"
              >
                Make your {year} card <span aria-hidden>→</span>
              </Link>
              <a href="#feed" className="btn btn--ghost btn--lg">
                Browse cards
              </a>
            </div>
          </div>
          <HeroCard />
        </div>
      </section>

      <section id="feed" className="container feed">
        <div className="feed-head">
          <h2 className="section-title">Community cards</h2>
          <div className="segmented" role="tablist" aria-label="Sort cards">
            {(
              [
                ['new', 'Newest'],
                ['top', 'Most liked'],
                ['talked', 'Most discussed'],
              ] as [FeedSort, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={sort === key}
                className={sort === key ? 'is-active' : ''}
                onClick={() => setSort(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="banner banner--error">
            Couldn’t load cards: {error}
            <button className="btn btn--ghost btn--sm" onClick={() => load(sort, 0)}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && boards.length === 0 ? (
          <EmptyState
            title="No cards yet"
            action={
              <Link to="/new" className="btn btn--primary">
                <Icon name="plus" size={16} /> Be the first
              </Link>
            }
          >
            Nobody has shared a card yet. Yours could be the one everyone argues about.
          </EmptyState>
        ) : (
          <div className="tile-grid">
            {boards.map((b) => (
              <BoardTile key={b.id} board={b} liked={liked.has(b.id)} />
            ))}
            {loading &&
              Array.from({ length: boards.length ? 3 : 6 }).map((_, i) => (
                <div key={`s${i}`} className="tile tile--skeleton" aria-hidden />
              ))}
          </div>
        )}

        {hasMore && !loading && boards.length > 0 && (
          <div className="load-more">
            <button
              className="btn btn--ghost"
              onClick={() => {
                const p = page + 1
                setPage(p)
                void load(sort, p)
              }}
            >
              Load more
            </button>
          </div>
        )}
        {loading && boards.length > 0 && (
          <div className="load-more">
            <Spinner />
          </div>
        )}
      </section>
    </main>
  )
}
