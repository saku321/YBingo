import { supabase } from './supabase'
import { normalizeCells } from './bingo'
import type { Board, BoardInput, Comment, FeedSort, Profile } from './types'

const OWNER = 'owner:profiles!boards_owner_id_fkey(id, username, display_name, avatar_url)'
const BOARD_SELECT = `id, owner_id, title, year, cells, colors, is_public, like_count, comment_count, created_at, updated_at, ${OWNER}`
const COMMENT_SELECT =
  'id, board_id, author_id, body, created_at, updated_at, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url)'

/** Turns Supabase / Postgres errors into something a person can act on. */
export function errorMessage(err: unknown): string {
  if (!err) return 'Something went wrong.'
  const e = err as { message?: string; code?: string; details?: string }
  const msg = e.message ?? String(err)
  if (e.code === '23505') {
    if (msg.includes('username')) return 'That username is already taken.'
    return 'That already exists.'
  }
  if (e.code === '42501' || msg.includes('row-level security')) return "You don't have permission to do that."
  if (e.code === 'PGRST116') return 'Not found.'
  if (msg === 'Failed to fetch' || msg.includes('NetworkError')) return 'Network error — check your connection and try again.'
  return msg
}

function toBoard(row: Record<string, unknown>): Board {
  const b = row as unknown as Board
  return { ...b, cells: normalizeCells(b.cells), owner: (row.owner as Board['owner']) ?? null }
}

export async function fetchFeed(sort: FeedSort, page: number, pageSize = 12): Promise<Board[]> {
  let q = supabase.from('boards').select(BOARD_SELECT).eq('is_public', true)
  if (sort === 'top') q = q.order('like_count', { ascending: false })
  if (sort === 'talked') q = q.order('comment_count', { ascending: false })
  q = q.order('created_at', { ascending: false }).range(page * pageSize, page * pageSize + pageSize - 1)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(toBoard)
}

export async function fetchBoard(id: string): Promise<Board | null> {
  const { data, error } = await supabase.from('boards').select(BOARD_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toBoard(data) : null
}

export async function fetchBoardsByOwner(ownerId: string): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select(BOARD_SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toBoard)
}

export async function createBoard(input: BoardInput): Promise<string> {
  const { data, error } = await supabase.from('boards').insert(input).select('id').single()
  if (error) throw error
  return data.id as string
}

export async function updateBoard(id: string, patch: Partial<BoardInput>): Promise<void> {
  const { error } = await supabase.from('boards').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', id)
  if (error) throw error
}

export async function likedBoardIds(userId: string, boardIds: string[]): Promise<Set<string>> {
  if (boardIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('likes')
    .select('board_id')
    .eq('user_id', userId)
    .in('board_id', boardIds)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.board_id as string))
}

export async function likeBoard(boardId: string): Promise<void> {
  const { error } = await supabase.from('likes').insert({ board_id: boardId })
  // Already liked (double click, second tab) is fine.
  if (error && error.code !== '23505') throw error
}

export async function unlikeBoard(boardId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('likes').delete().eq('board_id', boardId).eq('user_id', userId)
  if (error) throw error
}

export async function fetchComments(boardId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('board_id', boardId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Comment[]
}

export async function fetchComment(id: number): Promise<Comment | null> {
  const { data, error } = await supabase.from('comments').select(COMMENT_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return (data as unknown as Comment) ?? null
}

export async function addComment(boardId: string, body: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ board_id: boardId, body })
    .select(COMMENT_SELECT)
    .single()
  if (error) throw error
  return data as unknown as Comment
}

export async function editComment(id: number, body: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .update({ body })
    .eq('id', id)
    .select(COMMENT_SELECT)
    .single()
  if (error) throw error
  return data as unknown as Comment
}

export async function deleteComment(id: number): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

export async function fetchPopularIdeas(limit = 24): Promise<string[]> {
  const { data, error } = await supabase.rpc('popular_ideas', { max_results: limit })
  if (error) throw error
  return ((data ?? []) as { idea: string }[]).map((r) => r.idea)
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_premium, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Profile) ?? null
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_premium, created_at')
    .eq('username', username.toLowerCase())
    .maybeSingle()
  if (error) throw error
  return (data as Profile) ?? null
}

export async function isUsernameTaken(username: string, exceptId?: string): Promise<boolean> {
  let q = supabase.from('profiles').select('id').eq('username', username.toLowerCase())
  if (exceptId) q = q.neq('id', exceptId)
  const { data, error } = await q.limit(1)
  if (error) return false
  return (data ?? []).length > 0
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, 'username' | 'display_name' | 'avatar_url'>>,
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) throw error
}
