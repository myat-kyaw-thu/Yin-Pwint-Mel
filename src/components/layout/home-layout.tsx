"use client"

import type React from "react"

import Sidebar from "./slidebar"

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

interface HomeLayoutProps {
  children: React.ReactNode
  user: User
}

export default function HomeLayout({ children, user }: HomeLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left sidebar */}
      <Sidebar user={user} />

      {/* Main content */}
      <main className="flex-1 p-4 md:ml-64">{children}</main>
    </div>
  )
}

