"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@/lib/actions/auth.actions"
import type { Profile } from "@/types/database"

interface ProfileContextType {
  profile: Profile | null
  isLoading: boolean
  refetch: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ 
  children, 
  initialProfile 
}: { 
  children: ReactNode
  initialProfile: Profile | null 
}) {
  // Use TanStack Query with initial data from SSR
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: getUser,
    initialData: initialProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevents over-fetching
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: true, // Only refetch on focus (auth changes)
  })

  return (
    <ProfileContext.Provider value={{ profile: profile ?? null, isLoading, refetch }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within ProfileProvider")
  }
  return context
}
