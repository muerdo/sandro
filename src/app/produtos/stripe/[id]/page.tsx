"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function StripeDynamicProductPage() {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      toast.error("This page is not available. Please use the products page.");
      router.push('/produtos');
    }
  }, [router]);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Available</h1>
        <p className="text-muted-foreground">Redirecting to products page...</p>
      </div>
    </div>
  );
}
