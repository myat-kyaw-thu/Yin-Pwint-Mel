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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Validation schema for verification code
const verificationSchema = z.object({
  code: z.string().length(6, {
    message: "Verification code must be 6 digits.",
  }),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

export default function EmailVerifyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("verificationEmail");
    if (!storedEmail) {
      toast({
        title: "Error",
        description: "Email not found. Please sign up again.",
        variant: "destructive",
      });
      router.push("/auth/signup");
      return;
    }
    setEmail(storedEmail);
  }, [router, toast]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  async function onSubmit(data: VerificationFormValues) {
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: data.code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      toast({
        title: "Success!",
        description: "Email verified successfully.",
      });

      // Clear email from session storage
      sessionStorage.removeItem("verificationEmail");

      // Redirect to home page
      router.push(`/home/${result.username}`);
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to verify email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (!email) return;

    setResendDisabled(true);
    setCountdown(60); // Disable for 60 seconds

    try {
      const response = await fetch("/api/auth/email-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend code");
      }

      toast({
        title: "Code Sent!",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      console.error("Resend code error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to resend verification code",
        variant: "destructive",
      });
      setResendDisabled(false);
      setCountdown(0);
    }
  }

  if (!email) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-sm border border-gray-200">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl font-semibold text-center">
              Loading...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-sm border border-gray-200">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-xl font-semibold">
            Verify your email
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Verification Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-digit code"
                        {...field}
                        disabled={isLoading}
                        className="h-10 focus-visible:ring-gray-400 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-10 mt-2 font-medium bg-gray-900 hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify email"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center pt-2 pb-6 gap-2">
          <p className="text-sm text-gray-600">Didn't receive a code?</p>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={handleResendCode}
            disabled={resendDisabled}
          >
            {resendDisabled ? `Resend code (${countdown}s)` : "Resend code"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
