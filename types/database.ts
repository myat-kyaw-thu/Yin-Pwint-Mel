export type Profile = {
  id: string
  username: string
  bio: string | null
  profile_image: string | null
  website_url: string | null
  twitter_url: string | null
  github_url: string | null
  created_at: string
  updated_at: string
}

export type Post = {
  id: string
  title: string
  content: any
  excerpt: string | null
  slug: string
  author_id: string
  status: "draft" | "published" | "archived"
  created_at: string
  updated_at: string
  published_at: string | null
  profiles?: Profile
  tags?: Tag[]
  likes_count?: number
  comments_count?: number
  is_saved?: boolean
  is_liked?: boolean
}

export type Tag = {
  id: string
  name: string
  color: string
  created_at: string
}

export type PostTag = {
  post_id: string
  tag_id: string
  created_at: string
}

export type Like = {
  user_id: string
  post_id: string
  created_at: string
}

export type SavedPost = {
  user_id: string
  post_id: string
  created_at: string
}

export type Comment = {
  id: string
  content: string
  author_id: string
  post_id: string
  parent_id: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  replies?: Comment[]
}
