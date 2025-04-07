import { Blog } from "@/controller/blogController";
import { User } from "@/controller/userController";
import BlogCard from "./blog-card";

interface BlogFeedProps {
  blogs: Blog[];
  currentUser: User;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function BlogFeed({
  blogs,
  currentUser,
  hasMore = false,
  onLoadMore,
}: BlogFeedProps) {
  if (blogs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No blogs in your feed
        </h3>
        <p className="text-gray-500 mb-4">
          Follow more users or create your first blog post to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} currentUser={currentUser} />
      ))}

      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
