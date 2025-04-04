"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Plus, Minus, Trash2, Package } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";
import { useVisibility } from "@/contexts/visibility-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CartSummary() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();

  // Tenta usar o contexto de visibilidade, mas não falha se não estiver disponível
  let isCartButtonVisible = true; // Valor padrão
  try {
    const visibilityContext = useVisibility();
    isCartButtonVisible = visibilityContext.isCartButtonVisible;
  } catch (error) {
    console.warn("VisibilityContext não está disponível, usando valor padrão");
  }

  return (
    <>
      {/* Botão do carrinho (visível apenas se isCartButtonVisible for true) */}
      {isCartButtonVisible && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-4 rounded-full shadow-lg flex items-center gap-2"
        >
          <ShoppingCart className="w-6 h-6" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
              {itemCount}
            </span>
          )}
        </motion.button>
      )}


      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-card shadow-xl z-50 p-3 sm:p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Carrinho</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-4" />
                  <p>Seu carrinho está vazio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex gap-4 bg-background p-4 rounded-lg"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-muted-foreground">
                            R$ {item.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className={cn(
                                "p-1 rounded-md transition-colors",
                                item.quantity === 1
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "hover:bg-secondary"
                              )}
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-4 h-4" />
                              ) : (
                                <Minus className="w-4 h-4" />
                              )}
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-md hover:bg-secondary transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-auto p-1 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Botões para compra em lote */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                updateQuantity(item.id, 100);
                              }}
                              className="text-xs px-2 py-1 rounded bg-primary/10 text-primary flex items-center gap-1 hover:bg-primary/20 transition-colors"
                            >
                              <Package className="w-3 h-3" />
                              Lote 100 un.
                            </button>
                            <button
                              onClick={() => {
                                updateQuantity(item.id, 500);
                              }}
                              className="text-xs px-2 py-1 rounded bg-primary/10 text-primary flex items-center gap-1 hover:bg-primary/20 transition-colors"
                            >
                              <Package className="w-3 h-3" />
                              Lote 500 un.
                            </button>
                            <button
                              onClick={() => {
                                updateQuantity(item.id, 1000);
                              }}
                              className="text-xs px-2 py-1 rounded bg-primary/10 text-primary flex items-center gap-1 hover:bg-primary/20 transition-colors"
                            >
                              <Package className="w-3 h-3" />
                              Lote 1000 un.
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold mb-6">
                      <span>Total</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="space-y-3">
                      <motion.button
                        onClick={() => {
                          setIsOpen(false);
                          // Usar router.push em vez de window.location para evitar recarregar a página
                          // e potencialmente perder o estado do carrinho
                          router.push('/checkout');
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
                      >
                        Finalizar Compra
                      </motion.button>

                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
                            removeItem(items.map(item => item.id));
                            toast.success('Carrinho limpo com sucesso!');
                          }
                        }}
                        className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Limpar carrinho
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}