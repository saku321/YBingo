import { Link } from 'react-router-dom'
import BingoTicket from './BingoTicket'
import { Icon, UserChip } from './ui'
import { completedLines, markedCount } from '../lib/bingo'
import { compactNumber, timeAgo } from '../lib/format'
import type { Board } from '../lib/types'
import type { ReactNode } from 'react'

export default function BoardTile({
  board,
  liked,
  showOwner = true,
  actions,
}: {
  board: Board
  liked?: boolean
  showOwner?: boolean
  actions?: ReactNode
}) {
  const lines = completedLines(board.cells).length
  const marked = markedCount(board.cells)

  return (
    <article className="tile">
      <Link to={`/card/${board.id}`} className="tile-card" aria-label={`Open ${board.title}`}>
        <BingoTicket cells={board.cells} year={board.year} colors={board.colors} size="sm" />
        {lines > 0 && <span className="tile-bingo">BINGO{lines > 1 ? ` ×${lines}` : ''}</span>}
        {!board.is_public && (
          <span className="tile-private" title="Private — only you can see this">
            <Icon name="lock" size={13} /> Private
          </span>
        )}
      </Link>
      <div className="tile-body">
        <Link to={`/card/${board.id}`} className="tile-title">
          {board.title}
        </Link>
        <div className="tile-meta">
          {showOwner ? (
            <UserChip profile={board.owner} sub={timeAgo(board.created_at)} />
          ) : (
            <span className="tile-sub">
              {marked}/24 happened · {timeAgo(board.updated_at)}
            </span>
          )}
          <div className="tile-stats">
            <span className={liked ? 'stat stat--liked' : 'stat'} title="Likes">
              <Icon name={liked ? 'heartFill' : 'heart'} size={15} /> {compactNumber(board.like_count)}
            </span>
            <span className="stat" title="Comments">
              <Icon name="comment" size={15} /> {compactNumber(board.comment_count)}
            </span>
          </div>
        </div>
        {actions && <div className="tile-actions">{actions}</div>}
      </div>
    </article>
  )
}
