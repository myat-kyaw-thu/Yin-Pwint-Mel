"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hook/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn as nextAuthSignIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    try {
      // First, validate credentials with our API
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginResult.error || "Failed to log in");
      }

      // If API validation succeeds, use NextAuth's signIn
      const signInResult = await nextAuthSignIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // Fetch user data to get username using your existing API
      const userResponse = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userData.error || "Failed to fetch user data");
      }

      toast({
        title: "Success!",
        description: "You have been logged in.",
      });

      // Redirect to home page with username
      router.push(`/home/${userData.username}`);
      router.refresh(); // Force a refresh to update the session
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-sm border border-gray-200">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-xl font-semibold">Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        disabled={isLoading}
                        className="h-10 focus-visible:ring-gray-400"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        disabled={isLoading}
                        className="h-10 focus-visible:ring-gray-400"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full h-10 mt-2 font-medium bg-gray-900 hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-gray-900 hover:underline font-medium"
            >
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
