"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, X, Plus, Minus } from "lucide-react";
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
  const [quantity, setQuantity] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stockHistory, setStockHistory] = useState<Array<{
    id: string;
    product_id: string;
    previous_stock: number;
    new_stock: number;
    change_amount: number;
    change_type: 'manual' | 'order' | 'restock';
    created_at: string;
    notes?: string;
    profiles?: {
      username: string;
    };
  }>>([]);

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
        if (typeof window === 'undefined') return;
        
        const searchParams = new URLSearchParams(window.location.search);
        const productId = searchParams.get('id');
        
        if (!productId) {
          toast.error('Produto não encontrado');
          router.push('/produtos');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke('get-stripe-product', {
          body: { 
            productId,
            sessionToken: session?.access_token 
          }
        });

        if (error) throw error;

        if (!data || !data.id) {
          throw new Error('Produto não encontrado');
        }

        const transformedProduct: Product = {
          id: `stripe-${data.id}`,
          name: data.name || 'Produto',
          description: data.description || 'Sem descrição disponível',
          price: data.prices?.reduce((lowest: any, current: any) => {
            if (!current.active) return lowest;
            if (!lowest || current.unit_amount < lowest.unit_amount) {
              return current;
            }
            return lowest;
          }, null)?.unit_amount / 100 || 0,
          category: data.metadata?.category || 'Outros',
          media: data.images?.map((url: string) => ({
            type: 'image' as const,
            url: url || "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
            alt: data.name || 'Imagem do produto'
          })) || [{
            type: 'image',
            url: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
            alt: 'Imagem padrão do produto'
          }],
          features: data.metadata?.features?.split(',').map((f: string) => f.trim()) || [],
          customization: data.metadata?.customization ? 
            JSON.parse(data.metadata.customization) : undefined,
          stock: data.metadata?.stock ? parseInt(data.metadata.stock) : 999,
          status: 'active',
          stripeId: data.id,
          low_stock_threshold: data.metadata?.low_stock_threshold ? 
            parseInt(data.metadata.low_stock_threshold) : 10
        };

        setProduct(transformedProduct);
        
        if (transformedProduct.media?.[0]) {
          setSelectedMedia(transformedProduct.media[0]);
        }
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

    const customizations = [
      selectedSize && `Tamanho: ${selectedSize}`,
      selectedColor && `Cor: ${selectedColor}`
    ].filter(Boolean).join(', ');

    const cartItem = {
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      name: `${product.name}${customizations ? ` (${customizations})` : ''}`,
      price: product.price,
      image: selectedMedia?.url || product.media[0].url,
      quantity
    };
    
    addItem(cartItem);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto" />
          <p className="text-muted-foreground animate-pulse">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold mb-4">Produto não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível encontrar o produto solicitado.
          </p>
          <motion.button
            onClick={() => router.push('/produtos')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
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

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-lg font-medium">Quantidade:</label>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-secondary text-secondary-foreground"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center p-2 rounded-lg border bg-background"
                  />
                  <motion.button
                    onClick={() => setQuantity(quantity + 1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-secondary text-secondary-foreground"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal:</p>
                  <p className="text-2xl font-bold">
                    R$ {(product.price * quantity).toFixed(2)}
                  </p>
                </div>
                <motion.button
                  onClick={() => {
                    handleAddToCart();
                    toast.success(`${quantity} item${quantity > 1 ? 's' : ''} adicionado${quantity > 1 ? 's' : ''} ao carrinho`);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium flex items-center gap-2 text-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Adicionar ao Carrinho
                </motion.button>
              </div>
            </div>
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
                          stock: parseInt(e.target.value) || 0
                        })}
                        className="w-full bg-background px-3 py-2 rounded-lg border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
                      <input
                        type="number"
                        value={selectedProduct.low_stock_threshold || 0}
                        onChange={(e) => {
                          if (selectedProduct) {
                            setSelectedProduct({
                              ...selectedProduct,
                              low_stock_threshold: parseInt(e.target.value) || 0
                            });
                          }
                        }}
                        className="w-full bg-background px-3 py-2 rounded-lg border"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Add notes about this stock update..."
                    className="w-full bg-background px-3 py-2 rounded-lg border resize-none"
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      notes: e.target.value
                    })}
                  />
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
                          {entry.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="capitalize px-2 py-1 rounded-full text-xs bg-primary/10">
                            {entry.change_type}
                          </span>
                          {entry.profiles?.username && (
                            <p className="text-xs text-muted-foreground mt-1">
                              by {entry.profiles.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isUpdating}
                    onClick={async () => {
                      try {
                        setIsUpdating(true);
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) {
                          toast.error('Authentication required');
                          return;
                        }

                        const { error } = await supabase.functions.invoke('inventory-management', {
                          body: {
                            action: 'update_stock',
                            productId: selectedProduct.id,
                            newStock: selectedProduct.stock,
                            lowStockThreshold: selectedProduct.low_stock_threshold,
                            notes: selectedProduct.notes
                          },
                          headers: {
                            Authorization: `Bearer ${session.access_token}`
                          }
                        });

                        if (error) throw error;
                          
                        toast.success('Inventory updated successfully');
                        setSelectedProduct(null);
                      } catch (error) {
                        console.error('Error updating inventory:', error);
                        toast.error('Failed to update inventory');
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      'Save Changes'
                    )}
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
