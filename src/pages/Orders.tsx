import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Filter, Eye, RefreshCw, Ticket, X, Calendar, CreditCard, User, Mail, FileText } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  eventId: string;
  eventName: string;
  ticketType: string;
  price: number;
  quantity: number;
  image: string;
  location: string;
  date: string;
}

interface PixPayer {
  name: string;
  documentType: "cpf" | "cnpj";
  document: string;
  email: string;
}

interface OrderData {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  tickets?: string[]; // Array de códigos de ingressos
  total: number;
  status: "paid" | "pending" | "cancelled";
  paymentMethod: "pix" | "credit";
  pixPayer?: PixPayer;
  createdAt: any;
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.userEmail?.toLowerCase().includes(s) ||
          o.id.toLowerCase().includes(s),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    setFilteredOrders(result);
  }, [search, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const snap = await getDocs(collection(db, "orders"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderData[];

      // Sort by date descending
      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus as any } : o,
        ),
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: newStatus as any } : prev,
      );
      toast.success("Status atualizado com sucesso");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-amber-500/20 text-amber-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchOrders}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw size={20} />
          </button>
          <span className="text-gray-400">
            {filteredOrders.length} pedido(s)
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email ou ID..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos status</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm bg-gray-800/50">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Pagamento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-gray-800 hover:bg-gray-800/30"
                >
                  <td className="px-6 py-4 font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4">{order.userEmail}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm">{order.items?.length || 0} item(s)</span>
                      {order.items && order.items.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {order.items.slice(0, 2).map((item: OrderItem, idx: number) => (
                            <div key={idx} className="text-xs text-gray-400">
                              {item.quantity}x {item.ticketType}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{order.items.length - 2} mais
                            </div>
                          )}
                        </div>
                      )}
                      {order.tickets && order.tickets.length > 0 && (
                        <span className="text-xs text-purple-400 flex items-center gap-1 mt-1">
                          <Ticket size={12} />
                          {order.tickets.length} ingresso(s)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 uppercase text-sm">
                    {order.paymentMethod}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs border-0 cursor-pointer ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      <option value="paid">Pago</option>
                      <option value="pending">Pendente</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {order.createdAt?.toDate
                      ? formatDate(order.createdAt.toDate().toISOString())
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Ver detalhes"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Nenhum pedido encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes do Pedido */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
              <h2 className="text-xl font-bold text-white">Detalhes do Pedido</h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <FileText size={14} />
                    ID do Pedido
                  </label>
                  <p className="text-white font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar size={14} />
                    Data
                  </label>
                  <p className="text-white">
                    {selectedOrder.createdAt?.toDate
                      ? formatDate(selectedOrder.createdAt.toDate().toISOString())
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <Mail size={14} />
                    Email do Cliente
                  </label>
                  <p className="text-white">{selectedOrder.userEmail}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <CreditCard size={14} />
                    Método de Pagamento
                  </label>
                  <p className="text-white uppercase">{selectedOrder.paymentMethod}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm border-0 cursor-pointer ${getStatusColor(
                      selectedOrder.status,
                    )}`}
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Total</label>
                  <p className="text-white font-bold text-lg">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
              </div>

              {/* Dados do Pagador (PIX) */}
              {selectedOrder.paymentMethod === "pix" && selectedOrder.pixPayer && (
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User size={18} />
                    Dados do Pagador (PIX)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm text-gray-400">Nome</label>
                      <p className="text-white">{selectedOrder.pixPayer.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-gray-400">Tipo de Documento</label>
                      <p className="text-white uppercase">{selectedOrder.pixPayer.documentType}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-gray-400">Documento</label>
                      <p className="text-white font-mono">{selectedOrder.pixPayer.document}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white">{selectedOrder.pixPayer.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Itens do Pedido */}
              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Ticket size={18} />
                  Itens do Pedido ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex gap-4">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.eventName}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-2">{item.eventName}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Tipo:</span>
                              <span className="text-white ml-2">{item.ticketType}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Quantidade:</span>
                              <span className="text-white ml-2">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Preço Unitário:</span>
                              <span className="text-white ml-2">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Subtotal:</span>
                              <span className="text-white ml-2 font-semibold">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Data do Evento:</span>
                              <span className="text-white ml-2">
                                {formatDate(item.date)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Local:</span>
                              <span className="text-white ml-2">{item.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Códigos de Ingressos */}
              {selectedOrder.tickets && selectedOrder.tickets.length > 0 && (
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Ticket size={18} />
                    Códigos de Ingressos ({selectedOrder.tickets.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOrder.tickets.map((ticket, index) => (
                      <div
                        key={index}
                        className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                      >
                        <p className="text-white font-mono text-sm">{ticket}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
