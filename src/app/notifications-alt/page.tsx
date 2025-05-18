"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsAltPage() {
  const router = useRouter();
  
  // This is just a redirect page to the actual notifications page
  useEffect(() => {
    router.push("/dashboard/notifications");
  }, [router]);
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold">Redirecting to Notifications...</h1>
      <p className="mt-4">Please wait while we redirect you to the notifications page.</p>
    </div>
  );
} 