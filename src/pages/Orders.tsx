import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Filter, Eye, RefreshCw, Ticket } from "lucide-react";

interface OrderData {
  id: string;
  userId: string;
  userEmail: string;
  items: any[];
  tickets?: string[]; // Array de códigos de ingressos
  total: number;
  status: "paid" | "pending" | "cancelled";
  paymentMethod: string;
  createdAt: any;
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    } catch (error) {
      console.error("Error updating order:", error);
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
                    <div className="flex flex-col gap-1">
                      <span>{order.items?.length || 0} item(s)</span>
                      {order.tickets && order.tickets.length > 0 && (
                        <span className="text-xs text-purple-400 flex items-center gap-1">
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
                    <div className="flex items-center gap-2">
                      {order.tickets && order.tickets.length > 0 && (
                        <div className="text-xs text-purple-400 font-mono">
                          {order.tickets.slice(0, 2).map((code, idx) => (
                            <div key={idx} className="truncate max-w-[100px]">
                              {code}
                            </div>
                          ))}
                          {order.tickets.length > 2 && (
                            <div className="text-gray-500">
                              +{order.tickets.length - 2} mais
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
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
    </div>
  );
}
