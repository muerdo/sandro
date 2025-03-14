"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { ProductMedia } from "@/types/product";

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
  return (
    <div className={`space-y-4 ${className}`}>
      {selectedMedia?.type === 'video' ? (
        <motion.video
          key={selectedMedia.url}
          src={selectedMedia.url}
          controls
          className="w-full aspect-video rounded-xl shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      ) : (
        <motion.img
          key={selectedMedia.url}
          src={selectedMedia.url}
          alt={selectedMedia.alt || productName}
          className="w-full aspect-square object-cover rounded-xl shadow-lg"
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
                  src={item.thumbnail || item.url}
                  alt={item.alt || productName}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.alt || productName}
                className="w-full aspect-square object-cover"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
});

export default ProductImages;
