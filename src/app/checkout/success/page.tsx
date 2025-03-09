"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-lg text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="text-primary mb-6"
        >
          <CheckCircle className="w-24 h-24 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h1 className="text-4xl font-bold">Pedido Confirmado!</h1>
          <p className="text-muted-foreground">
            Obrigado pela sua compra. Você receberá um e-mail com os detalhes do seu pedido.
          </p>

          <motion.button
            onClick={() => router.push("/home")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            Continuar Comprando
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
