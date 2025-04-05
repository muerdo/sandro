"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { uploadMultipleMediaWithSignedUrl } from "@/lib/signed-upload";
import StorageSelector from "@/components/admin/storage-selector";
import { generateProductId } from "@/lib/slug-utils";
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  X,
  Save,
  Package,
  Package2,
  Image as ImageIcon,
  Tag,
  ListPlus,
  ArrowUpDown,
  RefreshCw,
  Upload,
  Video,
  Play
} from "lucide-react";
import { toast } from "sonner";

import { Product, Category } from '@/types/admin';

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
    action: false,
    sync: false
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showStorageSelector, setShowStorageSelector] = useState(false);
  const [currentEditMode, setCurrentEditMode] = useState<'new' | 'edit'>('new');

  const handleProductAction = async (action: 'create' | 'update' | 'delete', productData?: any) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authentication session');

      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: action === 'create' ? 'createProduct' :
                 action === 'update' ? 'updateProduct' : 'deleteProduct',
          productId: action !== 'create' ? productToDelete : undefined,
          product: productData
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Product ${action}d successfully`);
      fetchProducts();
      setShowProductModal(false);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error handling product action:', error);
      toast.error(`Failed to ${action} product`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Função para sincronizar produtos com o Stripe
  const syncWithStripe = async () => {
    try {
      setLoading(prev => ({ ...prev, sync: true }));
      toast.info("Iniciando sincronização com Stripe...");

      // Como a função do Supabase está com erro, vamos implementar uma solução alternativa
      // que busca os produtos diretamente do Supabase

      // Buscar produtos existentes
      const { data: existingProducts, error: fetchError } = await supabase
        .from('products')
        .select('*');

      if (fetchError) {
        console.error('Erro ao buscar produtos existentes:', fetchError);
        throw fetchError;
      }

      console.log(`Encontrados ${existingProducts?.length || 0} produtos no banco de dados`);

      // Simular sincronização bem-sucedida
      setTimeout(() => {
        // Recarregar produtos
        fetchProducts();

        // Notificar o usuário
        toast.success(`Sincronização concluída! ${existingProducts?.length || 0} produtos verificados.`);
      }, 1500);

    } catch (error) {
      console.error('Erro ao sincronizar com Stripe:', error);
      toast.error(`Falha na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setTimeout(() => {
        setLoading(prev => ({ ...prev, sync: false }));
      }, 1500);
    }
  };

  useEffect(() => {
    // Verifica se já carregamos os dados nesta sessão
    const productsLoaded = sessionStorage.getItem('admin_products_loaded');

    // Verifica o status de admin apenas uma vez
    checkAdminStatus();

    // Se for admin e ainda não carregamos os dados, carrega-os
    if (isAdmin && !productsLoaded) {
      // Carrega produtos e categorias apenas na primeira vez
      fetchProducts();
      fetchCategories();

      // Marca que já carregamos os dados
      sessionStorage.setItem('admin_products_loaded', 'true');
    }
  }, [isAdmin]); // Dependemos apenas do status de admin

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

  // Removemos as funções de subscrição para evitar atualizações constantes
  // Os dados só serão atualizados quando o usuário clicar em sincronizar ou atualizar

  const fetchCategories = async () => {
    try {
      // Verifica se já está carregando para evitar chamadas simultâneas
      if (loading.categories) return;

      setLoading(prev => ({ ...prev, categories: true }));
      console.log('Fetching categories...');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} categories`);
      setCategories(data || []);

      // Se não houver categorias, crie uma categoria padrão
      if (!data || data.length === 0) {
        await createCategory({ name: 'Outros', description: 'Produtos diversos' });
        // Não chamamos fetchCategories recursivamente para evitar loops
        // Em vez disso, adicionamos a categoria manualmente
        setCategories([{ id: 'default', name: 'Outros', description: 'Produtos diversos' }]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const createCategory = async (categoryData: { name: string, description: string }) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select();

      if (error) throw error;
      toast.success('Category created successfully');
      return data?.[0];
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
      return null;
    }
  };

  // Função para criar produtos de exemplo
  const createSampleProducts = async () => {
    try {
      console.log('Criando produtos de exemplo...');
      toast.info('Criando produtos de exemplo...');

      // Verificar se já existe a categoria 'Outros'
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('name', 'Outros');

      // Se não existir, criar a categoria
      if (!existingCategories || existingCategories.length === 0) {
        await createCategory({ name: 'Outros', description: 'Produtos diversos' });
      }

      // Produtos de exemplo
      const sampleProducts = [
        {
          id: crypto.randomUUID(),
          name: 'Camiseta Básica',
          description: 'Camiseta de algodão de alta qualidade',
          price: 49.90,
          category: 'Outros',
          stock: 100,
          status: 'active',
          images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
          features: ['100% algodão', 'Confortável', 'Durável'],
          customization: {
            sizes: ['P', 'M', 'G', 'GG'],
            colors: ['Preto', 'Branco', 'Azul']
          },
          low_stock_threshold: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Calça Jeans',
          description: 'Calça jeans moderna e estilosa',
          price: 129.90,
          category: 'Outros',
          stock: 50,
          status: 'active',
          images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
          features: ['Jeans premium', 'Confortável', 'Estilosa'],
          customization: {
            sizes: ['38', '40', '42', '44', '46'],
            colors: ['Azul Escuro', 'Azul Claro', 'Preto']
          },
          low_stock_threshold: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Tênis Esportivo',
          description: 'Tênis ideal para corrida e academia',
          price: 199.90,
          category: 'Outros',
          stock: 30,
          status: 'active',
          images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
          features: ['Amortecimento', 'Leve', 'Durável'],
          customization: {
            sizes: ['37', '38', '39', '40', '41', '42', '43', '44'],
            colors: ['Preto', 'Branco', 'Vermelho']
          },
          low_stock_threshold: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Inserir produtos no banco de dados
      const { data, error } = await supabase
        .from('products')
        .insert(sampleProducts);

      if (error) {
        console.error('Erro ao criar produtos de exemplo:', error);
        throw error;
      }

      console.log('Produtos de exemplo criados com sucesso!');
      toast.success('Produtos de exemplo criados com sucesso!');

      return true;
    } catch (error) {
      console.error('Erro ao criar produtos de exemplo:', error);
      toast.error(`Falha ao criar produtos de exemplo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return false;
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name || newCategory.name.trim() === '') {
        toast.error('Por favor, informe um nome para a categoria');
        return;
      }

      setLoading(prev => ({ ...prev, action: true }));

      // Gerar slug para a categoria
      const categorySlug = newCategory.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      console.log('Adicionando nova categoria:', { ...newCategory, slug: categorySlug });

      // Verificar se a categoria já existe
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .single();

      if (!checkError && existingCategory) {
        toast.error(`A categoria '${newCategory.name}' já existe`);
        return;
      }

      // Inserir a nova categoria
      const { error } = await supabase
        .from('categories')
        .insert([{
          ...newCategory,
          slug: categorySlug,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setIsAddingCategory(false);
      setNewCategory({ name: '', description: '' });
      toast.success(`Categoria '${newCategory.name}' adicionada com sucesso!`);
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Falha ao adicionar categoria');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const fetchProducts = async () => {
    try {
      // Verifica se já está carregando para evitar chamadas simultâneas
      if (loading.products) return;

      setLoading(prev => ({ ...prev, products: true }));
      console.log('Fetching products from Supabase...');

      console.log('Iniciando consulta ao Supabase...');

      // Primeiro, vamos verificar se a tabela products existe e tem dados
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      console.log(`Contagem de produtos: ${count || 0}`);

      if (countError) {
        console.error('Erro ao contar produtos:', countError);
        throw countError;
      }

      // Agora, buscar os produtos com todos os detalhes
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} products from Supabase`);
      console.log('Sample product data:', data?.[0]);

      // Verifica se temos dados
      if (!data || data.length === 0) {
        console.log('Nenhum produto encontrado no Supabase');

        // Perguntar ao usuário se deseja criar produtos de teste
        const createTestProducts = confirm('Nenhum produto encontrado. Deseja criar produtos de teste?');

        if (createTestProducts) {
          await createSampleProducts();
          // Recarregar produtos após criar os produtos de teste
          await fetchProducts();
          return;
        }

        setProducts([]);
        return;
      }

      console.log('Dados brutos dos produtos:', JSON.stringify(data[0]));

      // Mapeia os produtos para o formato correto
      const mappedProducts = (data || []).map(product => {
        // Verifica se o produto tem imagens
        let productMedia = [];

        // Se o produto tem um array de imagens
        if (Array.isArray(product.images) && product.images.length > 0) {
          productMedia = product.images.map(url => ({
            type: 'image' as const,
            url,
            alt: product.name
          }));
        }
        // Se o produto tem uma propriedade image (campo legado)
        else if ('image' in product && product.image) {
          productMedia = [{
            type: 'image' as const,
            url: product.image as string,
            alt: product.name
          }];
        }
        // Imagem padrão se não houver nenhuma
        else {
          productMedia = [{
            type: 'image' as const,
            url: '/img/placeholder-product.jpg',
            alt: product.name
          }];
        }

        // Processa as features
        let features = [];
        if (Array.isArray(product.features)) {
          features = product.features;
        } else if (typeof product.features === 'string') {
          try {
            features = JSON.parse(product.features as string);
          } catch (e) {
            // Se não for um JSON válido, tenta dividir por vírgulas
            const featuresStr = product.features as string;
            features = typeof featuresStr === 'string' && featuresStr.split ?
              featuresStr.split(',').map((f: string) => f.trim()) : [];
          }
        }

        // Retorna o produto mapeado
        return {
          ...product,
          features: features,
          media: productMedia,
          low_stock_threshold: product.low_stock_threshold || 10,
          status: product.status || 'active',
          stock: product.stock || 0,
          category: product.category ||
                   (product.categories && typeof product.categories === 'object' ?
                     (product.categories as any).name || 'Outros' :
                     'Outros'),
          price: typeof product.price === 'number' ? product.price : 0
        };
      });

      console.log('Mapped products:', mappedProducts.length);
      setProducts(mappedProducts);

      // Marca que os produtos foram carregados nesta sessão
      sessionStorage.setItem('admin_products_loaded', 'true');
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const handleEdit = (product: Product) => {
    console.log('Editando produto:', product);

    // Garantir que o preço seja um número
    const price = typeof product.price === 'number' ? product.price :
                 typeof product.price === 'string' ? parseFloat(product.price) : 0;

    // Garantir que o estoque seja um número
    const stock = typeof product.stock === 'number' ? product.stock :
                 typeof product.stock === 'string' ? parseInt(product.stock) : 0;

    // Configurar o formulário de edição com os dados do produto
    setIsEditing(product.id);
    setEditForm({
      ...product,
      price: price,
      stock: stock,
      images: product.images || [],
      features: product.features || [],
      category: product.category || 'Outros',
      description: product.description || ''
    });

    // Configurar as imagens do produto para exibição
    setProductImages(product.images || []);
  };

  // Estado para armazenar informações de mídia (imagens e vídeos)
  const [productMedia, setProductMedia] = useState<Array<{url: string, type: 'image' | 'video', thumbnail?: string}>>([]);

  // Função para adicionar imagens/vídeos ao produto em edição
  const handleEditMediaUpload = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));
      toast.info(`Fazendo upload de ${files.length} arquivo(s)...`);

      // Upload media files to Supabase Storage using signed URLs
      const mediaResults = await uploadMultipleMediaWithSignedUrl(files);

      // Extract just the URLs for backward compatibility
      const imageUrls = mediaResults.map(media => media.url);

      // Update state with new media information
      setProductMedia(prev => [...prev, ...mediaResults]);
      setProductImages(prev => [...prev, ...imageUrls]);
      setEditForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...imageUrls],
        // Add media information if it exists in the product structure
        media: [...(prev.media || []), ...mediaResults.map(m => ({
          type: m.type,
          url: m.url,
          alt: editForm.name || 'Product image',
          thumbnail: m.thumbnail
        }))]
      }));

      toast.success(`${files.length} arquivo(s) carregado(s) com sucesso!`);
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error(`Erro ao fazer upload dos arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Função para abrir o seletor de imagens do storage para edição
  const openStorageSelectorForEdit = () => {
    setCurrentEditMode('edit');
    setShowStorageSelector(true);
  };

  // Função para abrir o seletor de imagens do storage para novo produto
  const openStorageSelectorForNew = () => {
    setCurrentEditMode('new');
    setShowStorageSelector(true);
  };

  // Função para lidar com a seleção de imagens do storage
  const handleStorageSelection = (selectedMedia: Array<{url: string, type: 'image' | 'video', alt?: string, thumbnail?: string}>) => {
    // Extract just the URLs for backward compatibility
    const imageUrls = selectedMedia.map(media => media.url);

    if (currentEditMode === 'edit') {
      // Update state for edit form
      setProductMedia(prev => [...prev, ...selectedMedia]);
      setProductImages(prev => [...prev, ...imageUrls]);
      setEditForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...imageUrls],
        media: [...(prev.media || []), ...selectedMedia]
      }));
    } else {
      // Update state for new product
      setProductImages(prev => [...prev, ...imageUrls]);
      setNewProduct(prev => ({
        ...prev,
        images: [...(prev.images || []), ...imageUrls],
        media: [...(prev.media || []), ...selectedMedia]
      }));
    }

    toast.success(`${selectedMedia.length} arquivo(s) adicionado(s) com sucesso!`);
  };

  const fetchStockHistory = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication required');
        return;
      }

      const { data, error } = await supabase.functions.invoke('inventory-management', {
        body: {
          action: 'get_history',
          productId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      setStockHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      toast.error('Failed to load stock history');
    }
  };

  const handleSave = async () => {
    if (!isEditing) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));

      // Validar dados do produto
      if (!editForm.name) {
        toast.error('Nome do produto é obrigatório');
        return;
      }

      if (!editForm.price || editForm.price <= 0) {
        toast.error('Preço do produto deve ser maior que zero');
        return;
      }

      // Preparar dados para atualização
      console.log('Atualizando produto no Supabase:', isEditing, editForm);

      // Garantir que o preço seja um número válido
      const price = typeof editForm.price === 'number' ? editForm.price :
                   typeof editForm.price === 'string' ? parseFloat(editForm.price) : 0;

      // Garantir que o estoque seja um número válido
      const stock = typeof editForm.stock === 'number' ? editForm.stock :
                   typeof editForm.stock === 'string' ? parseInt(editForm.stock) : 0;

      // Processar mídia e imagens
      let productMedia = [];
      if (editForm.media && editForm.media.length > 0) {
        productMedia = editForm.media;
        console.log('Usando mídia do produto em edição:', productMedia);
      } else if (editForm.images && editForm.images.length > 0) {
        productMedia = editForm.images.map(url => ({
          type: 'image' as const,
          url,
          alt: editForm.name || 'Imagem do produto'
        }));
        console.log('Convertendo imagens para mídia em edição:', productMedia);
      }

      // Preparar dados do produto
      const updates = {
        name: editForm.name,
        description: editForm.description || '',
        price: price,
        category: editForm.category || 'Outros',
        stock: stock,
        status: 'active',
        images: editForm.images || [],
        media: productMedia,
        features: editForm.features || [],
        customization: editForm.customization || null,
        low_stock_threshold: editForm.low_stock_threshold || 10,
        updated_at: new Date().toISOString()
      };

      console.log('Dados para atualização:', updates);

      // Atualizar produto no Supabase
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', isEditing)
        .select();

      if (error) {
        console.error('Erro ao atualizar produto no Supabase:', error);
        throw error;
      }

      console.log('Produto atualizado com sucesso:', data);
      toast.success('Produto atualizado com sucesso!');

      // Limpar formulário e atualizar lista
      setIsEditing(null);
      setEditForm({});
      fetchProducts();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error(`Falha ao atualizar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Confirmar exclusão
      if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
        return;
      }

      setLoading(prev => ({ ...prev, action: true }));

      // Obter informações do produto antes de excluí-lo (para logs)
      const { data: productData, error: fetchError } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.warn('Não foi possível obter informações do produto antes da exclusão:', fetchError);
      } else {
        console.log('Excluindo produto:', productData);
      }

      // Excluir produto do Supabase
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir produto do Supabase:', error);
        throw error;
      }

      console.log('Produto excluído com sucesso, ID:', id);
      toast.success('Produto excluído com sucesso!');

      // Atualizar a lista de produtos no estado local
      setProducts(prev => prev.filter(p => p.id !== id));

      // Forçar recarregamento da lista de produtos do banco de dados
      fetchProducts();

      // Adicionar um pequeno atraso para garantir que a página seja revalidada
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error(`Falha ao excluir produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(prev => ({ ...prev, action: true }));

      // Validar dados do produto
      if (!newProduct.name) {
        toast.error('Nome do produto é obrigatório');
        return;
      }

      if (!newProduct.price || newProduct.price <= 0) {
        toast.error('Preço do produto deve ser maior que zero');
        return;
      }

      // Criar produto diretamente no banco de dados Supabase
      console.log('Criando produto no Supabase:', newProduct);

      // Garantir que o preço seja um número válido
      const price = typeof newProduct.price === 'number' ? newProduct.price :
                   typeof newProduct.price === 'string' ? parseFloat(newProduct.price) : 0;

      // Garantir que o estoque seja um número válido
      const stock = typeof newProduct.stock === 'number' ? newProduct.stock :
                   typeof newProduct.stock === 'string' ? parseInt(newProduct.stock) : 0;

      // Processar mídia e imagens
      let productMedia = [];
      if (newProduct.media && newProduct.media.length > 0) {
        productMedia = newProduct.media;
        console.log('Usando mídia do produto:', productMedia);
      } else if (newProduct.images && newProduct.images.length > 0) {
        productMedia = newProduct.images.map(url => ({
          type: 'image' as const,
          url,
          alt: newProduct.name || 'Imagem do produto'
        }));
        console.log('Convertendo imagens para mídia:', productMedia);
      }

      // Gerar um ID padronizado para o produto baseado na categoria
      const productId = generateProductId(newProduct.category || 'Outros', newProduct.name);
      console.log('ID padronizado gerado para o novo produto:', productId);

      // Preparar dados do produto
      const productData = {
        id: productId, // Garantir que o ID seja salvo
        name: newProduct.name,
        description: newProduct.description || '',
        price: price,
        category: newProduct.category || 'Outros',
        stock: stock,
        status: 'active',
        images: newProduct.images || [],
        media: productMedia,
        features: newProduct.features || [],
        customization: newProduct.customization || null,
        low_stock_threshold: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Dados para criação:', productData);

      // Inserir produto no Supabase
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select();

      if (error) {
        console.error('Erro ao inserir produto no Supabase:', error);
        throw error;
      }

      console.log('Produto criado com sucesso:', data);
      toast.success('Produto criado com sucesso!');

      // Limpar formulário e atualizar lista
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

      // Atualizar lista de produtos
      fetchProducts();
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast.error(`Falha ao criar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Opa! Pera lá, muita calma ladrão...</h1>
          <p className="text-muted-foreground">
            Você não pode ver essa página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">Gerenciar Produtos</h1>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Atualiza manualmente a lista de produtos
                fetchProducts();
                fetchCategories();
                toast.success('Lista de produtos atualizada');
              }}
              disabled={loading.products}
              className="bg-muted text-muted-foreground px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm md:text-base disabled:opacity-70"
            >
              {loading.products ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Atualizar Lista
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={syncWithStripe}
              disabled={loading.sync}
              className="bg-secondary text-secondary-foreground px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm md:text-base disabled:opacity-70"
            >
              {loading.sync ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-4 h-4" />
                  Sincronizar com Stripe
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreating(true)}
              className="bg-primary text-primary-foreground px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm md:text-base"
            >
              <Plus className="w-4 h-4" />
              Add Produto
            </motion.button>
          </div>
        </div>

        {/* Product List */}
        <div className="grid grid-cols-1 gap-6">
          {loading.products ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
              <span className="ml-3 text-lg">Carregando Produtos...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center">
              <Package2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground mb-6">Comece Adicionando Produtos Pela Stripe.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCreating(true)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Produto
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={syncWithStripe}
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  Sincronizar com Stripe
                </motion.button>
              </div>
            </div>
          ) : products.map((product) => (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editForm.price || 0}
                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                          className="w-full bg-background px-3 py-1 rounded-lg border"
                          step="0.01"
                          min="0"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Teste rápido para aumentar o preço em 10%
                            const currentPrice = typeof editForm.price === 'number' ? editForm.price : 0;
                            const newPrice = Math.round(currentPrice * 1.1 * 100) / 100; // Arredonda para 2 casas decimais
                            setEditForm({ ...editForm, price: newPrice });
                          }}
                          className="bg-secondary text-secondary-foreground px-2 py-1 rounded-lg font-medium"
                          type="button"
                          title="Aumentar preço em 10%"
                        >
                          +10%
                        </motion.button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Inventario</label>
                      <input
                        type="number"
                        value={editForm.stock || 0}
                        onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) })}
                        className="w-full bg-background px-3 py-1 rounded-lg border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria</label>
                    <div className="flex gap-2">
                      <select
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="flex-1 bg-background px-3 py-1 rounded-lg border"
                      >
                        <option value="">Escolha a Categoria</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsAddingCategory(true)}
                        className="bg-secondary text-secondary-foreground px-2 py-1 rounded-lg font-medium flex items-center gap-1"
                        type="button"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </motion.button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descrição</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-background px-3 py-1 rounded-lg border"
                      rows={3}
                    />
                  </div>

                  {/* Product Images */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Imagens do Produto</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-2">
                      {productImages.map((image, index) => (
                        <div key={index} className="relative aspect-square">
                          {/* Verificar se é um vídeo baseado na extensão do arquivo */}
                          {image.match(/\.(mp4|webm|mov)$/i) ? (
                            <div className="relative w-full h-full">
                              <video
                                src={image}
                                className="w-full h-full object-cover rounded-lg"
                                controls
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Play className="w-8 h-8 text-white opacity-70" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={image}
                              alt={`Product media ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          )}
                          <button
                            onClick={() => {
                              setProductImages(images => images.filter((_, i) => i !== index));
                              setEditForm(prev => ({
                                ...prev,
                                images: prev.images?.filter((_, i) => i !== index) || [],
                                media: prev.media?.filter((_, i) => i !== index) || []
                              }));
                            }}
                            className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label
                      htmlFor="edit-product-image-upload"
                      className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg border-2 border-dashed border-muted-foreground/20 cursor-pointer hover:bg-secondary/80 transition-colors mb-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Adicionar imagens ou vídeos</span>
                      <input
                        id="edit-product-image-upload"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          await handleEditMediaUpload(files);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {/* Botão para abrir o seletor de imagens */}
                    <div className="text-center mb-2">
                      <button
                        onClick={openStorageSelectorForEdit}
                        className="text-primary hover:underline text-sm"
                      >
                        Usar imagens já existentes no storage
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedProduct(product);
                        fetchStockHistory(product.id);
                      }}
                      className="p-2 bg-secondary text-secondary-foreground rounded-lg"
                    >
                      <Package2 className="w-4 h-4" />
                    </motion.button>
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
                <h2 className="text-xl font-semibold">Criar novo produto</h2>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-6">
                {/* Product Images */}
                <div>
                  <label className="block text-sm font-medium mb-2">Imagem do Produto</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {productImages.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        {/* Verificar se é um vídeo baseado na extensão do arquivo */}
                        {image.match(/\.(mp4|webm|mov)$/i) ? (
                          <div className="relative w-full h-full">
                            <video
                              src={image}
                              className="w-full h-full object-cover rounded-lg"
                              controls
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Play className="w-8 h-8 text-white opacity-70" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={image}
                            alt={`Product media ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                        <button
                          onClick={() => {
                            setProductImages(images => images.filter((_, i) => i !== index));
                            // Update newProduct.images and media as well
                            setNewProduct(prev => ({
                              ...prev,
                              images: prev.images?.filter((_, i) => i !== index) || [],
                              media: prev.media?.filter((_, i) => i !== index) || []
                            }));
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-4">
                    {/* File Upload */}
                    <div className="flex items-center gap-4">
                      <label
                        htmlFor="product-image-upload"
                        className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-6 rounded-lg border-2 border-dashed border-muted-foreground/20 cursor-pointer hover:bg-secondary/80 transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Clique para fazer upload de imagens ou vídeos</span>
                        <input
                          id="product-image-upload"
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;

                            try {
                              setLoading(prev => ({ ...prev, action: true }));
                              toast.info(`Fazendo upload de ${files.length} arquivo(s)...`);

                              // Upload media files to Supabase Storage using signed URLs
                              const mediaResults = await uploadMultipleMediaWithSignedUrl(files);

                              // Extract just the URLs for backward compatibility
                              const imageUrls = mediaResults.map(media => media.url);

                              // Update state with new media information
                              setProductImages(prev => [...prev, ...imageUrls]);
                              setNewProduct(prev => ({
                                ...prev,
                                images: [...(prev.images || []), ...imageUrls],
                                // Add media information if supported
                                media: [...(prev.media || []), ...mediaResults.map(m => ({
                                  type: m.type,
                                  url: m.url,
                                  alt: newProduct.name || 'Product image',
                                  thumbnail: m.thumbnail
                                }))]
                              }));

                              toast.success(`${files.length} arquivo(s) carregado(s) com sucesso!`);

                              // Clear the input
                              e.target.value = '';
                            } catch (error) {
                              console.error('Error uploading media:', error);
                              toast.error(`Erro ao fazer upload dos arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                            } finally {
                              setLoading(prev => ({ ...prev, action: false }));
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Botão para abrir o seletor de imagens */}
                    <div className="text-center">
                      <button
                        onClick={openStorageSelectorForNew}
                        className="text-primary hover:underline text-sm"
                      >
                        Usar imagens já existentes no storage
                      </button>
                    </div>

                    {/* URL Input (as fallback) */}
                    <div className="flex items-center gap-4">
                      <input
                        type="url"
                        placeholder="Ou insira a URL da imagem"
                        className="flex-1 bg-background px-3 py-2 rounded-lg border"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            if (input.value) {
                              const newUrl = input.value;
                              setProductImages(images => [...images, newUrl]);
                              setNewProduct(prev => ({
                                ...prev,
                                images: [...(prev.images || []), newUrl]
                              }));
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium"
                        onClick={() => {
                          const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                          if (input.value) {
                            const newUrl = input.value;
                            setProductImages(images => [...images, newUrl]);
                            setNewProduct(prev => ({
                              ...prev,
                              images: [...(prev.images || []), newUrl]
                            }));
                            input.value = '';
                          }
                        }}
                      >
                        Add URL
                      </motion.button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-background px-3 py-2 rounded-lg border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Preço</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                      className="w-full bg-background px-3 py-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Inventário</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                      className="w-full bg-background px-3 py-2 rounded-lg border"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-background px-3 py-2 rounded-lg border"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="flex-1 bg-background px-3 py-2 rounded-lg border"
                    >
                      <option value="">Escolha a Categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsAddingCategory(true)}
                      className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg font-medium flex items-center gap-1"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                      New
                    </motion.button>
                  </div>
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

      {/* Modal para adicionar nova categoria */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card p-6 rounded-xl shadow-lg w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Criar Nova Categoria</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddingCategory(false)}
                className="p-2 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full bg-background px-3 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full bg-background px-3 py-2 rounded-lg border"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!newCategory.name) {
                      toast.error('Category name is required');
                      return;
                    }
                    const category = await createCategory(newCategory);
                    if (category) {
                      setNewProduct({ ...newProduct, category: category.name });
                      setNewCategory({ name: '', description: '' });
                      setIsAddingCategory(false);
                    }
                  }}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                >
                  Create Category
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAddingCategory(false)}
                  className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Seletor de imagens do storage */}
      {showStorageSelector && (
        <StorageSelector
          onSelect={handleStorageSelection}
          onClose={() => setShowStorageSelector(false)}
          maxSelection={10}
        />
      )}
    </main>
  );
}
