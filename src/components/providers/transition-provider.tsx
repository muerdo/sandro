"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

export default function TransitionProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <div key={pathname} className="min-h-screen">
        {children}
      </div>
    </AnimatePresence>
  );
}
