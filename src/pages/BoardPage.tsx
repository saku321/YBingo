import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import BingoTicket from '../components/BingoTicket'
import Comments from '../components/Comments'
import { useFeedback } from '../components/Feedback'
import { EmptyState, Icon, PageLoader, UserChip } from '../components/ui'
import { deleteBoard, errorMessage, fetchBoard, likeBoard, likedBoardIds, unlikeBoard, updateBoard } from '../lib/api'
import { CENTER, completedLines, markedCount, normalizeCells, winningCells } from '../lib/bingo'
import { compactNumber, formatDate } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Board, Cell } from '../lib/types'

export default function BoardPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const [marking, setMarking] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<number | undefined>(undefined)
  const pendingCells = useRef<Cell[] | null>(null)

  const isOwner = Boolean(user && board && user.id === board.owner_id)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchBoard(id)
      .then((b) => active && setBoard(b))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!user || !id) {
      setLiked(false)
      return
    }
    likedBoardIds(user.id, [id])
      .then((s) => setLiked(s.has(id)))
      .catch(() => {})
  }, [user, id])

  // Live: marks and like counts change while you watch.
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`board:${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${id}` }, (payload) => {
        const row = payload.new as Board
        if (pendingCells.current) return // our own unsaved marks win
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                title: row.title,
                year: row.year,
                cells: normalizeCells(row.cells),
                colors: row.colors,
                is_public: row.is_public,
                like_count: row.like_count,
                comment_count: row.comment_count,
                updated_at: row.updated_at,
              }
            : prev,
        )
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id])

  const flushMarks = useCallback(async () => {
    const cells = pendingCells.current
    if (!cells || !id) return
    setSaveState('saving')
    try {
      await updateBoard(id, { cells })
      if (pendingCells.current === cells) pendingCells.current = null
      setSaveState('saved')
    } catch (err) {
      toast(errorMessage(err), 'error')
      setSaveState('idle')
    }
  }, [id, toast])

  useEffect(
    () => () => {
      window.clearTimeout(saveTimer.current)
      void flushMarks()
    },
    [flushMarks],
  )

  const toggle = (i: number) => {
    if (!board || i === CENTER) return
    const cells = board.cells.map((c, idx) => (idx === i ? { ...c, marked: !c.marked } : c))
    const before = completedLines(board.cells).length
    const after = completedLines(cells).length
    setBoard({ ...board, cells })
    pendingCells.current = cells
    setSaveState('saving')
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => void flushMarks(), 500)
    if (after > before) toast(after > 1 ? `BINGO ×${after}!` : 'BINGO! 🎉', 'success')
  }

  const toggleLike = async () => {
    if (!board) return
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/card/${board.id}`)}`)
      return
    }
    if (likeBusy) return
    setLikeBusy(true)
    const was = liked
    setLiked(!was)
    setBoard((b) => (b ? { ...b, like_count: Math.max(0, b.like_count + (was ? -1 : 1)) } : b))
    try {
      if (was) await unlikeBoard(board.id, user.id)
      else await likeBoard(board.id)
    } catch (err) {
      setLiked(was)
      setBoard((b) => (b ? { ...b, like_count: Math.max(0, b.like_count + (was ? 1 : -1)) } : b))
      toast(errorMessage(err), 'error')
    } finally {
      setLikeBusy(false)
    }
  }

  const share = async () => {
    if (!board) return
    const url = `${window.location.origin}/card/${board.id}`
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: board.title, text: `My ${board.year} bingo card`, url })
        return
      } catch {
        /* cancelled — fall back to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copied to clipboard', 'success')
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const remove = async () => {
    if (!board) return
    const ok = await confirm({
      title: 'Delete this card?',
      message: 'The card, its likes and all comments will be gone for good.',
      confirmLabel: 'Delete card',
      danger: true,
    })
    if (!ok) return
    try {
      pendingCells.current = null
      await deleteBoard(board.id)
      toast('Card deleted')
      navigate('/me')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  if (loading) return <PageLoader />
  if (error || !board) {
    return (
      <main className="container page">
        <EmptyState
          title={error ? 'Couldn’t load this card' : 'Card not found'}
          action={
            <Link to="/" className="btn btn--primary">
              Browse cards
            </Link>
          }
        >
          {error ?? 'It may have been deleted or made private.'}
        </EmptyState>
      </main>
    )
  }

  const lines = completedLines(board.cells).length
  const marked = markedCount(board.cells)
  const wins = winningCells(board.cells)

  return (
    <main className="container page board-page">
      <div className="board-layout">
        <div className="board-card-col">
          <BingoTicket
            cells={board.cells}
            year={board.year}
            colors={board.colors}
            size="lg"
            mode={marking ? 'mark' : 'view'}
            wins={wins}
            onToggle={toggle}
          />
          {isOwner && (
            <div className={`mark-bar ${marking ? 'is-on' : ''}`}>
              {marking ? (
                <>
                  <span>
                    <Icon name="mark" size={16} /> Tap squares that came true.{' '}
                    <em className="save-state">
                      {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
                    </em>
                  </span>
                  <button className="btn btn--primary btn--sm" onClick={() => setMarking(false)}>
                    Done
                  </button>
                </>
              ) : (
                <>
                  <span>Something on your card happened?</span>
                  <button className="btn btn--primary btn--sm" onClick={() => setMarking(true)}>
                    <Icon name="mark" size={15} /> Mark squares
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <aside className="board-side">
          <div className="board-info">
            {!board.is_public && (
              <span className="tag">
                <Icon name="lock" size={12} /> Private
              </span>
            )}
            <h1>{board.title}</h1>
            <UserChip profile={board.owner} sub={`Made ${formatDate(board.created_at)}`} />

            <div className="score">
              <div className="score-item">
                <strong>{marked}</strong>
                <span>of 24 happened</span>
              </div>
              <div className={`score-item ${lines ? 'score-item--win' : ''}`}>
                <strong>{lines}</strong>
                <span>{lines === 1 ? 'bingo' : 'bingos'}</span>
              </div>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${(marked / 24) * 100}%` }} />
            </div>

            <div className="board-actions">
              <button
                className={`btn ${liked ? 'btn--liked' : 'btn--ghost'}`}
                onClick={toggleLike}
                aria-pressed={liked}
                disabled={likeBusy}
              >
                <Icon name={liked ? 'heartFill' : 'heart'} size={17} /> {compactNumber(board.like_count)}
                <span className="sr-only">likes</span>
              </button>
              <a className="btn btn--ghost" href="#comments-title">
                <Icon name="comment" size={17} /> {compactNumber(board.comment_count)}
                <span className="sr-only">comments</span>
              </a>
              <button className="btn btn--ghost" onClick={share}>
                <Icon name="share" size={17} /> Share
              </button>
            </div>

            {isOwner && (
              <div className="owner-actions">
                <Link to={`/card/${board.id}/edit`} className="btn btn--ghost btn--sm">
                  <Icon name="edit" size={15} /> Edit squares
                </Link>
                <button className="btn btn--ghost btn--sm btn--danger-text" onClick={remove}>
                  <Icon name="trash" size={15} /> Delete
                </button>
              </div>
            )}
          </div>

          <Comments
            boardId={board.id}
            boardOwnerId={board.owner_id}
            onCountChange={(n) => setBoard((b) => (b && b.comment_count !== n ? { ...b, comment_count: n } : b))}
          />
        </aside>
      </div>
    </main>
  )
}
