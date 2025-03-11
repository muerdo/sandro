"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripePage() {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      router.push('/produtos');
    }
  }, [router]);
  
  return null;
}
