import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { addComment, deleteComment, editComment, errorMessage, fetchComment, fetchComments } from '../lib/api'
import { supabase } from '../lib/supabase'
import { displayName, timeAgo } from '../lib/format'
import type { Comment } from '../lib/types'
import { useFeedback } from './Feedback'
import { Avatar, Icon, Spinner } from './ui'

const MAX = 500

export default function Comments({
  boardId,
  boardOwnerId,
  onCountChange,
}: {
  boardId: string
  boardOwnerId: string
  onCountChange?: (count: number) => void
}) {
  const { user, profile } = useAuth()
  const { toast, confirm } = useFeedback()
  const location = useLocation()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')
  const listEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchComments(boardId)
      .then((c) => active && setComments(c))
      .catch((e) => active && setLoadError(errorMessage(e)))
      .finally(() => active && setLoading(false))

    // Live updates: new comments from other people show up without a refresh.
    const channel = supabase
      .channel(`comments:${boardId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `board_id=eq.${boardId}` },
        async (payload) => {
          const id = (payload.new as { id: number }).id
          const full = await fetchComment(id).catch(() => null)
          if (full) setComments((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, full]))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: `board_id=eq.${boardId}` },
        (payload) => {
          const next = payload.new as Comment
          setComments((prev) => prev.map((c) => (c.id === next.id ? { ...c, body: next.body, updated_at: next.updated_at } : c)))
        },
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (payload) => {
        const id = (payload.old as { id?: number }).id
        if (id != null) setComments((prev) => prev.filter((c) => c.id !== id))
      })
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [boardId])

  const countRef = useRef(onCountChange)
  countRef.current = onCountChange
  useEffect(() => {
    if (!loading) countRef.current?.(comments.length)
  }, [comments.length, loading])

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const created = await addComment(boardId, text)
      setComments((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]))
      setBody('')
      requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setSending(false)
    }
  }

  const saveEdit = async (id: number) => {
    const text = editBody.trim()
    if (!text) return
    try {
      const updated = await editComment(id, text)
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)))
      setEditingId(null)
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  const remove = async (c: Comment) => {
    const ok = await confirm({
      title: 'Delete this comment?',
      message: 'This can’t be undone.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteComment(c.id)
      setComments((prev) => prev.filter((x) => x.id !== c.id))
      toast('Comment deleted')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title" className="section-title">
        Comments <span className="count-pill">{comments.length}</span>
      </h2>

      {user ? (
        <form className="composer" onSubmit={submit}>
          <Avatar profile={profile} size={36} />
          <div className="composer-box">
            <textarea
              value={body}
              maxLength={MAX}
              rows={3}
              placeholder="What do you think will hit first?"
              aria-label="Write a comment"
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void submit()
              }}
            />
            <div className="composer-foot">
              <span className={body.length > MAX - 50 ? 'char-count char-count--warn' : 'char-count'}>
                {body.length}/{MAX}
              </span>
              <button className="btn btn--primary btn--sm" disabled={!body.trim() || sending}>
                {sending ? <Spinner label="Posting" /> : <Icon name="send" size={15} />} Post
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="composer-locked">
          <p>Sign in to join the conversation.</p>
          <Link
            to={`/login?next=${encodeURIComponent(location.pathname)}`}
            className="btn btn--primary btn--sm"
          >
            Sign in to comment
          </Link>
        </div>
      )}

      {loading ? (
        <div className="comments-loading">
          <Spinner />
        </div>
      ) : loadError ? (
        <p className="form-error">{loadError}</p>
      ) : comments.length === 0 ? (
        <p className="comments-empty">No comments yet. Call your shot first.</p>
      ) : (
        <ol className="comment-list">
          {comments.map((c) => {
            const mine = user?.id === c.author_id
            const canDelete = mine || user?.id === boardOwnerId
            const edited = new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 2000
            return (
              <li key={c.id} className="comment">
                <Avatar profile={c.author} size={36} />
                <div className="comment-main">
                  <div className="comment-head">
                    {c.author ? (
                      <Link to={`/u/${c.author.username}`} className="comment-author">
                        {displayName(c.author)}
                      </Link>
                    ) : (
                      <span className="comment-author">Someone</span>
                    )}
                    {c.author_id === boardOwnerId && <span className="tag">Creator</span>}
                    <time dateTime={c.created_at} title={new Date(c.created_at).toLocaleString()}>
                      {timeAgo(c.created_at)}
                      {edited && ' · edited'}
                    </time>
                  </div>
                  {editingId === c.id ? (
                    <div className="comment-edit">
                      <textarea
                        value={editBody}
                        maxLength={MAX}
                        rows={3}
                        autoFocus
                        aria-label="Edit comment"
                        onChange={(e) => setEditBody(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingId(null)
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void saveEdit(c.id)
                        }}
                      />
                      <div className="comment-edit-actions">
                        <button className="btn btn--ghost btn--sm" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                        <button
                          className="btn btn--primary btn--sm"
                          disabled={!editBody.trim()}
                          onClick={() => saveEdit(c.id)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-body">{c.body}</p>
                  )}
                  {(mine || canDelete) && editingId !== c.id && (
                    <div className="comment-actions">
                      {mine && (
                        <button
                          onClick={() => {
                            setEditingId(c.id)
                            setEditBody(c.body)
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && <button onClick={() => remove(c)}>Delete</button>}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <div ref={listEndRef} />
    </section>
  )
}
