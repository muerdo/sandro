"use client";

import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const { user, signOut } = useAuth();
  const { setShowAuthDialog } = useCart();
  const router = useRouter();


  return (
    <section
      className="min-h-[100svh] relative flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_CLIENT_HERO_IMAGE ||
          '/img/f2641af2-a4f1-4d08-9ac6-ac9f5de307c2.png'
        })`
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="container mx-auto px-4 py-20 relative z-10">
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
            className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-white px-2 sm:px-4"
          >
            Transforme Suas Ideias<br className="hidden sm:block" /> em Realidade
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl lg:text-2xl text-white/90 mb-12 max-w-2xl mx-auto px-4"
          >
            Comunicação visual profissional para sua marca brilhar
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <motion.button
              onClick={() => router.push('/produtos')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white text-primary px-6 md:px-12 py-3 md:py-4 rounded-full font-medium hover:bg-white/90 transition-all flex items-center gap-2 text-base md:text-lg"
            >
              Conheça Nossos Produtos
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => user ? signOut() : setShowAuthDialog(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="bg-primary/10 backdrop-blur-sm text-white px-6 md:px-12 py-3 md:py-4 rounded-full font-medium hover:bg-primary/20 transition-all flex items-center gap-2 text-base md:text-lg"
            >
              {user ? 'Sign Out' : 'Sign In'}
              <User className="w-5 h-5" />
            </motion.button>
            {/* Botão para acessar o dashboard com senha (visível para todos) */}

          </div>
          {/* O AuthDialog agora é gerenciado pelo CartContext */}
        </motion.div>
      </div>
    </section>
  );
}