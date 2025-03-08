"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  const socialLinks = [
    {
      icon: <Instagram className="w-5 h-5" />,
      href: "https://instagram.com",
      label: "Instagram"
    },
    {
      icon: <Facebook className="w-5 h-5" />,
      href: "https://facebook.com",
      label: "Facebook"
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      href: "https://wa.me/5599985068943",
      label: "WhatsApp"
    }
  ];

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            © 2024 @dante
          </motion.p>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={link.label}
              >
                {link.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
