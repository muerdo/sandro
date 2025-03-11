"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, X } from "lucide-react";
import { format } from "date-fns";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useProductCustomization } from "@/hooks/useProductCustomization";
import ProductImages from "@/components/products/product-images";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export default function StripeProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<InventoryUpdate[]>([]);

  const {
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    selectedMedia,
    setSelectedMedia
  } = useProductCustomization({
    initialSize: product?.customization?.sizes?.[1],
    initialColor: product?.customization?.colors?.[0],
    sizes: product?.customization?.sizes,
    colors: product?.customization?.colors,
    initialMedia: product?.media?.[0]
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Get product ID from URL search params
        const searchParams = new URLSearchParams(window.location.search);
        const productId = searchParams.get('id');
        
        if (!productId) {
          toast.error('Product ID not found');
          router.push('/produtos');
          return;
        }

        const { data, error } = await supabase.functions.invoke('get-stripe-product', {
          body: { productId }
        });

        if (error) throw error;

        const transformedProduct: Product = {
          id: `stripe-${data.id}`,
          name: data.name,
          description: data.description || '',
          price: data.prices[0]?.unit_amount / 100 || 0,
          category: data.metadata?.category || 'Outros',
          media: [
            {
              type: 'image',
              url: data.images[0] || "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
              alt: data.name
            }
          ],
          features: data.metadata?.features?.split(',') || [],
          customization: data.metadata?.customization ? JSON.parse(data.metadata.customization) : undefined,
          stock: 999,
          status: 'active',
          stripeId: data.id
        };

        setProduct(transformedProduct);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      fetchProduct();
    }
  }, [router]);

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (!product) return;

    addItem({
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      name: `${product.name} - ${selectedColor || ''} ${selectedSize || ''}`.trim(),
      price: product.price,
      image: selectedMedia?.url || product.media[0].url
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <motion.button
            onClick={() => router.push('/produtos')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary hover:opacity-80 transition-opacity"
          >
            Voltar para Produtos
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
          Voltar para Produtos
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
                    <h3 className="text-lg font-medium mb-3">Tamanho</h3>
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
                    <h3 className="text-lg font-medium mb-3">Cor</h3>
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
                <h3 className="text-lg font-medium">Características</h3>
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
              Adicionar ao Carrinho
            </motion.button>
          </div>
        </div>

        {/* Inventory Management Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 rounded-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Inventory Management</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">{selectedProduct.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Stock</label>
                      <input
                        type="number"
                        value={selectedProduct.stock}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct,
                          stock: parseInt(e.target.value)
                        })}
                        className="w-full bg-background px-3 py-2 rounded-lg border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
                      <input
                        type="number"
                        value={selectedProduct.low_stock_threshold}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct,
                          low_stock_threshold: parseInt(e.target.value)
                        })}
                        className="w-full bg-background px-3 py-2 rounded-lg border"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Stock History</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {stockHistory.map((entry) => (
                      <div 
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {entry.change_amount > 0 ? '+' : ''}{entry.change_amount} units
                          </p>
                          <p className="text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <span className="capitalize px-2 py-1 rounded-full text-xs bg-primary/10">
                          {entry.change_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('inventory_history')
                          .insert({
                            product_id: selectedProduct.id,
                            previous_stock: selectedProduct.stock,
                            new_stock: selectedProduct.stock,
                            change_amount: 0,
                            change_type: 'manual',
                            created_by: user?.id
                          });

                        if (error) throw error;
                        toast.success('Inventory updated successfully');
                        setSelectedProduct(null);
                      } catch (error) {
                        console.error('Error updating inventory:', error);
                        toast.error('Failed to update inventory');
                      }
                    }}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
