"use client";

import AdminNav from "@/components/admin/admin-nav";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!user || !isAdmin) {
          toast.error("You don't have permission to access this area");
          router.push("/");
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        toast.error("Authentication error");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [user, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex">
      <AdminNav />
      <main className="flex-1 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
