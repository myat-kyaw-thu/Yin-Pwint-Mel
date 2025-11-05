"use client"

import { useState, useEffect } from "react"
import { signIn } from "@/lib/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useProfile } from "@/providers/profile-provider"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setProfile } = useProfile()

  useEffect(() => {
    if (searchParams.get("confirmed") === "true") {
      toast({
        title: "Email confirmed!",
        description: "Your account has been verified. You can now sign in.",
        variant: "default",
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn(email, password)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      // Update profile in context immediately
      setProfile(result.profile)
      
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
        variant: "default",
      })
      
      // Client-side navigation
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex justify-center p-4 pt-24">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link href="/">
            <Button variant="ghost" className="rounded-none mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-muted-foreground mt-2">
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="border border-destructive bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-none"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="rounded-none w-full"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="underline hover:text-foreground">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
