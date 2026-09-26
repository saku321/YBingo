import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import BoardTile from '../components/BoardTile'
import { useFeedback } from '../components/Feedback'
import { EmptyState, Icon, PageLoader } from '../components/ui'
import { deleteBoard, errorMessage, fetchBoardsByOwner } from '../lib/api'
import { FREE_BOARD_LIMIT } from '../lib/bingo'
import type { Board } from '../lib/types'

export default function MyCards() {
  const { user, profile } = useAuth()
  const { toast, confirm } = useFeedback()
  const [boards, setBoards] = useState<Board[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchBoardsByOwner(user.id)
      .then(setBoards)
      .catch((e) => setError(errorMessage(e)))
  }, [user])

  const share = async (b: Board) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/card/${b.id}`)
      toast('Link copied', 'success')
    } catch {
      toast('Couldn’t copy the link', 'error')
    }
  }

  const remove = async (b: Board) => {
    const ok = await confirm({
      title: `Delete “${b.title}”?`,
      message: 'The card, its likes and all comments will be gone for good.',
      confirmLabel: 'Delete card',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteBoard(b.id)
      setBoards((prev) => prev?.filter((x) => x.id !== b.id) ?? null)
      toast('Card deleted')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  if (error) {
    return (
      <main className="container page">
        <div className="banner banner--error">{error}</div>
      </main>
    )
  }
  if (!boards) return <PageLoader />

  const atLimit = !profile?.is_premium && boards.length >= FREE_BOARD_LIMIT

  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Your collection</p>
          <h1>My cards</h1>
          <p className="muted">
            {profile?.is_premium
              ? `${boards.length} card${boards.length === 1 ? '' : 's'} · Premium, no limits`
              : `${boards.length} of ${FREE_BOARD_LIMIT} free cards used`}
          </p>
        </div>
        <div className="page-head-actions">
          {atLimit ? (
            <Link to="/premium" className="btn btn--gold">
              <Icon name="crown" size={16} /> Go Premium for more
            </Link>
          ) : (
            <Link to="/new" className="btn btn--primary">
              <Icon name="plus" size={16} /> New card
            </Link>
          )}
        </div>
      </div>

      {boards.length === 0 ? (
        <EmptyState
          title="No cards yet"
          action={
            <Link to="/new" className="btn btn--primary">
              <Icon name="plus" size={16} /> Make your first card
            </Link>
          }
        >
          Write down 24 things you think will happen. Future you will want receipts.
        </EmptyState>
      ) : (
        <div className="tile-grid">
          {boards.map((b) => (
            <BoardTile
              key={b.id}
              board={b}
              showOwner={false}
              actions={
                <>
                  <Link to={`/card/${b.id}/edit`} className="btn btn--ghost btn--xs">
                    <Icon name="edit" size={14} /> Edit
                  </Link>
                  <button className="btn btn--ghost btn--xs" onClick={() => share(b)}>
                    <Icon name="share" size={14} /> Share
                  </button>
                  <button className="btn btn--ghost btn--xs btn--danger-text" onClick={() => remove(b)}>
                    <Icon name="trash" size={14} /> Delete
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </main>
  )
}
