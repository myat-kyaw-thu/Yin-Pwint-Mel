import BlogCard from './blog-card'

interface User {
  id: string
  username: string
  email: string
  profile?: {
    pfp?: string | null
    bio?: string | null
  } | null
}

interface Blog {
  id: string
  title: string
  subtitle?: string
  description: string
  content: string
  visibility: string
  createdAt: string
  updatedAt: string
  authorId: string
  author: User
  images: {
    id: string
    url: string
    blogId: string
  }[]
  tags: {
    id: string
    blogId: string
    tagId: string
    tag: {
      id: string
      name: string
    }
  }[]
  _count: {
    comments: number
    likes: number
  }
}

interface BlogFeedProps {
  blogs: Blog[]
  currentUser: User
}

export default function BlogFeed({ blogs, currentUser }: BlogFeedProps) {
  if (blogs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs in your feed</h3>
        <p className="text-gray-500 mb-4">Follow more users or create your first blog post to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} currentUser={currentUser} />
      ))}
    </div>
  )
}

