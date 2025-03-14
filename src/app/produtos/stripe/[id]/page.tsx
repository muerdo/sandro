"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function StripeDynamicProductPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to products page since we can't use dynamic routes
    toast.error("This page is not available. Please use the products page.");
    router.push('/produtos');
  }, [router]);
  
  return null;
}
