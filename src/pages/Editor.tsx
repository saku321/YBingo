import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import BingoTicket from '../components/BingoTicket'
import { useFeedback } from '../components/Feedback'
import { usePopularIdeas } from '../components/IdeaMarquee'
import { EmptyState, Icon, PageLoader, Spinner } from '../components/ui'
import { createBoard, errorMessage, fetchBoard, updateBoard } from '../lib/api'
import {
  CENTER,
  COLOR_PRESETS,
  DEFAULT_COLORS,
  MAX_CELL_CHARS,
  MIN_CELL_CHARS,
  defaultYear,
  emptyCells,
  filledCount,
  invalidCells,
  shuffleCells,
} from '../lib/bingo'
import type { CardColors, Cell } from '../lib/types'

const COLOR_FIELDS: [keyof CardColors, string][] = [
  ['background', 'Card'],
  ['text', 'Text'],
  ['lines', 'Lines'],
  ['marker', 'X mark'],
  ['centerFrom', 'Free space A'],
  ['centerTo', 'Free space B'],
]

export default function Editor() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [params] = useSearchParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const ideas = usePopularIdeas(30)

  const thisYear = new Date().getFullYear()
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(defaultYear())
  const [cells, setCells] = useState<Cell[]>(() => {
    const c = emptyCells()
    const idea = params.get('idea')?.slice(0, MAX_CELL_CHARS)
    if (idea) c[0] = { text: idea, marked: false }
    return c
  })
  const [colors, setColors] = useState<CardColors | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [invalid, setInvalid] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(Boolean(params.get('idea')))
  const savedRef = useRef(false)

  const premium = Boolean(profile?.is_premium)

  useEffect(() => {
    if (!id || !user) return
    let active = true
    fetchBoard(id)
      .then((b) => {
        if (!active) return
        if (!b || b.owner_id !== user.id) {
          setNotFound(true)
          return
        }
        setTitle(b.title)
        setYear(b.year)
        setCells(b.cells)
        setColors(b.colors)
        setIsPublic(b.is_public)
      })
      .catch((e) => toast(errorMessage(e), 'error'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, user, toast])

  // Warn before leaving with unsaved work (in-app navigation + tab close).
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return dirty && !savedRef.current && currentLocation.pathname !== nextLocation.pathname
  })
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    void confirm({
      title: 'Leave without saving?',
      message: 'Your changes to this card will be lost.',
      confirmLabel: 'Leave',
      danger: true,
    }).then((ok) => (ok ? blocker.proceed() : blocker.reset()))
  }, [blocker, confirm])
  useEffect(() => {
    if (!dirty) return
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  const touch = () => setDirty(true)

  const editCell = (i: number, text: string) => {
    setCells((prev) => prev.map((c, idx) => (idx === i ? { ...c, text } : c)))
    if (invalid.has(i)) {
      setInvalid((prev) => {
        const n = new Set(prev)
        n.delete(i)
        return n
      })
    }
    touch()
  }

  const usedIdeas = useMemo(() => new Set(cells.map((c) => c.text.trim().toLowerCase())), [cells])
  const filled = filledCount(cells)

  const addIdea = (idea: string) => {
    const slot = cells.findIndex((c, i) => i !== CENTER && !c.text.trim())
    if (slot === -1) {
      toast('Your card is full — clear a square first.', 'error')
      return
    }
    editCell(slot, idea.slice(0, MAX_CELL_CHARS))
  }

  const setColor = (key: keyof CardColors, value: string) => {
    setColors((prev) => ({ ...(prev ?? DEFAULT_COLORS), [key]: value }))
    touch()
  }

  const save = async () => {
    if (!user) return
    const bad = invalidCells(cells)
    if (bad.length) {
      setInvalid(new Set(bad))
      toast(
        `${bad.length} square${bad.length > 1 ? 's need' : ' needs'} text (${MIN_CELL_CHARS}–${MAX_CELL_CHARS} characters).`,
        'error',
      )
      return
    }
    setSaving(true)
    const input = {
      title: title.trim() || `My ${year} bingo`,
      year,
      cells: cells.map((c, i) => ({ text: c.text.trim(), marked: i === CENTER ? true : c.marked })),
      colors: premium ? colors : null,
      is_public: isPublic,
    }
    try {
      const boardId = id ? (await updateBoard(id, input), id) : await createBoard(input)
      savedRef.current = true
      setDirty(false)
      toast(isEdit ? 'Card updated' : 'Card saved — share it!', 'success')
      navigate(`/card/${boardId}`)
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (notFound) {
    return (
      <main className="container page">
        <EmptyState title="Card not found" action={<Link className="btn btn--primary" to="/me">Your cards</Link>}>
          It may have been deleted, or it belongs to someone else.
        </EmptyState>
      </main>
    )
  }

  return (
    <main className="container page editor">
      <div className="page-head">
        <div>
          <p className="eyebrow">{isEdit ? 'Editing card' : 'New card'}</p>
          <input
            className="title-input"
            value={title}
            maxLength={80}
            placeholder={`My ${year} bingo`}
            aria-label="Card title"
            onChange={(e) => {
              setTitle(e.target.value)
              touch()
            }}
          />
        </div>
        <div className="page-head-actions">
          <Link to={isEdit ? `/card/${id}` : '/'} className="btn btn--ghost">
            Cancel
          </Link>
          <button className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <Icon name="check" size={16} />} {isEdit ? 'Save changes' : 'Save card'}
          </button>
        </div>
      </div>

      <div className="editor-grid">
        <div className="editor-main">
          <BingoTicket
            cells={cells}
            year={year}
            colors={premium ? colors : null}
            size="lg"
            mode="edit"
            invalid={invalid}
            onEdit={editCell}
          />
          <div className="editor-toolbar">
            <div className="progress" aria-label={`${filled} of 24 squares filled`}>
              <div className="progress-bar">
                <span style={{ width: `${(filled / 24) * 100}%` }} />
              </div>
              <span>
                <strong>{filled}</strong>/24 filled
              </span>
            </div>
            <div className="toolbar-btns">
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setCells(shuffleCells(cells))
                  touch()
                }}
              >
                <Icon name="shuffle" size={15} /> Shuffle
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={async () => {
                  if (
                    await confirm({
                      title: 'Clear all squares?',
                      message: 'Every square will be emptied.',
                      confirmLabel: 'Clear',
                      danger: true,
                    })
                  ) {
                    setCells(emptyCells())
                    setInvalid(new Set())
                    touch()
                  }
                }}
              >
                <Icon name="trash" size={15} /> Clear
              </button>
            </div>
          </div>
          <p className="hint">
            Click a square to type. The middle square is the free space — label it whatever you like.
          </p>
        </div>

        <aside className="editor-side">
          <section className="panel">
            <h3>Details</h3>
            <div className="field">
              <span>Year</span>
              <div className="segmented segmented--full">
                {[...new Set([thisYear, thisYear + 1, year])].sort().map((y) => (
                  <button
                    key={y}
                    className={year === y ? 'is-active' : ''}
                    aria-pressed={year === y}
                    onClick={() => {
                      setYear(y)
                      touch()
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <button
              className={`toggle-row ${isPublic ? 'is-on' : ''}`}
              role="switch"
              aria-checked={isPublic}
              onClick={() => {
                setIsPublic((p) => !p)
                touch()
              }}
            >
              <span className="toggle-copy">
                <strong>{isPublic ? 'Public' : 'Private'}</strong>
                <small>{isPublic ? 'Shown in the feed, anyone with the link can view' : 'Only you can see it'}</small>
              </span>
              <span className="switch" aria-hidden />
            </button>
          </section>

          <section className="panel">
            <h3>Need ideas?</h3>
            <p className="panel-sub">Tap one to drop it in the next empty square.</p>
            <div className="idea-cloud">
              {ideas
                .filter((i) => !usedIdeas.has(i.toLowerCase()))
                .slice(0, 18)
                .map((idea) => (
                  <button key={idea} className="idea-chip idea-chip--sm" onClick={() => addIdea(idea)}>
                    <Icon name="plus" size={12} /> {idea}
                  </button>
                ))}
            </div>
          </section>

          <section className={`panel ${premium ? '' : 'panel--locked'}`}>
            <h3>
              Style {!premium && <span className="tag tag--gold"><Icon name="crown" size={11} /> Premium</span>}
            </h3>
            <div className="presets">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  className={`preset ${JSON.stringify(colors) === JSON.stringify(p.colors) ? 'is-active' : ''}`}
                  disabled={!premium}
                  onClick={() => {
                    setColors(p.colors)
                    touch()
                  }}
                  title={p.colors ? p.name : 'Auto — follows light/dark theme'}
                >
                  <span
                    className={`preset-swatch ${p.colors ? '' : 'preset-swatch--auto'}`}
                    style={
                      p.colors
                        ? {
                            background: `linear-gradient(135deg, ${p.colors.centerFrom}, ${p.colors.centerTo})`,
                            boxShadow: `inset 0 0 0 5px ${p.colors.background}`,
                          }
                        : undefined
                    }
                  />
                  {p.name}
                </button>
              ))}
            </div>
            <div className="color-grid">
              {COLOR_FIELDS.map(([key, label]) => (
                <label key={key} className="color-field">
                  <input
                    type="color"
                    disabled={!premium}
                    value={(colors ?? DEFAULT_COLORS)[key]}
                    onChange={(e) => setColor(key, e.target.value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {!premium && (
              <Link to="/premium" className="btn btn--gold btn--block">
                <Icon name="crown" size={16} /> Unlock custom colors
              </Link>
            )}
          </section>
        </aside>
      </div>
    </main>
  )
}
