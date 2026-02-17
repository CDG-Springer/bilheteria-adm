import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";

interface RevenueStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyRevenue: Array<{ name: string; revenue: number }>;
  revenueByCategory: Array<{ name: string; value: number }>;
  revenueByPaymentMethod: Array<{ name: string; value: number }>;
  revenueByProducer: Array<{ name: string; value: number; events: number }>;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: any;
    userEmail: string;
  }>;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#a855f7"];

export default function Revenue() {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    monthlyRevenue: [],
    revenueByCategory: [],
    revenueByPaymentMethod: [],
    revenueByProducer: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<"all" | "month" | "quarter" | "year">("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    fetchRevenueData();
  }, [periodFilter, dateRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);

      // Buscar todos os pedidos
      const ordersSnap = await getDocs(collection(db, "orders"));
      const orders = ordersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtrar por período se necessário
      let filteredOrders = orders;
      if (periodFilter !== "all" || dateRange.start || dateRange.end) {
        filteredOrders = orders.filter((order) => {
          const orderDate = order.createdAt?.toDate?.() || new Date();
          const now = new Date();

          if (dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59);
            return orderDate >= start && orderDate <= end;
          }

          if (periodFilter === "month") {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          }

          if (periodFilter === "quarter") {
            const quarterAgo = new Date(now);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            return orderDate >= quarterAgo;
          }

          if (periodFilter === "year") {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return orderDate >= yearAgo;
          }

          return true;
        });
      }

      // Filtrar apenas pedidos pagos
      const paidOrders = filteredOrders.filter((order) => order.status === "paid");

      // Calcular receita total
      const totalRevenue = paidOrders.reduce((acc, order) => acc + (order.total || 0), 0);
      const totalOrders = paidOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Receita mensal
      const monthlyRevenue: Record<string, number> = {};
      paidOrders.forEach((order) => {
        const date = order.createdAt?.toDate?.() || new Date();
        const month = date.toLocaleDateString("pt-BR", { month: "short" });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (order.total || 0);
      });

      const sortedMonthlyRevenue = Object.entries(monthlyRevenue)
        .map(([name, revenue]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          revenue: Math.round(revenue * 100) / 100,
        }))
        .sort((a, b) => {
          const monthMap: Record<string, number> = {
            jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
            jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
          };
          return (monthMap[a.name.toLowerCase()] || 0) - (monthMap[b.name.toLowerCase()] || 0);
        });

      // Receita por método de pagamento
      const revenueByPaymentMethod: Record<string, number> = {};
      paidOrders.forEach((order) => {
        const method = order.paymentMethod || "unknown";
        revenueByPaymentMethod[method] = (revenueByPaymentMethod[method] || 0) + (order.total || 0);
      });

      const paymentMethodData = Object.entries(revenueByPaymentMethod).map(([name, value]) => ({
        name: name === "pix" ? "PIX" : name === "credit" ? "Cartão" : name,
        value: Math.round(value * 100) / 100,
      }));

      // Buscar eventos para receita por categoria e produtor
      const eventsSnap = await getDocs(collection(db, "events"));
      const events = eventsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Receita por categoria
      const revenueByCategory: Record<string, number> = {};
      events.forEach((event) => {
        const category = event.category || "Outro";
        const eventRevenue =
          (event.soldPista || 0) * (event.pricePistaInteira || event.pricePista || 0) +
          (event.soldPremium || 0) * (event.pricePremiumInteira || event.pricePremium || 0) +
          (event.soldVip || 0) * (event.priceVipInteira || event.priceVip || 0) +
          (event.soldCamarote || 0) * (event.priceCamaroteInteira || event.priceCamarote || 0);

        revenueByCategory[category] = (revenueByCategory[category] || 0) + eventRevenue;
      });

      const categoryData = Object.entries(revenueByCategory)
        .map(([name, value]) => ({
          name,
          value: Math.round(value * 100) / 100,
        }))
        .sort((a, b) => b.value - a.value);

      // Receita por produtor
      const revenueByProducer: Record<string, { value: number; events: number; name: string }> = {};
      events.forEach((event) => {
        const producerId = event.producerId || "unknown";
        const eventRevenue =
          (event.soldPista || 0) * (event.pricePistaInteira || event.pricePista || 0) +
          (event.soldPremium || 0) * (event.pricePremiumInteira || event.pricePremium || 0) +
          (event.soldVip || 0) * (event.priceVipInteira || event.priceVip || 0) +
          (event.soldCamarote || 0) * (event.priceCamaroteInteira || event.priceCamarote || 0);

        if (!revenueByProducer[producerId]) {
          revenueByProducer[producerId] = { value: 0, events: 0, name: "Produtor Desconhecido" };
        }
        revenueByProducer[producerId].value += eventRevenue;
        revenueByProducer[producerId].events += 1;
      });

      // Buscar nomes dos produtores
      const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.docs.forEach((doc) => {
        const userData = doc.data();
        if (userData.isProducer && revenueByProducer[doc.id]) {
          revenueByProducer[doc.id].name = userData.displayName || userData.producerName || "Produtor";
        }
      });

      const producerData = Object.entries(revenueByProducer)
        .map(([id, data]) => ({
          name: data.name,
          value: Math.round(data.value * 100) / 100,
          events: data.events,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 produtores

      // Pedidos recentes
      const recentOrders = paidOrders
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10)
        .map((order) => ({
          id: order.id,
          total: order.total || 0,
          status: order.status,
          createdAt: order.createdAt,
          userEmail: order.userEmail || "N/A",
        }));

      setStats({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        monthlyRevenue: sortedMonthlyRevenue,
        revenueByCategory: categoryData,
        revenueByPaymentMethod: paymentMethodData,
        revenueByProducer: producerData,
        recentOrders,
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implementar exportação para CSV/PDF
    alert("Funcionalidade de exportação em desenvolvimento");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-amber-500" size={28} />
            Detalhes de Receita
          </h1>
          <p className="text-gray-400 mt-1">Análise completa da receita movimentada no sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRevenueData}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-gray-400 text-sm">Período:</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos</option>
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Último Ano</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="text-gray-400 text-sm">Período Customizado:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalOrders} pedidos</p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <DollarSign className="text-amber-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Ticket Médio</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.averageOrderValue)}</p>
              <p className="text-xs text-gray-500 mt-1">Por pedido</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total de Pedidos</p>
              <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Pedidos pagos</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <BarChart3 className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Categorias</p>
              <p className="text-2xl font-bold text-white">{stats.revenueByCategory.length}</p>
              <p className="text-xs text-gray-500 mt-1">Com receita</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <PieChartIcon className="text-green-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita Mensal */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 size={20} />
              Receita Mensal
            </h2>
          </div>
          {stats.monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyRevenue}>
                <defs>
                  <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                    return `R$ ${value}`;
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value as number;
                      return (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
                          <p className="text-white font-semibold mb-1">{payload[0].payload.name}</p>
                          <p className="text-purple-400 font-bold">{formatCurrency(value)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="url(#monthlyGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Nenhuma receita no período selecionado</p>
            </div>
          )}
        </div>

        {/* Receita por Categoria */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <PieChartIcon size={20} />
              Receita por Categoria
            </h2>
          </div>
          {stats.revenueByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.revenueByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
                          <p className="text-white font-semibold mb-1">{data.name}</p>
                          <p className="text-purple-400 font-bold">{formatCurrency(data.value)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Nenhuma receita por categoria</p>
            </div>
          )}
        </div>

        {/* Receita por Método de Pagamento */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign size={20} />
              Receita por Método de Pagamento
            </h2>
          </div>
          {stats.revenueByPaymentMethod.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.revenueByPaymentMethod}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.revenueByPaymentMethod.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
                          <p className="text-white font-semibold mb-1">{data.name}</p>
                          <p className="text-purple-400 font-bold">{formatCurrency(data.value)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Nenhuma receita por método de pagamento</p>
            </div>
          )}
        </div>

        {/* Top Produtores */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp size={20} />
              Top 10 Produtores
            </h2>
          </div>
          {stats.revenueByProducer.length > 0 ? (
            <div className="space-y-3">
              {stats.revenueByProducer.map((producer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{producer.name}</p>
                      <p className="text-xs text-gray-400">{producer.events} evento(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(producer.value)}</p>
                    <p className="text-xs text-gray-400">
                      {((producer.value / stats.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Nenhum produtor com receita</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Pedidos Recentes */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar size={20} />
            Pedidos Recentes
          </h2>
        </div>
        {stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Cliente</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Data</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-white text-sm font-mono">{order.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 text-white text-sm">{order.userEmail}</td>
                    <td className="py-3 px-4 text-right text-white font-bold">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {order.createdAt?.toDate ? formatDate(order.createdAt.toDate()) : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        {order.status === "paid" ? "Pago" : order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <p>Nenhum pedido recente</p>
          </div>
        )}
      </div>
    </div>
  );
}
