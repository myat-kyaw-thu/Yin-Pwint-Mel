import LoadingSpinner from "@/components/ui/loading-spinner";
import UserProfileContent from "@/components/user/user-profile-content";
import { Suspense } from "react";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserProfileContent username={params.username} />
    </Suspense>
  );
}
