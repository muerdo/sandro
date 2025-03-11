"use client";

import { useState, useCallback } from "react";
import type { ProductCustomizationOptions, ProductCustomizationState, ProductMedia } from "@/types/product";

export function useProductCustomization({
  initialSize,
  initialColor,
  initialType,
  initialMedia,
  sizes = [],
  colors = [],
  types = []
}: ProductCustomizationOptions & { initialMedia?: ProductMedia }): ProductCustomizationState {
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize || sizes[0] || null);
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor || colors[0] || null);
  const [selectedType, setSelectedType] = useState<string | null>(initialType || types[0] || null);
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(initialMedia || null);

  const handleSetSize = useCallback((size: string) => {
    setSelectedSize(size);
  }, []);

  const handleSetColor = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  const handleSetType = useCallback((type: string) => {
    setSelectedType(type);
  }, []);

  const handleSetMedia = useCallback((media: ProductMedia) => {
    setSelectedMedia(media);
  }, []);

  return {
    selectedSize,
    selectedColor,
    selectedType,
    selectedMedia,
    setSelectedSize: handleSetSize,
    setSelectedColor: handleSetColor,
    setSelectedType: handleSetType,
    setSelectedMedia: handleSetMedia
  };
}
