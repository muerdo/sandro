"use client";

import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { ProductMedia } from "@/types/product";
import { fixSupabaseStorageUrl } from "@/lib/storage-utils";

interface ProductImagesProps {
  media: ProductMedia[];
  selectedMedia: ProductMedia;
  onMediaSelect: (media: ProductMedia) => void;
  productName: string;
  className?: string;
}

const ProductImages = memo(function ProductImages({
  media,
  selectedMedia,
  onMediaSelect,
  productName,
  className = ""
}: ProductImagesProps) {
  // Estado para armazenar URLs corrigidas
  const [fixedMediaUrls, setFixedMediaUrls] = useState<Record<string, string>>({});

  // Corrigir URLs quando o componente for montado ou a mídia mudar
  useEffect(() => {
    const newFixedUrls: Record<string, string> = {};

    // Corrigir URL da mídia selecionada
    if (selectedMedia?.url) {
      newFixedUrls[selectedMedia.url] = fixSupabaseStorageUrl(selectedMedia.url);
    }

    // Corrigir URLs de todas as mídias
    media.forEach(item => {
      if (item.url) {
        newFixedUrls[item.url] = fixSupabaseStorageUrl(item.url);
      }
    });

    setFixedMediaUrls(newFixedUrls);
  }, [media, selectedMedia]);

  // Função para obter a URL corrigida
  const getFixedUrl = (originalUrl: string) => {
    return fixedMediaUrls[originalUrl] || originalUrl;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {selectedMedia?.type === 'video' ? (
        <motion.video
          key={selectedMedia.url}
          src={getFixedUrl(selectedMedia.url)}
          controls
          className="w-full aspect-video rounded-xl shadow-lg"
          onError={(e) => {
            console.error('Error loading video:', e);
            // Fallback para imagem padrão em caso de erro
            e.currentTarget.style.display = 'none';
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      ) : (
        <motion.img
          key={selectedMedia.url}
          src={getFixedUrl(selectedMedia.url)}
          alt={selectedMedia.alt || productName}
          className="w-full aspect-square object-cover rounded-xl shadow-lg"
          onError={(e) => {
            console.error('Error loading image:', e);
            // Fallback para imagem padrão em caso de erro
            e.currentTarget.src = 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9';
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-3 gap-2 sm:gap-4">
        {media.map((item) => (
          <motion.button
            key={item.url}
            onClick={() => onMediaSelect(item)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative rounded-lg overflow-hidden ${
              selectedMedia.url === item.url ? 'ring-2 ring-primary' : ''
            }`}
          >
            {item.type === 'video' ? (
              <div className="relative">
                <img
                  src={getFixedUrl(item.thumbnail || item.url)}
                  alt={item.alt || productName}
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    console.error('Error loading video thumbnail:', e);
                    // Fallback para imagem padrão em caso de erro
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <img
                src={getFixedUrl(item.url)}
                alt={item.alt || productName}
                className="w-full aspect-square object-cover"
                onError={(e) => {
                  console.error('Error loading image thumbnail:', e);
                  // Fallback para imagem padrão em caso de erro
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9';
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
});

export default ProductImages;
