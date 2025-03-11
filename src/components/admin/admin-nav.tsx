"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package2,
  ShoppingCart,
  Users,
  Settings
} from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: Package2
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingCart
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings
  }
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-card border-r min-h-screen w-64 p-6 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileHover={{ x: 5 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
