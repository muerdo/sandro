"use client";

import AdminNav from "@/components/admin/admin-nav";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !isAdmin) {
      toast.error("You don't have permission to access this area");
      router.push("/");
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) {
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
