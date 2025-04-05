"use client";

import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { useState, useEffect } from "react";
import { fixSupabaseStorageUrl } from "@/lib/storage-utils";
import { generateProductSlug } from "@/lib/slug-utils";

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  // Estado para armazenar URLs corrigidas
  const [fixedVideoUrl, setFixedVideoUrl] = useState<string | undefined>(undefined);
  const [fixedImageUrl, setFixedImageUrl] = useState<string | undefined>(undefined);

  // Corrigir URLs quando o componente for montado ou o produto mudar
  useEffect(() => {
    // Corrigir URL do vídeo, se existir
    const videoMedia = product.media?.find(m => m.type === 'video');
    if (videoMedia?.url) {
      setFixedVideoUrl(fixSupabaseStorageUrl(videoMedia.url));
    }

    // Corrigir URL da imagem
    if (product.image) {
      setFixedImageUrl(fixSupabaseStorageUrl(product.image));
    } else if (product.media?.[0]?.url) {
      setFixedImageUrl(fixSupabaseStorageUrl(product.media[0].url));
    }
  }, [product]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow w-full"
    >
      <div className="relative aspect-square w-full">
        {/* Verificar se o produto tem mídia do tipo vídeo */}
        {product.media?.some(m => m.type === 'video') ? (
          <div className="relative w-full h-full">
            <video
              src={fixedVideoUrl || product.media.find(m => m.type === 'video')?.url || product.image || 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9'}
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
              onError={(e) => {
                console.error('Error loading video:', e);
                // Fallback para imagem padrão em caso de erro
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <img
            src={fixedImageUrl || product.media?.[0]?.url || product.image || 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9'}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Error loading image:', e);
              // Fallback para imagem padrão em caso de erro
              e.currentTarget.src = 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9';
            }}
          />
        )}
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
              ? `/produtos/stripe/product?id=${product.stripeId}`
              : `/produtos/${product.id}`}
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
