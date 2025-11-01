"use client"

import type React from "react"

import { useState } from "react"
import type { Profile } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { Globe, Twitter, Github, Check, LogOut } from "lucide-react"
import { useUpdateProfile } from "@/hooks/use-profile"
import { AVAILABLE_PROFILE_IMAGES } from "@/lib/constants/profile-images"
import { signOut } from "@/lib/actions/auth.actions"
import { useProfile } from "@/providers/profile-provider"

interface ProfileSidebarProps {
  profile: Profile | null
}

export function ProfileSidebar({ profile: initialProfile }: ProfileSidebarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { refetch } = useProfile()
  const [formData, setFormData] = useState(
    initialProfile || {
      id: "",
      username: "",
      bio: null,
      profile_image: null,
      website_url: null,
      twitter_url: null,
      github_url: null,
      created_at: "",
      updated_at: "",
    }
  )
  const [showImageSelector, setShowImageSelector] = useState(false)

  const updateMutation = useUpdateProfile(() => {
    refetch()
  })

  const availableImages = AVAILABLE_PROFILE_IMAGES

  const profile = initialProfile;

  if (!profile) {
    return (
      <div className="sticky top-24 border border-border bg-card">
        <div className="p-6 space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Welcome</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Join our community to create posts, engage with stories, and connect with writers
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Link href="/auth/login" className="block">
              <Button className="rounded-none w-full">Sign In</Button>
            </Link>
            <Link href="/auth/signup" className="block">
              <Button variant="outline" className="rounded-none w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
        <div className="border-t border-border px-6 py-3 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Free to join • No credit card required
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditing(false)

    // Update via mutation - context will handle the state
    updateMutation.mutate({
      username: formData.username,
      bio: formData.bio || undefined,
      profile_image: formData.profile_image || undefined,
      website_url: formData.website_url || undefined,
      twitter_url: formData.twitter_url || undefined,
      github_url: formData.github_url || undefined,
    })
  }

  if (isEditing) {
    return (
      <div className="sticky top-24 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image Selector */}
          <div className="space-y-2">
            <Label className="text-sm">Profile Image</Label>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-muted overflow-hidden relative">
                {formData.profile_image && (
                  <Image
                    src={formData.profile_image}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImageSelector(!showImageSelector)}
                className="rounded-none text-xs py-1"
              >
                {showImageSelector ? "Hide" : "Choose Image"}
              </Button>
            </div>

            {showImageSelector && (
              <div className="grid grid-cols-3 gap-1.5 p-2 border border-border">
                {availableImages.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, profile_image: img })
                      setShowImageSelector(false)
                    }}
                    className="relative w-full aspect-square hover:ring-2 hover:ring-primary transition-all"
                  >
                    <Image
                      src={img}
                      alt="Profile option"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                    {formData.profile_image === img && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-sm">
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="rounded-none text-sm h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="rounded-none min-h-20 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-sm">
              Website
            </Label>
            <Input
              id="website"
              value={formData.website_url || ""}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="rounded-none text-sm h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="twitter" className="text-sm">
              Twitter
            </Label>
            <Input
              id="twitter"
              value={formData.twitter_url || ""}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              className="rounded-none text-sm h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="github" className="text-sm">
              GitHub
            </Label>
            <Input
              id="github"
              value={formData.github_url || ""}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
              className="rounded-none text-sm h-9"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="rounded-none flex-1 text-sm py-2">
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="rounded-none flex-1 text-sm py-2"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="sticky top-24 space-y-4">
      <div className="space-y-4 text-center">
        {profile.profile_image && (
          <div className="w-20 h-20 bg-muted overflow-hidden relative mx-auto">
            <Image
              src={profile.profile_image || "/placeholder.svg"}
              alt={profile.username}
              width={80}
              height={80}
              priority
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-xl font-medium tracking-tight">{profile.username}</h2>
          {profile.bio && <p className="text-xs text-muted-foreground leading-relaxed">{profile.bio}</p>}
        </div>

        {(profile.website_url || profile.twitter_url || profile.github_url) && (
          <div className="flex items-center justify-center gap-3">
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
            {profile.twitter_url && (
              <a
                href={profile.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => {
              setFormData(profile || formData)
              setIsEditing(true)
            }}
            variant="outline"
            className="rounded-none w-full text-sm py-2"
          >
            Edit Profile
          </Button>
          <Button
            onClick={() => signOut()}
            variant="ghost"
            className="rounded-none w-full text-sm py-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
