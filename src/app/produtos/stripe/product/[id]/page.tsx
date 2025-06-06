"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useProductCustomization } from "@/hooks/useProductCustomization";
import ProductImages from "@/components/products/product-images";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export default function StaticProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    selectedMedia,
    setSelectedMedia
  } = useProductCustomization({
    initialSize: product?.customization?.sizes?.[0],
    initialColor: product?.customization?.colors?.[0],
    sizes: product?.customization?.sizes,
    colors: product?.customization?.colors,
    initialMedia: product?.media?.[0]
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No authentication session');
        }

        const { data, error } = await supabase.functions.invoke('get-stripe-product', {
          body: { 
            productId: window.location.pathname.split('/').pop(),
            sessionToken: session.access_token 
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;

        if (!data || !data.id) {
          throw new Error('Product not found');
        }

        const transformedProduct: Product = {
          id: `stripe-${data.id}`,
          name: data.name || 'Product',
          description: data.description || 'No description available',
          price: data.prices?.[0]?.unit_amount ? data.prices[0].unit_amount / 100 : 0,
          category: data.metadata?.category || 'Other',
          media: data.images?.map((url: string) => ({
            type: 'image',
            url,
            alt: data.name || 'Product Image'
          })) || [],
          features: data.metadata?.features?.split(',') || [],
          customization: data.metadata?.customization ? 
            JSON.parse(data.metadata.customization) : undefined,
          stock: data.metadata?.stock ? parseInt(data.metadata.stock) : 999,
          status: 'active',
          stripeId: data.id,
          low_stock_threshold: 10
        };

        setProduct(transformedProduct);
        if (transformedProduct.media?.[0]) {
          setSelectedMedia(transformedProduct.media[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
        router.push('/produtos');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, []);

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (!product) return;

    const customizations = [
      selectedSize && `Size: ${selectedSize}`,
      selectedColor && `Color: ${selectedColor}`
    ].filter(Boolean).join(', ');

    addItem({
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      name: `${product.name}${customizations ? ` (${customizations})` : ''}`,
      price: product.price,
      image: selectedMedia?.url || product.media[0].url
    });

    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">
            The requested product could not be found.
          </p>
          <motion.button
            onClick={() => router.push('/produtos')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <motion.button
          onClick={() => router.push('/produtos')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </motion.button>

        <div className="grid grid-cols-2 gap-12">
          <ProductImages
            media={product.media}
            selectedMedia={selectedMedia || product.media[0]}
            onMediaSelect={setSelectedMedia}
            productName={product.name}
          />

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-3xl font-semibold text-primary">
                R$ {product.price.toFixed(2)}
              </p>
            </div>

            <p className="text-muted-foreground text-lg">
              {product.description}
            </p>

            {product.customization && (
              <div className="space-y-6">
                {product.customization.sizes && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Size</h3>
                    <div className="flex gap-3">
                      {product.customization.sizes.map((size) => (
                        <motion.button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg border-2 font-medium ${
                            selectedSize === size
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input hover:border-primary'
                          }`}
                        >
                          {size}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {product.customization.colors && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Color</h3>
                    <div className="flex gap-3">
                      {product.customization.colors.map((color) => (
                        <motion.button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg border-2 font-medium ${
                            selectedColor === color
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input hover:border-primary'
                          }`}
                        >
                          {color}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Features</h3>
                <ul className="grid grid-cols-2 gap-3">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <motion.button
              onClick={handleAddToCart}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium flex items-center justify-center gap-2 text-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  );
}
