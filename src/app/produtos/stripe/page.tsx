"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripePage(): JSX.Element | null {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      router.push('/produtos');
    }
  }, [router]);
  
  return null;
}
