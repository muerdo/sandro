"use client";

import { useState, useCallback } from "react";
import type { ProductCustomizationOptions, ProductCustomizationState } from "@/types/product";

export function useProductCustomization({
  initialSize,
  initialColor,
  initialType,
  sizes = [],
  colors = [],
  types = []
}: ProductCustomizationOptions): Omit<ProductCustomizationState, 'selectedMedia' | 'setSelectedMedia'> {
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize || sizes[0] || null);
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor || colors[0] || null);
  const [selectedType, setSelectedType] = useState<string | null>(initialType || types[0] || null);

  const handleSetSize = useCallback((size: string) => {
    setSelectedSize(size);
  }, []);

  const handleSetColor = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  const handleSetType = useCallback((type: string) => {
    setSelectedType(type);
  }, []);

  return {
    selectedSize,
    selectedColor,
    selectedType,
    setSelectedSize: handleSetSize,
    setSelectedColor: handleSetColor,
    setSelectedType: handleSetType
  };
}
