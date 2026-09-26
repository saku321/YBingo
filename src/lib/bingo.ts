import type { CardColors, Cell } from './types'

export const SIZE = 5
export const CELL_COUNT = SIZE * SIZE
export const CENTER = 12
export const MAX_CELL_CHARS = 60
export const MIN_CELL_CHARS = 2
export const MAX_CENTER_CHARS = 14
export const FREE_BOARD_LIMIT = 10
/** Premium price in USD. The PayPal edge function has its own copy — keep them in sync. */
export const PREMIUM_PRICE = '3.49'

/** Cards made from September onward default to next year. */
export function defaultYear(now = new Date()): number {
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
}

export function emptyCells(): Cell[] {
  return Array.from({ length: CELL_COUNT }, (_, i) => ({ text: '', marked: i === CENTER }))
}

/** Accepts anything from the database and returns exactly 25 well-formed cells. */
export function normalizeCells(raw: unknown): Cell[] {
  const list = Array.isArray(raw) ? raw : []
  return Array.from({ length: CELL_COUNT }, (_, i) => {
    const c = list[i] as Partial<Cell> | undefined
    return {
      text: typeof c?.text === 'string' ? c.text : '',
      marked: i === CENTER ? true : Boolean(c?.marked),
    }
  })
}

export const LINES: number[][] = (() => {
  const lines: number[][] = []
  for (let r = 0; r < SIZE; r++) lines.push(Array.from({ length: SIZE }, (_, c) => r * SIZE + c))
  for (let c = 0; c < SIZE; c++) lines.push(Array.from({ length: SIZE }, (_, r) => r * SIZE + c))
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + i))
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)))
  return lines
})()

export function completedLines(cells: Cell[]): number[][] {
  return LINES.filter((line) => line.every((i) => i === CENTER || cells[i]?.marked))
}

export function winningCells(cells: Cell[]): Set<number> {
  return new Set(completedLines(cells).flat())
}

export function markedCount(cells: Cell[]): number {
  return cells.reduce((n, c, i) => (i !== CENTER && c.marked ? n + 1 : n), 0)
}

export function filledCount(cells: Cell[]): number {
  return cells.reduce((n, c, i) => (i !== CENTER && c.text.trim().length > 0 ? n + 1 : n), 0)
}

export function invalidCells(cells: Cell[]): number[] {
  const bad: number[] = []
  cells.forEach((c, i) => {
    if (i === CENTER) return
    const len = c.text.trim().length
    if (len < MIN_CELL_CHARS || len > MAX_CELL_CHARS) bad.push(i)
  })
  return bad
}

export function shuffleCells(cells: Cell[]): Cell[] {
  const others = cells.filter((_, i) => i !== CENTER)
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[others[i], others[j]] = [others[j], others[i]]
  }
  others.splice(CENTER, 0, cells[CENTER])
  return others
}

/** Font-size step for a square: long text or long single words get smaller type. */
export function lengthClass(text: string): string {
  const t = text.trim()
  const n = t.length
  const longest = t.split(/\s+/).reduce((m, w) => Math.max(m, w.length), 0)
  const byLength = n > 44 ? 3 : n > 30 ? 2 : n > 16 ? 1 : 0
  const byWord = longest >= 12 ? 3 : longest >= 10 ? 2 : longest >= 8 ? 1 : 0
  return ['', 'len-m', 'len-l', 'len-xl'][Math.max(byLength, byWord)]
}

/** Starting values for the premium color pickers (the classic white card). */
export const DEFAULT_COLORS: CardColors = {
  background: '#ffffff',
  text: '#1a1d26',
  lines: '#dde2ea',
  centerFrom: '#3a82f7',
  centerTo: '#f73340',
  marker: '#f73340',
}

/** `null` colors = follow the viewer's light/dark theme. */
export const COLOR_PRESETS: { name: string; colors: CardColors | null }[] = [
  { name: 'Auto', colors: null },
  { name: 'Classic', colors: DEFAULT_COLORS },
  {
    name: 'Night',
    colors: {
      background: '#171a22',
      text: '#eef0f4',
      lines: '#2c313d',
      centerFrom: '#3a82f7',
      centerTo: '#f73340',
      marker: '#ff4d5a',
    },
  },
  {
    name: 'Paper',
    colors: {
      background: '#f6f1e6',
      text: '#1b1a1f',
      lines: '#ddd4c2',
      centerFrom: '#1b1a1f',
      centerTo: '#3a3844',
      marker: '#e0245e',
    },
  },
  {
    name: 'Ocean',
    colors: {
      background: '#0f1a2c',
      text: '#e6eefc',
      lines: '#223452',
      centerFrom: '#22d3ee',
      centerTo: '#3a82f7',
      marker: '#22d3ee',
    },
  },
  {
    name: 'Sunset',
    colors: {
      background: '#fff3ea',
      text: '#3b1420',
      lines: '#f1d2c0',
      centerFrom: '#ff8a3d',
      centerTo: '#e0245e',
      marker: '#e0245e',
    },
  },
]

/** Predictions for demo cards (home hero, premium showcase). Index 12 is the free space. */
export const SAMPLE_SQUARES = [
  'BTC new ATH', 'I run 10k', 'GTA VI ships', 'AI pop hit', 'Learn to cook',
  'Solo trip', 'ETH > $10k', 'New console', 'Read 20 books', 'Heatwave record',
  'Ship side project', 'Moon landing', '', 'Meme coin mania', 'Quit doom-scroll',
  'Foldable iPhone', 'Friend trip happens', 'Start a podcast', 'Robotaxi in town', 'Save €5k',
  'NFTs come back', 'Learn a language', 'Wedding season', 'Adopt a pet', 'Aliens (again)',
]

export const FALLBACK_IDEAS = [
  'BTC hits a new all-time high',
  'ETH above $10k',
  'SOL flips $500',
  'A meme coin tops the charts',
  'GTA VI finally ships',
  'New Nintendo hardware',
  'AI writes a chart-topping song',
  'Self-driving taxis in my city',
  'I run a half marathon',
  'I learn to cook properly',
  'I read 20 books',
  'I finish a side project',
  'I quit doom-scrolling',
  'Someone lands on the Moon',
  'Record-hot summer',
  'A foldable iPhone',
  'Four-day work week trend',
  'I go on a solo trip',
  'I pick up a new language',
  'Friend group trip actually happens',
  'Aliens "confirmed" again',
  'I start a podcast',
  'NFTs make a comeback',
  'I save an emergency fund',
]
