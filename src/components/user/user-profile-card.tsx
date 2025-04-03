import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface User {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  profile?: {
    bio?: string | null
    pfp?: string | null
    website?: string | null
  } | null
}

interface UserProfileCardProps {
  user: User
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.profile?.pfp || undefined} alt={user.username} />
            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Link href={`/profile/${user.username}`} className="font-medium text-gray-900 hover:underline">
              {user.username}
            </Link>
            <p className="text-sm text-gray-500">
              {user.firstName} {user.lastName}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {user.profile?.bio && <p className="text-sm text-gray-600 mb-3">{user.profile.bio}</p>}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/profile/${user.username}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

