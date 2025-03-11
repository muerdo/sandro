"use client";

import { useState } from "react";
import type { ProductMedia } from "@/types/product";

export function useProductMedia(initialMedia: ProductMedia[] = []) {
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(
    initialMedia[0] || null
  );

  return {
    selectedMedia,
    setSelectedMedia,
  };
}
