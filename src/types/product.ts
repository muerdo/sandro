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

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  media: ProductMedia[];
  features: string[];
  customization?: ProductCustomizationOptions;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  stripeId?: string;
  metadata?: {
    category?: string;
    features?: string;
    customization?: string;
  };
  prices?: Array<{
    id: string;
    unit_amount: number;
  }>;
  image?: string; // Backwards compatibility
  low_stock_threshold?: number;
  created_at?: string;
  updated_at?: string;
}
