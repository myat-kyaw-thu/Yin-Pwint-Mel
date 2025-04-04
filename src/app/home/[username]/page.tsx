"use client";

import BlogFeed from "@/components/blog/blog-feed";
import HomeLayout from "@/components/layout/home-layout";
import FollowingList from "@/components/user/following-list";
import SuggestedUsers from "@/components/user/suggested-users";
import UserProfileCard from "@/components/user/user-profile-card";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  profile?: {
    id?: string;
    bio?: string | null;
    pfp?: string | null;
    website?: string | null;
    birthdate?: string | null;
  } | null;
}

// Mock data for static UI elements
const MOCK_BLOGS = [
  {
    id: "1",
    title: "Getting Started with Next.js",
    subtitle: "A beginner's guide to React framework",
    description:
      "Next.js is a React framework that gives you building blocks to create web applications. By framework, we mean Next.js handles the tooling and configuration needed for React, and provides additional structure, features, and optimizations for your application.",
    content: "Lorem ipsum...",
    visibility: "PUBLIC",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: "user1",
    author: {
      id: "user1",
      username: "johndoe",
      email: "john@example.com",
      profile: {
        pfp: null,
        bio: "Web developer and blogger",
      },
    },
    images: [
      {
        id: "img1",
        url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
        blogId: "1",
      },
    ],
    tags: [
      {
        id: "tag1",
        blogId: "1",
        tagId: "t1",
        tag: {
          id: "t1",
          name: "nextjs",
        },
      },
      {
        id: "tag2",
        blogId: "1",
        tagId: "t2",
        tag: {
          id: "t2",
          name: "react",
        },
      },
    ],
    _count: {
      comments: 5,
      likes: 12,
    },
  },
  {
    id: "2",
    title: "Understanding TypeScript with React",
    subtitle: "Type safety for your React applications",
    description:
      "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. When used with React, it provides type checking and intellisense support for your components and props.",
    content: "Lorem ipsum...",
    visibility: "PUBLIC",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    authorId: "user2",
    author: {
      id: "user2",
      username: "janedoe",
      email: "jane@example.com",
      profile: {
        pfp: null,
        bio: "Frontend developer",
      },
    },
    images: [
      {
        id: "img2",
        url: "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
        blogId: "2",
      },
    ],
    tags: [
      {
        id: "tag3",
        blogId: "2",
        tagId: "t3",
        tag: {
          id: "t3",
          name: "typescript",
        },
      },
      {
        id: "tag4",
        blogId: "2",
        tagId: "t4",
        tag: {
          id: "t4",
          name: "react",
        },
      },
    ],
    _count: {
      comments: 3,
      likes: 8,
    },
  },
];

const MOCK_FOLLOWING = [
  {
    id: "user2",
    username: "janedoe",
    email: "jane@example.com",
    profile: {
      pfp: null,
      bio: "Frontend developer",
    },
  },
  {
    id: "user3",
    username: "bobsmith",
    email: "bob@example.com",
    profile: {
      pfp: null,
      bio: "Backend developer",
    },
  },
  {
    id: "user4",
    username: "alicejones",
    email: "alice@example.com",
    profile: {
      pfp: null,
      bio: "Full stack developer",
    },
  },
];

const MOCK_SUGGESTED_USERS = [
  {
    id: "user5",
    username: "sarahparker",
    email: "sarah@example.com",
    profile: {
      pfp: null,
      bio: "UX Designer",
    },
    _count: {
      followers: 120,
      blogs: 15,
    },
  },
  {
    id: "user6",
    username: "mikebrown",
    email: "mike@example.com",
    profile: {
      pfp: null,
      bio: "DevOps Engineer",
    },
    _count: {
      followers: 85,
      blogs: 7,
    },
  },
  {
    id: "user7",
    username: "emilydavis",
    email: "emily@example.com",
    profile: {
      pfp: null,
      bio: "Mobile Developer",
    },
    _count: {
      followers: 210,
      blogs: 22,
    },
  },
];

export default function HomePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // If still loading session, wait
    if (status === "loading") {
      return;
    }

    // Fetch user data
    async function fetchUserData() {
      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session?.user?.email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();

        // Verify the username in the URL matches the fetched user
        if (userData.username !== params.username) {
          router.push(`/home/${userData.username}`);
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.email) {
      fetchUserData();
    }
  }, [params.username, router, session, status]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // This will never render as we redirect in the catch block
  }

  return (
    <HomeLayout user={user}>
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        {/* Following users list */}
        <FollowingList users={MOCK_FOLLOWING} />

        {/* Main content area */}
        <div className="flex gap-8 mt-6">
          {/* Blog feed */}
          <div className="flex-1">
            <BlogFeed blogs={MOCK_BLOGS} currentUser={user} />
          </div>

          {/* Right sidebar */}
          <div className="w-80 hidden lg:block">
            <div className="sticky top-4 space-y-6">
              <UserProfileCard user={user} />
              <SuggestedUsers
                users={MOCK_SUGGESTED_USERS}
                currentUserId={user.id}
              />
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
