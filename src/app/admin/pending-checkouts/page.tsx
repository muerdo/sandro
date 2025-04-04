"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ArrowUpDown,
  MessageCircle,
  Eye,
  RefreshCw,
  CheckCircle,
  X,
  Clock,
  AlertCircle,
  QrCode,
  Send
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Tipo para endereço de entrega
type ShippingAddress = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean;
};

// Tipo para item do carrinho
type CartItem = {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  notes?: string;
  [key: string]: any; // Para campos adicionais que possam existir
};

// Tipo para checkout pendente
type PendingCheckout = {
  id: string;
  user_id: string;
  cart_items: CartItem[] | CartItem | any; // Pode ser um array, um objeto único ou outro formato
  shipping_address: ShippingAddress & {
  };
  payment_method: string;
  total_amount: number;
  pix_transaction_id: string;
  pix_code: string;
  pix_qr_code: string;
  pix_expires_at: string;
  created_at: string;
  updated_at: string;
  contacted: boolean;
  notes: string;
  status: string;
};

export default function PendingCheckoutsPage() {
  const router = useRouter();
  const [pendingCheckouts, setPendingCheckouts] = useState<PendingCheckout[]>([]);
  const [loading, setLoading] = useState({
    checkouts: true,
    action: false,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc" as "asc" | "desc",
  });
  const [selectedCheckout, setSelectedCheckout] = useState<PendingCheckout | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [noteInput, setNoteInput] = useState("");

  // Verificar status de admin
  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      router.push("/");
    }
  };

  // Buscar checkouts pendentes
  const fetchPendingCheckouts = async () => {
    try {
      setLoading(prev => ({ ...prev, checkouts: true }));

      const { data, error } = await supabase
        .from("pending_checkouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPendingCheckouts(data || []);
    } catch (error) {
      console.error("Error fetching pending checkouts:", error);
      toast.error("Failed to load pending checkouts");
    } finally {
      setLoading(prev => ({ ...prev, checkouts: false }));
    }
  };

  // Marcar checkout como contatado
  const markAsContacted = async (id: string) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { error } = await supabase
        .from("pending_checkouts")
        .update({
          contacted: true,
          notes: noteInput ? `${new Date().toLocaleString()}: ${noteInput}` : `${new Date().toLocaleString()}: Cliente contatado.`,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Checkout marked as contacted");
      setNoteInput("");
      fetchPendingCheckouts();
    } catch (error) {
      console.error("Error marking checkout as contacted:", error);
      toast.error("Failed to update checkout");
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Adicionar nota ao checkout
  const addNote = async (id: string) => {
    if (!noteInput.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { data: checkout, error: fetchError } = await supabase
        .from("pending_checkouts")
        .select("notes")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const existingNotes = checkout?.notes || "";
      const newNotes = existingNotes
        ? `${existingNotes}\n${new Date().toLocaleString()}: ${noteInput}`
        : `${new Date().toLocaleString()}: ${noteInput}`;

      const { error } = await supabase
        .from("pending_checkouts")
        .update({
          notes: newNotes,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Note added successfully");
      setNoteInput("");
      fetchPendingCheckouts();
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Ordenar checkouts
  const handleSort = (key: keyof PendingCheckout) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filtrar e ordenar checkouts
  const filteredAndSortedCheckouts = pendingCheckouts
    .filter(checkout => {
      // Filtrar por termo de busca
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        checkout.shipping_address?.full_name?.toLowerCase().includes(searchLower) ||
        checkout.shipping_address?.email?.toLowerCase().includes(searchLower) ||
        checkout.shipping_address?.phone?.toLowerCase().includes(searchLower) ||
        checkout.id.toLowerCase().includes(searchLower);

      // Filtrar por status
      const matchesStatus = statusFilter ? checkout.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const key = sortConfig.key as keyof PendingCheckout;

      if (key === "total_amount") {
        return sortConfig.direction === "asc"
          ? Number(a[key]) - Number(b[key])
          : Number(b[key]) - Number(a[key]);
      }

      if (key === "created_at" || key === "updated_at" || key === "pix_expires_at") {
        return sortConfig.direction === "asc"
          ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
          : new Date(b[key]).getTime() - new Date(a[key]).getTime();
      }

      if (a[key] < b[key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  // Gerar link de WhatsApp com informações do checkout
  const generateWhatsAppLink = (checkout: PendingCheckout, includePixCode: boolean = false) => {
    const phone = checkout.shipping_address?.phone?.replace(/\D/g, "");
    if (!phone) return "";

    // Garantir que cart_items seja um array
    const cartItems = Array.isArray(checkout.cart_items)
      ? checkout.cart_items
      : (typeof checkout.cart_items === 'object' && checkout.cart_items !== null)
        ? [checkout.cart_items]
        : [];

    let messageText = `Olá ${checkout.shipping_address?.full_name || ""}!\n\n` +
      `Notamos que você iniciou um pedido em nossa loja, mas o pagamento via PIX não foi concluído.\n\n` +
      `Detalhes do pedido:\n` +
      `- Total: ${formatCurrency(checkout.total_amount)}\n` +
      `- Data: ${new Date(checkout.created_at).toLocaleString()}\n` +
      `- Produtos: ${cartItems.length > 0
        ? cartItems.map(item => `${item.quantity || 1}x ${item.name || 'Produto'}`).join(", ")
        : "Produtos no carrinho"}\n\n`;

    if (includePixCode && checkout.pix_code) {
      messageText += `Para finalizar sua compra, utilize o código PIX abaixo:\n\n` +
        `${checkout.pix_code}\n\n` +
        `Ou escaneie o QR Code que estou enviando em seguida.\n\n`;

      if (checkout.pix_expires_at) {
        const expiryDate = new Date(checkout.pix_expires_at);
        const isExpired = expiryDate < new Date();

        if (isExpired) {
          messageText += `Observação: Este código PIX já expirou. Por favor, entre em contato conosco para gerar um novo código.\n\n`;
        } else {
          messageText += `Este código PIX é válido até ${expiryDate.toLocaleString()}.\n\n`;
        }
      }
    } else {
      messageText += `Para finalizar sua compra, você pode usar o mesmo código PIX gerado anteriormente ou solicitar um novo.\n\n`;
    }

    messageText += `Posso ajudar com algo mais?`;

    const message = encodeURIComponent(messageText);
    return `https://wa.me/${phone}?text=${message}`;
  };

  // Gerar link de WhatsApp específico para enviar QR Code PIX
  const generatePixQrCodeWhatsAppLink = (checkout: PendingCheckout) => {
    const phone = checkout.shipping_address?.phone?.replace(/\D/g, "");
    if (!phone) return "";

    // Garantir que cart_items seja um array
    const cartItems = Array.isArray(checkout.cart_items)
      ? checkout.cart_items
      : (typeof checkout.cart_items === 'object' && checkout.cart_items !== null)
        ? [checkout.cart_items]
        : [];

    // Mensagem simples para acompanhar o QR Code
    const message = encodeURIComponent(
      `Aqui está o QR Code PIX para o seu pedido de ${formatCurrency(checkout.total_amount)}.\n` +
      `Produtos: ${cartItems.length > 0
        ? cartItems.map(item => `${item.quantity || 1}x ${item.name || 'Produto'}`).join(", ")
        : "Produtos no carrinho"}\n\n` +
      `Basta escanear com o aplicativo do seu banco para concluir o pagamento.`
    );

    return `https://wa.me/${phone}?text=${message}`;
  };

  // Verificar se um checkout está expirado
  const isExpired = (checkout: PendingCheckout) => {
    if (!checkout.pix_expires_at) return false;
    return new Date(checkout.pix_expires_at) < new Date();
  };

  // Efeito para verificar status de admin e carregar checkouts
  useEffect(() => {
    // Verifica se já carregamos os dados nesta sessão
    const checkoutsLoaded = sessionStorage.getItem('admin_pending_checkouts_loaded');

    // Verifica o status de admin apenas uma vez
    checkAdminStatus();

    // Se for admin e ainda não carregamos os dados, carrega-os
    if (isAdmin && !checkoutsLoaded) {
      fetchPendingCheckouts();

      // Marca que já carregamos os dados
      sessionStorage.setItem('admin_pending_checkouts_loaded', 'true');
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando permissões...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">Pending Checkouts Management</h1>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                toast.info('Atualizando checkouts pendentes...');
                fetchPendingCheckouts();
              }}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Checkouts
            </motion.button>
          </div>
        </div>

        {/* Filtros e busca */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="pl-10 pr-4 py-2 border rounded-lg appearance-none"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de checkouts pendentes */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 text-left">
                  <button
                    onClick={() => handleSort("created_at")}
                    className="flex items-center gap-1 font-medium"
                  >
                    Date
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">
                  <button
                    onClick={() => handleSort("total_amount")}
                    className="flex items-center gap-1 font-medium"
                  >
                    Amount
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Contacted</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading.checkouts ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading checkouts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedCheckouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    No pending checkouts found
                  </td>
                </tr>
              ) : (
                filteredAndSortedCheckouts.map((checkout) => (
                  <tr key={checkout.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      {new Date(checkout.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{checkout.shipping_address?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{checkout.shipping_address?.email}</p>
                        <p className="text-sm text-muted-foreground">{checkout.shipping_address?.phone}</p>
                      </div>
                    </td>
                    <td className="p-3 font-medium">
                      {formatCurrency(checkout.total_amount)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {checkout.status === "pending" && !isExpired(checkout) && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                        {checkout.status === "pending" && isExpired(checkout) && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Expired
                          </span>
                        )}
                        {checkout.status === "paid" && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Paid
                          </span>
                        )}
                        {checkout.status === "cancelled" && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Cancelled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {checkout.contacted ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
                          <X className="w-3 h-3" />
                          No
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedCheckout(checkout);
                            setShowDetails(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-800 rounded-lg"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        {checkout.shipping_address?.phone && (
                          <>
                            <motion.a
                              href={generateWhatsAppLink(checkout)}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-lg"
                              title="Contact via WhatsApp"
                              onClick={() => {
                                if (!checkout.contacted) {
                                  markAsContacted(checkout.id);
                                }
                              }}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </motion.a>

                            {/* Botão para enviar código PIX via WhatsApp */}
                            {checkout.status === "pending" && checkout.pix_code && (
                              <motion.a
                                href={generateWhatsAppLink(checkout, true)}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 bg-blue-100 text-blue-800 rounded-lg"
                                title="Send PIX code via WhatsApp"
                                onClick={() => {
                                  if (!checkout.contacted) {
                                    markAsContacted(checkout.id);
                                  }
                                }}
                              >
                                <Send className="w-4 h-4" />
                              </motion.a>
                            )}

                            {/* Botão para enviar QR Code PIX via WhatsApp */}
                            {checkout.status === "pending" && checkout.pix_qr_code && (
                              <motion.a
                                href={generatePixQrCodeWhatsAppLink(checkout)}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 bg-purple-100 text-purple-800 rounded-lg"
                                title="Send PIX QR Code via WhatsApp"
                                onClick={() => {
                                  if (!checkout.contacted) {
                                    markAsContacted(checkout.id);
                                  }
                                }}
                              >
                                <QrCode className="w-4 h-4" />
                              </motion.a>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalhes do checkout */}
      {showDetails && selectedCheckout && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Checkout Details</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowDetails(false)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedCheckout.shipping_address?.full_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedCheckout.shipping_address?.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedCheckout.shipping_address?.phone}</p>
                  <p><span className="font-medium">Address:</span> {selectedCheckout.shipping_address?.address}</p>
                  <p><span className="font-medium">City:</span> {selectedCheckout.shipping_address?.city}</p>
                  <p><span className="font-medium">State:</span> {selectedCheckout.shipping_address?.state}</p>
                  <p><span className="font-medium">Postal Code:</span> {selectedCheckout.shipping_address?.postal_code}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Checkout Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">ID:</span> {selectedCheckout.id}</p>
                  <p><span className="font-medium">Created:</span> {new Date(selectedCheckout.created_at).toLocaleString()}</p>
                  <p><span className="font-medium">Updated:</span> {new Date(selectedCheckout.updated_at).toLocaleString()}</p>
                  <p><span className="font-medium">Payment Method:</span> {selectedCheckout.payment_method.toUpperCase()}</p>
                  <p><span className="font-medium">Total Amount:</span> {formatCurrency(selectedCheckout.total_amount)}</p>
                  <p><span className="font-medium">Status:</span> {selectedCheckout.status.toUpperCase()}</p>
                  <p><span className="font-medium">Contacted:</span> {selectedCheckout.contacted ? "Yes" : "No"}</p>
                  {selectedCheckout.pix_expires_at && (
                    <p>
                      <span className="font-medium">PIX Expires:</span> {new Date(selectedCheckout.pix_expires_at).toLocaleString()}
                      {isExpired(selectedCheckout) && <span className="ml-2 text-red-500">(Expired)</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Cart Items</h3>
              <div className="overflow-x-auto">
                {(() => {
                  // Garantir que cart_items seja um array
                  const cartItems = Array.isArray(selectedCheckout.cart_items)
                    ? selectedCheckout.cart_items
                    : (typeof selectedCheckout.cart_items === 'object' && selectedCheckout.cart_items !== null)
                      ? [selectedCheckout.cart_items]
                      : [];

                  if (cartItems.length === 0) {
                    return (
                      <div className="p-4 text-center bg-muted rounded-lg">
                        <p>No cart items available</p>
                      </div>
                    );
                  }

                  return (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Product</th>
                          <th className="p-2 text-left">Quantity</th>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {item.image && (
                                  <img src={item.image} alt={item.name || 'Product'} className="w-10 h-10 object-cover rounded" />
                                )}
                                <div>
                                  <p className="font-medium">{item.name || 'Product'}</p>
                                  {item.notes && <p className="text-sm text-muted-foreground">Note: {item.notes}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="p-2">{item.quantity || 1}</td>
                            <td className="p-2">{formatCurrency(item.price || 0)}</td>
                            <td className="p-2">{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>

            {selectedCheckout.pix_qr_code && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">PIX QR Code</h3>
                <div className="flex flex-col items-center">
                  <img src={selectedCheckout.pix_qr_code} alt="PIX QR Code" className="max-w-[200px] mb-2" />
                  <div className="w-full p-2 bg-muted rounded-lg overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap break-all">{selectedCheckout.pix_code}</pre>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <div className="bg-muted p-3 rounded-lg mb-3 min-h-[100px] whitespace-pre-wrap">
                {selectedCheckout.notes || "No notes available."}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addNote(selectedCheckout.id)}
                  disabled={loading.action || !noteInput.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                >
                  {loading.action ? "Adding..." : "Add Note"}
                </motion.button>
              </div>
            </div>

            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg"
              >
                Close
              </motion.button>
              <div className="flex gap-2">
                {!selectedCheckout.contacted && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      markAsContacted(selectedCheckout.id);
                      setShowDetails(false);
                    }}
                    disabled={loading.action}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading.action ? "Updating..." : "Mark as Contacted"}
                  </motion.button>
                )}
                {selectedCheckout.shipping_address?.phone && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <motion.a
                      href={generateWhatsAppLink(selectedCheckout)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 bg-[#25D366] text-white rounded-lg flex items-center gap-2"
                      onClick={() => {
                        if (!selectedCheckout.contacted) {
                          markAsContacted(selectedCheckout.id);
                        }
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contact via WhatsApp
                    </motion.a>

                    {/* Botão para enviar código PIX via WhatsApp */}
                    {selectedCheckout.status === "pending" && selectedCheckout.pix_code && (
                      <motion.a
                        href={generateWhatsAppLink(selectedCheckout, true)}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                        onClick={() => {
                          if (!selectedCheckout.contacted) {
                            markAsContacted(selectedCheckout.id);
                          }
                        }}
                      >
                        <Send className="w-4 h-4" />
                        Send PIX Code
                      </motion.a>
                    )}

                    {/* Botão para enviar QR Code PIX via WhatsApp */}
                    {selectedCheckout.status === "pending" && selectedCheckout.pix_qr_code && (
                      <motion.a
                        href={generatePixQrCodeWhatsAppLink(selectedCheckout)}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
                        onClick={() => {
                          if (!selectedCheckout.contacted) {
                            markAsContacted(selectedCheckout.id);
                          }
                        }}
                      >
                        <QrCode className="w-4 h-4" />
                        Send QR Code
                      </motion.a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
