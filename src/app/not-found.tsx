"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <Link href="/" className="inline-block">
          <motion.div
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
