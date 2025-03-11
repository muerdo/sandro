export interface ProductCustomizationOptions {
  initialSize?: string;
  initialColor?: string;
  initialType?: string;
  sizes?: string[];
  colors?: string[];
  types?: string[];
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductCustomization {
  selectedSize: string | null;
  selectedColor: string | null;
  selectedType: string | null;
  selectedImage: string | null;
}
