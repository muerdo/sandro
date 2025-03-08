"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-scroll";

export default function LandingPage() {
  return (
    <main className="h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="h-screen relative flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1588412079929-790b9f593d8e?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-7xl font-bold mb-6 text-white"
            >
              Transforme Suas Ideias<br />em Realidade
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl text-white/90 mb-12 max-w-2xl mx-auto"
            >
              Comunicação visual profissional para sua marca brilhar
            </motion.p>
            <motion.button
              onClick={() => window.location.href = '/home'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white text-primary px-12 py-4 rounded-full font-medium hover:bg-white/90 transition-all flex items-center gap-2 mx-auto text-lg"
            >
              Conheça Nosso Trabalho
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white cursor-pointer"
        >
          <Link to="portfolio" smooth={true} duration={500} className="cursor-pointer">
            <ChevronDown className="w-8 h-8 animate-bounce" />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
