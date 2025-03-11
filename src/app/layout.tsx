import React from "react";
import "@/styles/globals.css";
import { Package2 } from "lucide-react";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import TransitionProvider from "@/components/providers/transition-provider";
import Footer from "@/components/footer";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import CartSummary from "@/components/cart/cart-summary";
import { StripeProvider } from "@/components/providers/stripe-provider";
import Link from "next/link";

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
                  <Link href="/orders/tracking">
                    <div className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                      <Package2 className="w-6 h-6" />
                    </div>
                  </Link>
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
