"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import AuthDialog from "@/components/auth/auth-dialog";

export type CartItem = {
  customization: null | any;
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string | null; // Notas ou instruções especiais para o pedido
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  showAuthDialog: boolean;
  setShowAuthDialog: (show: boolean) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user, onAuthStateChange } = useAuth();

  // Função para obter a chave do carrinho baseada no usuário
  const getCartKey = (userId?: string | null) => {
    return userId ? `cart_${userId}` : "cart_guest";
  };

  // Função para limpar dados antigos de carrinho
  const cleanupOldCartData = () => {
    try {
      // Remove o carrinho antigo que não usava o prefixo
      localStorage.removeItem("cart");

      // Limpa todos os carrinhos de usuários anteriores
      // Percorre todos os itens do localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Se for um carrinho (começa com 'cart_')
        if (key && key.startsWith('cart_') && key !== getCartKey(user?.id) && key !== getCartKey(null)) {
          console.log(`Removendo carrinho antigo: ${key}`);
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error("Erro ao limpar dados antigos de carrinho:", error);
    }
  };

  // Carrega o carrinho do localStorage com base no usuário atual
  useEffect(() => {
    // Limpa dados antigos de carrinho para evitar problemas
    cleanupOldCartData();

    const loadCart = () => {
      try {
        // Se o usuário acabou de fazer login, tentamos mesclar os carrinhos
        if (user?.id) {
          const userCartKey = getCartKey(user.id);
          const guestCartKey = getCartKey(null);

          const savedUserCart = localStorage.getItem(userCartKey);
          const savedGuestCart = localStorage.getItem(guestCartKey);

          // Se existe um carrinho de usuário, usamos ele
          if (savedUserCart) {
            const parsedCart = JSON.parse(savedUserCart);
            if (Array.isArray(parsedCart)) {
              setItems(parsedCart);
            }
          }
          // Se não existe carrinho de usuário mas existe um carrinho de convidado
          else if (savedGuestCart) {
            const parsedCart = JSON.parse(savedGuestCart);
            if (Array.isArray(parsedCart)) {
              setItems(parsedCart);
              // Salvamos o carrinho de convidado como carrinho do usuário
              localStorage.setItem(userCartKey, savedGuestCart);
            }
            // Removemos o carrinho de convidado após transferir para o usuário
            localStorage.removeItem(guestCartKey);
          }
        } else {
          // Usuário não está logado, carregamos o carrinho de convidado
          const guestCartKey = getCartKey(null);
          const savedCart = localStorage.getItem(guestCartKey);

          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (Array.isArray(parsedCart)) {
              setItems(parsedCart);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        // Em caso de erro, limpamos todos os carrinhos para evitar problemas
        localStorage.removeItem(getCartKey(user?.id));
        localStorage.removeItem(getCartKey(null));
      } finally {
        setIsInitialized(true);
      }
    };

    // Resetamos o estado de inicialização quando o usuário muda
    setIsInitialized(false);
    loadCart();
  }, [user?.id]); // Recarrega quando o ID do usuário muda (login/logout)

  // Registra um callback para mudanças de estado de autenticação
  useEffect(() => {
    // Função para lidar com mudanças de estado de autenticação
    const handleAuthStateChange = (event: 'SIGNED_IN' | 'SIGNED_OUT', authUser: any) => {
      if (event === 'SIGNED_OUT') {
        // Quando o usuário faz logout, limpa o carrinho do usuário anterior
        try {
          // Limpa o carrinho do usuário que está fazendo logout
          if (authUser?.id) {
            console.log(`Limpando carrinho do usuário ${authUser.id} após logout`);
            const userCartKey = getCartKey(authUser.id);
            localStorage.removeItem(userCartKey);
          }

          // Limpa o carrinho em memória
          setItems([]);

          // Cria um novo carrinho de convidado vazio
          const guestCartKey = getCartKey(null);
          localStorage.setItem(guestCartKey, JSON.stringify([]));

          // Limpa também o carrinho antigo por segurança
          localStorage.removeItem("cart");

          console.log("Carrinho completamente limpo após logout");
        } catch (error) {
          console.error("Erro ao limpar carrinho após logout:", error);
          setItems([]);
          // Limpa todos os carrinhos em caso de erro
          localStorage.removeItem(getCartKey(null));
          localStorage.removeItem("cart");
        }
      }
      // O caso SIGNED_IN já é tratado pelo useEffect que observa user?.id
    };

    // Registra o callback
    const unsubscribe = onAuthStateChange(handleAuthStateChange);

    // Cancela a inscrição quando o componente é desmontado
    return () => {
      unsubscribe();
    };
  }, [onAuthStateChange]);

  // Persiste o carrinho no localStorage sempre que ele muda
  useEffect(() => {
    if (isInitialized) {
      const cartKey = getCartKey(user?.id);
      localStorage.setItem(cartKey, JSON.stringify(items));
    }
  }, [items, isInitialized, user?.id]);

  const addItem = (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id);
      const quantity = newItem.quantity || 1;

      const updatedItems = existingItem
        ? currentItems.map(item =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...currentItems, { ...newItem, quantity }];

      return updatedItems;
    });
  };

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);

    // Limpa todos os carrinhos para evitar problemas de cache
    if (user?.id) {
      // Se há um usuário logado, limpa o carrinho dele
      const userCartKey = getCartKey(user.id);
      localStorage.removeItem(userCartKey);
    }

    // Limpa também o carrinho de convidado
    const guestCartKey = getCartKey(null);
    localStorage.removeItem(guestCartKey);

    // Limpa o carrinho antigo (sem prefixo) por segurança
    localStorage.removeItem("cart");

    console.log("Carrinho completamente limpo");
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemCount = items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        showAuthDialog,
        setShowAuthDialog
      }}
    >
      {children}
      {showAuthDialog && (
        <div className="fixed inset-0 z-[100]">
          <AuthDialog
            isOpen={showAuthDialog}
            onClose={() => setShowAuthDialog(false)}
          />
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}