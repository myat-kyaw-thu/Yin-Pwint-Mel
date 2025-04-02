"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  interface User {
    email: string;
    username: string;
    isVerified: boolean;
    createdAt?: string;
    profile?: {
      bio?: string;
      website?: string;
      birthdate?: string;
    };
  }

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // If still loading session, wait
    if (status === "loading") {
      return;
    }

    // Fetch user data
    async function fetchUserData() {
      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session?.user?.email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();

        // Verify the username in the URL matches the fetched user
        if (userData.username !== params.username) {
          router.push(`/home/${userData.username}`);
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.email) {
      fetchUserData();
    }
  }, [params.username, router, session, status]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // This will never render as we redirect in the catch block
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Welcome, {user.username}!
        </h1>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 mb-2">
              User Information
            </h2>
            <p className="text-gray-700">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Username:</span> {user.username}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Verified:</span>{" "}
              {user.isVerified ? "Yes" : "No"}
            </p>
            {user.createdAt && (
              <p className="text-gray-700">
                <span className="font-medium">Joined:</span>{" "}
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {user.profile && (
            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-2">
                Profile Information
              </h2>
              <p className="text-gray-700">
                <span className="font-medium">Bio:</span>{" "}
                {user.profile.bio || "No bio yet"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Website:</span>{" "}
                {user.profile.website || "No website yet"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Birthdate:</span>{" "}
                {user.profile.birthdate
                  ? new Date(user.profile.birthdate).toLocaleDateString()
                  : "Not provided"}
              </p>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-gray-500">
          This is a basic home page showing authenticated user data.
        </p>
      </div>
    </div>
  );
}
