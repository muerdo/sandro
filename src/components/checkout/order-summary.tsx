"use client";

import { CartItem } from "@/contexts/cart-context";
import { useEffect, useState } from "react";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
}

export default function OrderSummary({ items, total }: OrderSummaryProps) {
  const [localItems, setLocalItems] = useState<CartItem[]>([]);
  const [localTotal, setLocalTotal] = useState(0);

  // Verificação de segurança para os props
  useEffect(() => {
    if (items && items.length > 0) {
      setLocalItems(items);
      setLocalTotal(total);
    } else {
      // Fallback para o localStorage caso os props venham vazios
      const savedCart = typeof window !== 'undefined' ? localStorage.getItem("cart") : null;
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setLocalItems(parsedCart);
            setLocalTotal(parsedCart.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ));
          }
        } catch (error) {
          console.error("Erro ao ler carrinho do localStorage:", error);
        }
      }
    }
  }, [items, total]);

  if (localItems.length === 0) {
    return (
      <div className="bg-card p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Seu carrinho está vazio</p>
          <p className="text-sm mt-2">Adicione produtos para continuar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {localItems.map((item) => (
          <div key={`${item.id}-${item.quantity}`} className="flex gap-4">
            <img
              src={item.image || '/placeholder-product.jpg'}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
              }}
            />
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                Quantidade: {item.quantity}
              </p>
              <p className="text-sm">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t mt-4 pt-4">
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(localTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}