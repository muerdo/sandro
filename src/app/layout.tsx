import React from "react";
import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import TransitionProvider from "@/components/providers/transition-provider";
import Footer from "@/components/footer";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import CartSummary from "@/components/cart/cart-summary";
import { StripeProvider } from "@/components/providers/stripe-provider";

export const metadata: Metadata = {
  title: "VisualPrint - Comunicação Visual Profissional",
  description: "Serviços profissionais de comunicação visual, impressão digital, plotagem, adesivos e personalização.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable}`}>
      <body className="min-h-screen bg-background antialiased flex flex-col">
        <AuthProvider>
          <CartProvider>
            <StripeProvider>
              <TransitionProvider>
                <div className="flex-1">
                  {children}
                </div>
                <nav className="fixed bottom-24 right-8 z-40">
                  <motion.button
                    onClick={() => window.location.href = '/orders/tracking'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg flex items-center gap-2"
                  >
                    <Package2 className="w-6 h-6" />
                  </motion.button>
                </nav>
                <Footer />
                <CartSummary />
              </TransitionProvider>
            </StripeProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
