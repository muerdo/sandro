"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { 
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  X,
  Save,
  Package
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  features: string[];
  customization: any;
};

export default function ProductsManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    images: [],
    features: [],
    customization: {}
  });

  // Verificar se o usuário é administrador
  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    const checkAdminStatus = async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile?.role || profile.role !== 'admin') {
        router.push("/");
        return;
      }

      setIsAdmin(true);
    };

    checkAdminStatus();
  }, [user]);

  // Buscar produtos do banco de dados
  useEffect(() => {
    if (!isAdmin) return;

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*");

      if (error) {
        console.error("Erro ao buscar produtos:", error);
        return;
      }

      setProducts(data || []);
    };

    fetchProducts();
  }, [isAdmin]);

  // Criar um novo produto
  const handleCreateProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .insert([newProduct])
      .select();

    if (error) {
      console.error("Erro ao criar produto:", error);
      return;
    }

    setProducts([...products, data[0]]);
    setIsCreating(false);
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      images: [],
      features: [],
      customization: {}
    });
  };

  // Editar um produto existente
  const handleEditProduct = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .update(editForm)
      .eq("id", id);

    if (error) {
      console.error("Erro ao editar produto:", error);
      return;
    }

    setProducts(products.map(product => 
      product.id === id ? { ...product, ...editForm } : product
    ));
    setIsEditing(null);
    setEditForm({});
  };

  // Excluir um produto
  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir produto:", error);
      return;
    }

    setProducts(products.filter(product => product.id !== id));
  };

  // Se o usuário não for administrador, exibir mensagem de acesso negado
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Gerenciamento de Produtos</h1>

        {/* Botão para adicionar novo produto */}
        <motion.button
          onClick={() => setIsCreating(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar Produto
        </motion.button>

        {/* Modal para criar novo produto */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card p-6 rounded-xl shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Novo Produto</h2>
                <button onClick={() => setIsCreating(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-3 rounded-lg border border-input bg-background"
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full p-3 rounded-lg border border-input bg-background"
                />
                <input
                  type="number"
                  placeholder="Preço"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                  className="w-full p-3 rounded-lg border border-input bg-background"
                />
                <input
                  type="text"
                  placeholder="Categoria"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full p-3 rounded-lg border border-input bg-background"
                />
                <input
                  type="number"
                  placeholder="Estoque"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                  className="w-full p-3 rounded-lg border border-input bg-background"
                />
                <motion.button
                  onClick={handleCreateProduct}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
                >
                  <Save className="w-5 h-5 inline-block mr-2" />
                  Salvar
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de produtos */}
        <div className="space-y-6">
          {products.map((product) => (
            <div key={product.id} className="bg-card p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{product.name}</h2>
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => {
                      setIsEditing(product.id);
                      setEditForm(product);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-secondary text-secondary-foreground"
                  >
                    <Pencil className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={() => handleDeleteProduct(product.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-destructive text-destructive-foreground"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              <p className="text-muted-foreground mt-2">{product.description}</p>
              <p className="mt-4 font-semibold">R$ {product.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}