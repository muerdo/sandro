"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { ProductImage } from "@/types/product";

interface ProductImagesProps {
  images: string[];
  selectedImage: string;
  onImageSelect: (image: string) => void;
  productName: string;
  className?: string;
});

export default ProductImages;

const ProductImages = memo(function ProductImages({ 
  images, 
  selectedImage, 
  onImageSelect,
  productName,
  className = ""
}: ProductImagesProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <motion.img
        key={selectedImage}
        src={selectedImage}
        alt={productName}
        className="w-full aspect-square object-cover rounded-xl shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className="grid grid-cols-3 gap-4">
        {images.map((image) => (
          <motion.button
            key={image}
            onClick={() => onImageSelect(image)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative rounded-lg overflow-hidden ${
              selectedImage === image ? 'ring-2 ring-primary' : ''
            }`}
          >
            <img
              src={image}
              alt={productName}
              className="w-full aspect-square object-cover"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
