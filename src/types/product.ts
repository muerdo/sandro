export interface ProductCustomizationOptions {
  initialSize?: string;
  initialColor?: string;
  initialType?: string;
  sizes?: string[];
  colors?: string[];
  types?: string[];
}

export interface ProductMedia {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  thumbnail?: string;
}

export interface ProductCustomization {
  selectedSize: string | null;
  selectedColor: string | null;
  selectedType: string | null;
  selectedMedia: ProductMedia | null;
}

export interface ProductCustomizationState extends ProductCustomization {
  setSelectedSize: (size: string) => void;
  setSelectedColor: (color: string) => void;
  setSelectedType: (type: string) => void;
  setSelectedMedia: (media: ProductMedia) => void;
}
