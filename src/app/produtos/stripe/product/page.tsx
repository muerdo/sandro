"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, X, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useProductCustomization } from "@/hooks/useProductCustomization";
import ProductImages from "@/components/products/product-images";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Product, CustomizationOption } from "@/types/product";

export default function StripeProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBulkOrder, setIsBulkOrder] = useState(false);
  const [selectedBulkPrice, setSelectedBulkPrice] = useState<{
    min_quantity: number;
    price: number;
    description?: string;
  } | null>(null);
  const [orderNotes, setOrderNotes] = useState(""); // Estado para a descrição personalizada do pedido
  // Removido o estado de histórico de estoque que não está sendo usado

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
        if (!session) {
          throw new Error('No authentication session');
        }

        const { data, error } = await supabase.functions.invoke('get-stripe-product', {
          body: {
            productId,
            sessionToken: session.access_token
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;

        if (!data || !data.id) {
          throw new Error('Produto não encontrado');
        }

        // Log raw response for debugging
        console.log('Raw Stripe product response:', data);

        // Get all active prices
        const activePrices = data.prices?.filter((price: any) => price.active) || [];

        // Find default price or lowest price
        const defaultPrice = activePrices.find((price: any) => price.metadata?.default) ||
                           activePrices.reduce((lowest: any, current: any) => {
                             if (!lowest || current.unit_amount < lowest.unit_amount) {
                               return current;
                             }
                             return lowest;
                           }, null);

        if (!defaultPrice?.unit_amount) {
          throw new Error('No valid price found for product');
        }

        // Processar preços em lote, se disponíveis
        const bulkPricing: Array<{
          min_quantity: number;
          price: number;
          description?: string;
        }> = [];

        // Verificar se há preços em lote nos metadados
        if (data.metadata?.bulk_pricing) {
          try {
            const parsedBulkPricing = JSON.parse(data.metadata.bulk_pricing);
            if (Array.isArray(parsedBulkPricing)) {
              bulkPricing.push(...parsedBulkPricing);
            }
          } catch (e) {
            console.error('Error parsing bulk pricing metadata:', e);
          }
        }

        // Verificar se há preços em lote nos preços do Stripe
        if (Array.isArray(data.prices)) {
          const bulkPrices = data.prices
            .filter((price: any) => price.active && price.metadata?.min_quantity)
            .map((price: any) => ({
              min_quantity: parseInt(price.metadata.min_quantity),
              price: price.unit_amount / 100,
              description: price.metadata.description || `Lote de ${price.metadata.min_quantity} unidades`
            }));

          if (bulkPrices.length > 0) {
            // Adicionar apenas preços em lote que ainda não existem
            bulkPrices.forEach((bulkPrice: any) => {
              if (!bulkPricing.some(bp => bp.min_quantity === bulkPrice.min_quantity)) {
                bulkPricing.push(bulkPrice);
              }
            });
          }
        }

        // Calcular o preço base do produto
        const basePrice = (() => {
          const activePrices = data.prices?.filter((price: any) => price.active) || [];
          const defaultPrice = activePrices.find((price: any) => price.metadata?.default) ||
                             activePrices.reduce((lowest: any, current: any) => {
                               if (!lowest || current.unit_amount < lowest.unit_amount) {
                                 return current;
                               }
                               return lowest;
                             }, null);

          if (!defaultPrice?.unit_amount) {
            console.error(`No valid price found for product ${data.id}`);
            return 0;
          }

          return defaultPrice.unit_amount / 100;
        })();

        // Garantir que sempre haja opções de compra em lote
        // Verificar se já existe um preço para lote de 100 unidades
        const has100UnitOption = bulkPricing.some(bp => bp.min_quantity === 100);
        if (!has100UnitOption) {
          // Adicionar desconto de 10% para compras em lote de 100 unidades
          bulkPricing.push({
            min_quantity: 100,
            price: basePrice * 0.9, // 10% de desconto
            description: 'Lote de 100 unidades (10% de desconto)'
          });
        }

        // Verificar se já existe um preço para lote de 500 unidades
        const has500UnitOption = bulkPricing.some(bp => bp.min_quantity === 500);
        if (!has500UnitOption) {
          // Adicionar desconto de 15% para compras em lote de 500 unidades
          bulkPricing.push({
            min_quantity: 500,
            price: basePrice * 0.85, // 15% de desconto
            description: 'Lote de 500 unidades (15% de desconto)'
          });
        }

        // Verificar se já existe um preço para lote de 1000 unidades
        const has1000UnitOption = bulkPricing.some(bp => bp.min_quantity === 1000);
        if (!has1000UnitOption) {
          // Adicionar desconto de 20% para compras em lote de 1000 unidades
          bulkPricing.push({
            min_quantity: 1000,
            price: basePrice * 0.8, // 20% de desconto
            description: 'Lote de 1000 unidades (20% de desconto)'
          });
        }

        // Ordenar preços em lote por quantidade mínima
        bulkPricing.sort((a, b) => a.min_quantity - b.min_quantity);

        const transformedProduct: Product = {
          id: `stripe-${data.id}`,
          name: data.name || 'Produto',
          description: data.description || 'Sem descrição disponível',
          price: (() => {
            // Primeiro, verifica se há um preço definido nos metadados
            if (data.metadata?.price && !isNaN(parseFloat(data.metadata.price))) {
              console.log(`Preço encontrado nos metadados: ${data.metadata.price}`);
              return parseFloat(data.metadata.price);
            }

            // Se não houver, busca nos preços do Stripe
            const activePrices = data.prices?.filter((price: any) => price.active) || [];
            console.log('Preços ativos encontrados:', activePrices);

            if (activePrices.length === 0) {
              // Se não houver preços ativos, definir um preço padrão
              console.log('Nenhum preço ativo encontrado, definindo preço padrão');
              return 99.90; // Preço padrão se não houver preços
            }

            // Procura por um preço marcado como padrão nos metadados
            const defaultPrice = activePrices.find((price: any) =>
              price.metadata?.default === 'true' || price.metadata?.default === true
            );

            if (defaultPrice) {
              console.log(`Preço padrão encontrado: ${defaultPrice.unit_amount / 100}`);
              return defaultPrice.unit_amount / 100;
            }

            // Se não houver preço padrão, pega o primeiro preço ativo
            const firstPrice = activePrices[0];
            if (firstPrice && firstPrice.unit_amount) {
              console.log(`Usando primeiro preço ativo: ${firstPrice.unit_amount / 100}`);
              return firstPrice.unit_amount / 100;
            }

            console.error(`Nenhum preço válido encontrado para o produto ${data.id}, usando preço padrão`);
            return 99.90; // Preço padrão se nenhum preço válido for encontrado
          })(),
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
            JSON.parse(data.metadata.customization) : {
              // Opções de personalização padrão se não houver nos metadados
              sizes: ['P', 'M', 'G', 'GG'],
              colors: ['Preto', 'Branco', 'Azul', 'Vermelho'],
              options: [
                { name: 'Material', values: ['Algodão', 'Poliéster', 'Misto'] },
                { name: 'Estampa', values: ['Lisa', 'Estampada', 'Personalizada'] }
              ]
            },
          stock: data.metadata?.stock ? parseInt(data.metadata.stock) : 999,
          status: 'active',
          stripeId: data.id,
          low_stock_threshold: data.metadata?.low_stock_threshold ?
            parseInt(data.metadata.low_stock_threshold) : 10,
          bulk_pricing: bulkPricing
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

  // Calcular o preço atual com base na quantidade e opção de lote selecionada
  const calculateCurrentPrice = () => {
    if (!product) return 0;

    if (isBulkOrder && selectedBulkPrice) {
      return selectedBulkPrice.price;
    }

    // Verificar se a quantidade atual se qualifica para algum preço em lote
    if (product.bulk_pricing && product.bulk_pricing.length > 0) {
      // Encontrar o maior desconto aplicável para a quantidade atual
      const applicableBulkPrice = [...product.bulk_pricing]
        .filter(bp => quantity >= bp.min_quantity)
        .sort((a, b) => b.min_quantity - a.min_quantity)[0];

      if (applicableBulkPrice) {
        return applicableBulkPrice.price;
      }
    }

    return product.price;
  };

  // Calcular o subtotal
  const calculateSubtotal = () => {
    const currentPrice = calculateCurrentPrice();
    return currentPrice * quantity;
  };

  // Verificar se a quantidade atual se qualifica para algum preço em lote
  useEffect(() => {
    if (!product || !product.bulk_pricing) return;

    const applicableBulkPrice = [...product.bulk_pricing]
      .filter(bp => quantity >= bp.min_quantity)
      .sort((a, b) => b.min_quantity - a.min_quantity)[0];

    if (applicableBulkPrice) {
      setSelectedBulkPrice(applicableBulkPrice);
      setIsBulkOrder(true);
    } else {
      setSelectedBulkPrice(null);
      setIsBulkOrder(false);
    }
  }, [quantity, product]);

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

    // Determinar o preço com base na quantidade (preço normal ou preço em lote)
    const currentPrice = calculateCurrentPrice();

    // Adicionar informação de lote ao nome do produto, se aplicável
    let productName = product.name;
    if (isBulkOrder && selectedBulkPrice) {
      productName += ` - ${selectedBulkPrice.description || `Lote de ${selectedBulkPrice.min_quantity}`}`;
    }

    const cartItem = {
      id: `${product.id}-${selectedSize}-${selectedColor}-${isBulkOrder ? 'bulk' : 'single'}`,
      name: `${productName}${customizations ? ` (${customizations})` : ''}`,
      price: currentPrice,
      image: selectedMedia?.url || product.media[0].url,
      quantity,
      customization: null as null,
      notes: orderNotes.trim() || null // Adiciona as notas do pedido, se houver
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

                {/* Opções adicionais de personalização */}
                {product.customization.options && product.customization.options.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium mb-3">Opções Adicionais</h3>
                    {product.customization.options.map((option, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="font-medium">{option.name}</h4>
                        <div className="flex flex-wrap gap-2">
                          {option.values.map((value, valueIndex) => (
                            <motion.button
                              key={valueIndex}
                              onClick={() => {
                                // Aqui você pode adicionar lógica para selecionar esta opção
                                toast.success(`${option.name}: ${value} selecionado`);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-3 py-1 rounded-lg border border-input hover:border-primary text-sm"
                            >
                              {value}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
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
              {/* Opções de compra em lote */}
              {product.bulk_pricing && product.bulk_pricing.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Opções de Compra em Lote</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {product.bulk_pricing.map((bulkPrice) => (
                      <motion.button
                        key={bulkPrice.min_quantity}
                        onClick={() => {
                          setQuantity(bulkPrice.min_quantity);
                          setSelectedBulkPrice(bulkPrice);
                          setIsBulkOrder(true);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 ${selectedBulkPrice?.min_quantity === bulkPrice.min_quantity
                          ? 'border-primary bg-primary/10'
                          : 'border-input hover:border-primary'
                          }`}
                      >
                        <div>
                          <p className="font-medium">{bulkPrice.description || `Lote de ${bulkPrice.min_quantity} unidades`}</p>
                          <p className="text-sm text-muted-foreground">Mínimo: {bulkPrice.min_quantity} unidades</p>
                        </div>
                        <p className="text-lg font-bold text-primary">R$ {bulkPrice.price.toFixed(2)}/un</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Informação de desconto em lote */}
              {isBulkOrder && selectedBulkPrice && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="font-medium text-primary">
                    Preço especial para lote de {selectedBulkPrice.min_quantity}+ unidades:
                    <span className="font-bold"> R$ {selectedBulkPrice.price.toFixed(2)}/un</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Economia de {((1 - selectedBulkPrice.price / product.price) * 100).toFixed(0)}% em relação ao preço unitário
                  </p>
                </div>
              )}

              {/* Campo para descrição personalizada do pedido */}
              <div className="space-y-2">
                <label htmlFor="orderNotes" className="block text-sm font-medium">
                  Instruções especiais para o pedido (opcional)
                </label>
                <textarea
                  id="orderNotes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Adicione instruções especiais para o seu pedido, como detalhes de personalização, preferências de entrega, etc."
                  className="w-full p-3 rounded-lg border bg-background min-h-[100px] text-sm"
                />
              </div>

              <div className="flex flex-col gap-4 py-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Subtotal:</p>
                    <p className="text-2xl font-bold">
                      R$ {calculateSubtotal().toFixed(2)}
                    </p>
                    {isBulkOrder && selectedBulkPrice && (
                      <p className="text-sm text-primary">
                        R$ {selectedBulkPrice.price.toFixed(2)} x {quantity} unidades
                      </p>
                    )}
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

                {/* Botões de compra rápida em lote */}
                {product.bulk_pricing && product.bulk_pricing.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Compra rápida em lote:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {product.bulk_pricing.map((bulkPrice) => (
                        <motion.button
                          key={`quick-${bulkPrice.min_quantity}`}
                          onClick={() => {
                            setQuantity(bulkPrice.min_quantity);
                            setSelectedBulkPrice(bulkPrice);
                            setIsBulkOrder(true);
                            handleAddToCart();
                            toast.success(`Lote de ${bulkPrice.min_quantity} unidades adicionado ao carrinho`);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-secondary text-secondary-foreground p-2 rounded-lg text-sm font-medium"
                        >
                          {bulkPrice.min_quantity} unidades
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
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
                    <p className="text-sm text-muted-foreground">Histórico de estoque não disponível para produtos da Stripe.</p>
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
