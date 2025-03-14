"use client";

import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="relative aspect-square">
        <img
          src={product.media?.[0]?.url || product.image || 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white/80 text-sm">{product.category}</p>
          <h3 className="text-white font-semibold text-lg mb-1">{product.name}</h3>
          <p className="text-white/90 font-bold">
            R$ {product.price.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <p className="text-muted-foreground">{product.description}</p>
        
        <div className="flex gap-3">
          <Link
            href={product.stripeId 
              ? `/produtos/stripe/product/${product.stripeId}` 
              : `/produtos/${product.id.split('-')[0]}s`}
            className="flex-1"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg font-medium"
            >
              Ver Detalhes
            </motion.button>
          </Link>
          
          <motion.button
            onClick={() => onQuickAdd(product)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary text-primary-foreground p-2 rounded-lg"
          >
            <ShoppingCart className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
