import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { CENTER, DEFAULT_COLORS, MAX_CELL_CHARS, MAX_CENTER_CHARS, lengthClass } from '../lib/bingo'
import type { CardColors, Cell } from '../lib/types'

type Mode = 'view' | 'mark' | 'edit'

type Props = {
  cells: Cell[]
  year: number
  colors?: CardColors | null
  size?: 'sm' | 'md' | 'lg'
  mode?: Mode
  /** Cells that are part of a completed line. */
  wins?: Set<number>
  /** Cells to flag as invalid in edit mode. */
  invalid?: Set<number>
  onToggle?: (index: number) => void
  onEdit?: (index: number, text: string) => void
  className?: string
}

const LETTERS = ['B', 'I', 'N', 'G', 'O']

/** Dark or light text, whichever reads better on the free-space color. */
function inkFor(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) return '#ffffff'
  const n = parseInt(m[1], 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#16151a' : '#ffffff'
}

export function colorVars(colors?: CardColors | null): CSSProperties {
  // No custom colors: the card follows the site's light/dark theme (see .ticket in CSS).
  if (!colors) return {}
  const c = { ...DEFAULT_COLORS, ...colors }
  return {
    '--card-bg': c.background,
    '--card-ink': c.text,
    '--card-line': c.lines,
    '--center-a': c.centerFrom,
    '--center-b': c.centerTo,
    '--center-ink': inkFor(c.centerFrom),
    '--marker': c.marker,
  } as CSSProperties
}

/** Small deterministic tilt so every X looks hand-drawn. */
function tilt(i: number): string {
  return `${((i * 47) % 9) - 4}deg`
}

/** The X that crosses off a square. Strokes draw themselves in (see .cell-x in CSS). */
function CrossMark() {
  return (
    <svg className="cell-x" viewBox="0 0 100 100" aria-hidden>
      <path d="M20 20 80 80" pathLength={1} />
      <path d="M80 20 20 80" pathLength={1} />
    </svg>
  )
}

export default function BingoTicket({
  cells,
  year,
  colors,
  size = 'md',
  mode = 'view',
  wins,
  invalid,
  onToggle,
  onEdit,
  className = '',
}: Props) {
  const center = cells[CENTER]?.text.trim() || String(year)

  return (
    <div className={`ticket ticket--${size} ticket--${mode} ${className}`} style={colorVars(colors)}>
      <div className="ticket-face">
      <div className="ticket-head" aria-hidden>
        {LETTERS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <div className="ticket-grid" role={mode === 'mark' ? 'group' : undefined} aria-label="Bingo card">
        {cells.map((cell, i) => {
          const isCenter = i === CENTER
          const classes = [
            'cell',
            isCenter ? 'cell--free' : '',
            !isCenter && cell.marked ? 'cell--marked' : '',
            wins?.has(i) ? 'cell--win' : '',
            invalid?.has(i) ? 'cell--invalid' : '',
            lengthClass(isCenter ? center : cell.text),
          ]
            .filter(Boolean)
            .join(' ')
          const style = { '--tilt': tilt(i) } as CSSProperties

          if (mode === 'edit' && onEdit) {
            return (
              <label key={i} className={classes} style={style}>
                <AutoTextarea
                  value={cell.text}
                  maxLength={isCenter ? MAX_CENTER_CHARS : MAX_CELL_CHARS}
                  placeholder={isCenter ? String(year) : ''}
                  aria-label={isCenter ? 'Free space label' : `Square ${Math.floor(i / 5) + 1}-${(i % 5) + 1}`}
                  onChange={(v) => onEdit(i, v)}
                />
              </label>
            )
          }

          if (mode === 'mark' && onToggle && !isCenter) {
            // Unmarked squares carry a hidden X too, so hovering can preview it.
            return (
              <button
                key={i}
                type="button"
                className={classes}
                style={style}
                aria-pressed={cell.marked}
                title={cell.marked ? 'Happened — click to undo' : 'Mark as happened'}
                onClick={() => onToggle(i)}
              >
                <span className="cell-text">{cell.text}</span>
                <CrossMark />
              </button>
            )
          }

          return (
            <div key={i} className={classes} style={style}>
              <span className="cell-text">{isCenter ? center : cell.text}</span>
              {!isCenter && cell.marked && (
                <>
                  <CrossMark />
                  <span className="sr-only"> (happened)</span>
                </>
              )}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}

function AutoTextarea({
  value,
  onChange,
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  maxLength: number
  placeholder: string
  'aria-label': string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  })
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      spellCheck
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault()
      }}
      {...rest}
    />
  )
}
