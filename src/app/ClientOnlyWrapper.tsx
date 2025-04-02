"use client";
import { useEffect, useState } from "react";

interface ClientOnlyWrapperProps {
  children: React.ReactNode;
}

const ClientOnlyWrapper = ({ children }: ClientOnlyWrapperProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Optionally, you can return null, a loading spinner, or anything you want to show during SSR
    return null; // This prevents rendering during SSR
  }

  return <>{children}</>;
};

export default ClientOnlyWrapper;
