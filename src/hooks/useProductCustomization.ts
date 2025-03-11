"use client";

import { useState } from "react";

interface ProductCustomizationProps {
  initialSize?: string;
  initialColor?: string;
  initialType?: string;
  sizes?: string[];
  colors?: string[];
  types?: string[];
}

export function useProductCustomization({
  initialSize,
  initialColor,
  initialType,
  sizes = [],
  colors = [],
  types = []
}: ProductCustomizationProps) {
  const [selectedSize, setSelectedSize] = useState(initialSize || sizes[0]);
  const [selectedColor, setSelectedColor] = useState(initialColor || colors[0]);
  const [selectedType, setSelectedType] = useState(initialType || types[0]);
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
