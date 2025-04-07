import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  profile?: {
    pfp?: string | null;
    bio?: string | null;
  } | null;
}

interface FollowingListProps {
  users: User[];
}

export default function FollowingList({ users }: FollowingListProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4">
          {users.length > 0 ? (
            users.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex flex-col items-center space-y-1"
              >
                <Avatar className="w-16 h-16 border-2 border-gray-200">
                  <AvatarImage
                    src={user.profile?.pfp || undefined}
                    alt={user.username}
                  />
                  <AvatarFallback>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-700 truncate max-w-[64px]">
                  {user.username}
                </span>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center w-full py-4">
              <p className="text-gray-500 text-sm">
                You're not following anyone yet
              </p>
              <Link
                href="/explore"
                className="text-blue-600 text-sm mt-1 hover:underline"
              >
                Discover people to follow
              </Link>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
