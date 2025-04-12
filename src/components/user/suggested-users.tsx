"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  profile?: {
    pfp?: string | null;
    bio?: string | null;
  } | null;
  _count: {
    followers: number;
    blogs: number;
  };
}

interface SuggestedUsersProps {
  users: User[];
  currentUserId: string;
}

export default function SuggestedUsers({
  users,
  currentUserId,
}: SuggestedUsersProps) {
  const [followingState, setFollowingState] = useState<Record<string, boolean>>(
    {}
  );

  const handleFollow = async (userId: string) => {
    setFollowingState({
      ...followingState,
      [userId]: !followingState[userId],
    });

    // Here you would make an API call to follow/unfollow the user
    // await fetch(`/api/user/${userId}/follow`, { method: 'POST' });
  };

  if (users.length === 0) {
    return null;
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Suggestions For You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage
                  src={user.profile?.pfp || undefined}
                  alt={user.username}
                />
                <AvatarFallback>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link
                  href={`/profile/${user.username}`}
                  className="font-medium text-gray-900 hover:underline text-sm"
                >
                  {user.username}
                </Link>
                <p className="text-xs text-gray-500">
                  {user._count.followers} followers • {user._count.blogs} blogs
                </p>
              </div>
            </div>
            <Button
              variant={followingState[user.id] ? "outline" : "default"}
              size="sm"
              className="text-xs h-8"
              onClick={() => handleFollow(user.id)}
            >
              {followingState[user.id] ? "Following" : "Follow"}
            </Button>
          </div>
        ))}

        <Link
          href="/explore"
          className="text-sm text-gray-500 hover:text-gray-900 block text-center mt-2"
        >
          See More
        </Link>
      </CardContent>
    </Card>
  );
}
