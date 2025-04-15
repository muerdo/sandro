import React from "react";
import "@/styles/globals.css";
import { Package2 } from "lucide-react";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import TransitionProvider from "@/components/providers/transition-provider";
import Footer from "@/components/footer";
import SiteHeader from "@/components/site-header";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import CartSummary from "@/components/cart/cart-summary";
import { AbacatePayProvider } from "@/components/providers/abacatepay-provider";
import Link from "next/link";
import { VisibilityProvider } from "@/contexts/visibility-context";

export const metadata: Metadata = {
  title: "Sandro Adesivos - Comunicação Visual Profissional",
  description: "Sandro Adesivos em Açailândia-MA: adesivos personalizados, banners, letras caixa, fachadas, sinalização, camisetas e canecas personalizadas. Orçamento rápido e instalação profissional.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable}`}>
      <meta name="google-site-verification" content="KRN3Pnw1PTmJaGx9IiRuI1QoceDmR2OH4gRozx3s0dk" />
      <body className="min-h-screen bg-background antialiased flex flex-col overflow-x-hidden">
        <AuthProvider>
          <CartProvider>
            <VisibilityProvider>
              <TransitionProvider>
                <AbacatePayProvider>
                  <div className="flex-1 flex flex-col">
                    <SiteHeader />
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
                </AbacatePayProvider>
              </TransitionProvider>
            </VisibilityProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
