"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Package,
  Image as ImageIcon,
  Tag,
  ListPlus
} from "lucide-react";
import { toast } from "sonner";

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
  created_at: string;
  updated_at: string;
};

type Category = {
  id: string;
  name: string;
  description: string;
};

export default function ProductsManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
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
  const [loading, setLoading] = useState({
    products: true,
    categories: true,
    action: false
  });

  useEffect(() => {
    checkAdminStatus();
    if (isAdmin) {
      fetchProducts();
      fetchCategories();
      const productsSubscription = subscribeToProducts();
      const categoriesSubscription = subscribeToCategories();

      return () => {
        productsSubscription?.unsubscribe();
        categoriesSubscription?.unsubscribe();
      };
    }
  }, [user, isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      router.push('/');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsAdmin(true);
  };

  const subscribeToProducts = () => {
    return supabase
      .channel('products')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products' 
      }, () => {
        fetchProducts();
      })
      .subscribe();
  };

  const subscribeToCategories = () => {
    return supabase
      .channel('categories')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories'
      }, () => {
        fetchCategories();
      })
      .subscribe();
  };

  const fetchCategories = async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }));
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const handleAddCategory = async () => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const { error } = await supabase
        .from('categories')
        .insert([newCategory]);

      if (error) throw error;

      setIsAddingCategory(false);
      setNewCategory({ name: '', description: '' });
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const handleEdit = (product: Product) => {
    setIsEditing(product.id);
    setEditForm(product);
  };

  const handleSave = async () => {
    if (!isEditing) return;

    const { error } = await supabase
      .from('products')
      .update(editForm)
      .eq('id', isEditing);

    if (error) {
      console.error('Error updating product:', error);
      return;
    }

    setIsEditing(null);
    setEditForm({});
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return;
    }
  };

  const handleCreate = async () => {
    const { error } = await supabase
      .from('products')
      .insert([newProduct]);

    if (error) {
      console.error('Error creating product:', error);
      return;
    }

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Products Management</h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreating(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </motion.button>
        </div>

        {/* Product List */}
        <div className="grid grid-cols-1 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 rounded-xl shadow-lg"
            >
              {isEditing === product.id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-xl font-semibold bg-background px-3 py-1 rounded-lg border"
                    />
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="p-2 bg-primary text-primary-foreground rounded-lg"
                      >
                        <Save className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(null)}
                        className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <input
                        type="number"
                        value={editForm.price || 0}
                        onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                        className="w-full bg-background px-3 py-1 rounded-lg border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock</label>
                      <input
                        type="number"
                        value={editForm.stock || 0}
                        onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) })}
                        className="w-full bg-background px-3 py-1 rounded-lg border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-background px-3 py-1 rounded-lg border"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{product.name}</h3>
                      <p className="text-muted-foreground">
                        Stock: {product.stock} | Price: R$ {product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(product)}
                      className="p-2 bg-primary/10 text-primary rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-destructive/10 text-destructive rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Create Product Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 rounded-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create New Product</h2>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-background px-3 py-2 rounded-lg border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                      className="w-full bg-background px-3 py-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                      className="w-full bg-background px-3 py-2 rounded-lg border"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-background px-3 py-2 rounded-lg border"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-background px-3 py-2 rounded-lg border"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                >
                  Create Product
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
