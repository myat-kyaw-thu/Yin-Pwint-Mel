"use client"

import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const isOnSavedPage = pathname === "/saved"

  return (
    <header className="fixed top-4 left-4 right-4 z-50 bg-background/80 backdrop-blur-sm border border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-xl font-medium tracking-tight cursor-pointer hover:text-muted-foreground transition-colors">
            Yin Pwint Mel
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/blog/new">
            <Button variant="outline" className="rounded-none gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </Link>
          <Link href="/saved">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-none",
                isOnSavedPage && "bg-yellow-500/10 hover:bg-yellow-500/20"
              )}
            >
              <Bookmark
                className={cn(
                  "h-5 w-5 transition-colors",
                  isOnSavedPage && "fill-yellow-500 text-yellow-500"
                )}
              />
            </Button>
          </Link>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
