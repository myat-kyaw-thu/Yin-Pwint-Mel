"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userController } from "@/controller/userController";
import { useToast } from "@/hook/use-toast";
import useStore from "@/lib/store";

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
  isFollowing: boolean;
}

interface SuggestedUsersProps {
  users: User[];
  currentUserId: string;
}

export default function SuggestedUsers({
  users: initialUsers,
  currentUserId,
}: SuggestedUsersProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>(
    {}
  );
  const { invalidateFollowStatus, invalidateUserStats } = useStore();

  // Initialize following state from users
  useEffect(() => {
    const initialState: Record<string, boolean> = {};
    initialUsers.forEach((user) => {
      initialState[user.id] = user.isFollowing || false;
    });
    setFollowingState(initialState);
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleFollow = useCallback(
    async (userId: string) => {
      try {
        // Optimistic update
        const newFollowingState = !followingState[userId];

        setFollowingState((prev) => ({
          ...prev,
          [userId]: newFollowingState,
        }));

        // Call API
        const result = await userController.toggleFollow(userId, currentUserId);

        // If API returns different result, revert
        if (result.following !== newFollowingState) {
          setFollowingState((prev) => ({
            ...prev,
            [userId]: result.following,
          }));
        }

        // Update user in the list
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  isFollowing: result.following,
                  _count: {
                    ...user._count,
                    followers:
                      user._count.followers + (result.following ? 1 : -1),
                  },
                }
              : user
          )
        );

        // Invalidate caches
        invalidateFollowStatus(userId);
        invalidateUserStats(userId);
      } catch (error) {
        console.error("Error toggling follow:", error);

        // Revert on error
        setFollowingState((prev) => ({
          ...prev,
          [userId]: !prev[userId],
        }));

        toast({
          title: "Error",
          description: "Failed to update follow status",
          variant: "destructive",
        });
      }
    },
    [
      followingState,
      currentUserId,
      toast,
      invalidateFollowStatus,
      invalidateUserStats,
    ]
  );

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
      </CardContent>
    </Card>
  );
}
