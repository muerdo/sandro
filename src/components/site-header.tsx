"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X, ShoppingCart, User, Package2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const { items, setShowAuthDialog } = useCart();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Produtos", href: "/produtos" },

  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl">Sandro Adesivos</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {/* Cart Button */}
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-6 w-6" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2">
                  <User className="h-6 w-6" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2 border-b">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted"
                    >
                      <User className="h-4 w-4" />
                      Meu Perfil
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted"
                    >
                      <Package2 className="h-4 w-4" />
                      Meus Pedidos
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted"
                      >
                        <Package2 className="h-4 w-4" />
                        Dashboard Admin
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted text-red-500"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthDialog(true)}
                className="flex items-center gap-2"
                aria-label="Login or Sign Up"
              >
                <User className="h-6 w-6" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={toggleMenu}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t"
        >
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium py-2 transition-colors hover:text-primary"
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    href="/profile"
                    className="text-sm font-medium py-2 transition-colors hover:text-primary flex items-center gap-2"
                    onClick={closeMenu}
                  >
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/orders"
                    className="text-sm font-medium py-2 transition-colors hover:text-primary flex items-center gap-2"
                    onClick={closeMenu}
                  >
                    <Package2 className="h-4 w-4" />
                    Meus Pedidos
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-sm font-medium py-2 transition-colors hover:text-primary flex items-center gap-2"
                      onClick={closeMenu}
                    >
                      <Package2 className="h-4 w-4" />
                      Dashboard Admin
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        </motion.div>
      )}

{/* Auth Dialog é gerenciado pelo CartContext */}
    </header>
  );
}
