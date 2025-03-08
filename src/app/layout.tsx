import React from "react";
import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import TransitionProvider from "@/components/providers/transition-provider";
import Footer from "@/components/footer";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import CartSummary from "@/components/cart/cart-summary";

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
            <TransitionProvider>
              <div className="flex-1">
                {children}
              </div>
              <Footer />
              <CartSummary />
            </TransitionProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
