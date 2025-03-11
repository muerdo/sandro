"use client";

import { useState } from "react";
import type { ProductCustomizationOptions, ProductCustomization } from "@/types/product";

export function useProductCustomization({
  initialSize,
  initialColor,
  initialType,
  sizes = [],
  colors = [],
  types = []
}: ProductCustomizationOptions): ProductCustomization & {
  setSelectedSize: (size: string) => void;
  setSelectedColor: (color: string) => void;
  setSelectedType: (type: string) => void;
  setSelectedImage: (image: string) => void;
} {
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize || sizes[0] || null);
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor || colors[0] || null);
  const [selectedType, setSelectedType] = useState<string | null>(initialType || types[0] || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return {
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    selectedType,
    setSelectedType,
    selectedImage,
    setSelectedImage
  };
}
