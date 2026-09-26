export type Cell = { text: string; marked: boolean }

export type CardColors = {
  background: string
  text: string
  lines: string
  centerFrom: string
  centerTo: string
  marker: string
}

export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  is_premium: boolean
  created_at: string
}

export type ProfileLite = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>

export type Board = {
  id: string
  owner_id: string
  title: string
  year: number
  cells: Cell[]
  colors: CardColors | null
  is_public: boolean
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  owner?: ProfileLite | null
}

export type BoardInput = Pick<Board, 'title' | 'year' | 'cells' | 'colors' | 'is_public'>

export type Comment = {
  id: number
  board_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
  author?: ProfileLite | null
}

export type FeedSort = 'new' | 'top' | 'talked'
