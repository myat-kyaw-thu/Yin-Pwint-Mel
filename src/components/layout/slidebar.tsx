"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    BookMarked,
    Compass,
    Heart,
    Home,
    LogOut,
    MessageSquare,
    PlusSquare,
    Search,
    Settings,
    UserIcon,
} from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface User {
  id: string
  email: string
  username: string
  isVerified: boolean
  createdAt?: string
  firstName?: string
  lastName?: string
  profile?: {
    id?: string
    bio?: string | null
    pfp?: string | null
    website?: string | null
    birthdate?: string | null
  } | null
}

interface SidebarProps {
  user: User
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: "Home", href: `/home/${user.username}`, icon: Home },
    { name: "Search", href: `/search`, icon: Search },
    { name: "Explore", href: `/explore`, icon: Compass },
    { name: "Create", href: `/create`, icon: PlusSquare },
    { name: "Notifications", href: `/notifications`, icon: Heart },
    { name: "Messages", href: `/messages`, icon: MessageSquare },
    { name: "Saved", href: `/saved`, icon: BookMarked },
    { name: "Profile", href: `/profile/${user.username}`, icon: UserIcon },
  ]

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-10 hidden md:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-2xl font-bold">BlogApp</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-2 py-3 text-gray-700 rounded-md hover:bg-gray-100 transition-colors",
                isActive(item.href) && "font-medium bg-gray-100",
              )}
            >
              <item.icon className="w-6 h-6 mr-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user.profile?.pfp || undefined} alt={user.username} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          {/* Settings and Logout */}
          <div className="mt-4 flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1 text-gray-700" asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-gray-700" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

