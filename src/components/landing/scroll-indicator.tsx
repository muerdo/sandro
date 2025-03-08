"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { scroller } from "react-scroll";

export default function ScrollIndicator() {
  const scrollToHome = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: window.innerHeight,
        behavior: "smooth"
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 1 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white cursor-pointer"
      onClick={scrollToHome}
    >
      <ChevronDown className="w-8 h-8 animate-bounce" />
    </motion.div>
  );
}
