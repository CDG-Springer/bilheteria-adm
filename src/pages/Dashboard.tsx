import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
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
} from "recharts";

interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEvents: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar usuários
      const usersSnap = await getDocs(collection(db, "users"));
      const totalUsers = usersSnap.size;

      // Buscar eventos
      const eventsSnap = await getDocs(collection(db, "events"));
      const totalEvents = eventsSnap.size;

      // Calcular categorias
      const categories: Record<string, number> = {};
      eventsSnap.docs.forEach((doc) => {
        const cat = doc.data().category || "Outro";
        categories[cat] = (categories[cat] || 0) + 1;
      });
      setCategoryData(
        Object.entries(categories).map(([name, value]) => ({ name, value })),
      );

      // Buscar pedidos
      const ordersSnap = await getDocs(collection(db, "orders"));
      const totalOrders = ordersSnap.size;
      let totalRevenue = 0;

      const monthlyRevenue: Record<string, number> = {};

      ordersSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "paid") {
          totalRevenue += data.total || 0;

          // Agrupar por mês
          const date = data.createdAt?.toDate?.() || new Date();
          const month = date.toLocaleDateString("pt-BR", { month: "short" });
          monthlyRevenue[month] =
            (monthlyRevenue[month] || 0) + (data.total || 0);
        }
      });

      // Ordenar por data (mais antigo primeiro)
      const sortedData = Object.entries(monthlyRevenue)
        .map(([name, revenue]) => ({
          name,
          revenue,
        }))
        .sort((a, b) => {
          // Converter nomes de meses para números para ordenação
          const monthMap: Record<string, number> = {
            'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
            'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
          };
          return (monthMap[a.name.toLowerCase()] || 0) - (monthMap[b.name.toLowerCase()] || 0);
        });
      
      setChartData(sortedData.length > 0 ? sortedData : [
        { name: "Nenhum dado", revenue: 0 }
      ]);

      // Pedidos recentes
      const recentQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
        limit(5),
      );
      const recentSnap = await getDocs(recentQuery);
      const recentOrders = recentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStats({
        totalUsers,
        totalEvents,
        totalOrders,
        totalRevenue,
        recentOrders,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      label: "Total Eventos",
      value: stats.totalEvents,
      icon: Calendar,
      color: "bg-purple-500",
      change: "+8%",
    },
    {
      label: "Total Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-green-500",
      change: "+23%",
    },
    {
      label: "Receita Total",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-amber-500",
      change: "+18%",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg">
          <TrendingUp size={16} />
          <span className="text-sm font-medium">Atualizado agora</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon size={24} className="text-white" />
              </div>
              <span className="flex items-center gap-1 text-green-400 text-sm">
                {stat.change}
                <ArrowUpRight size={14} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            Receita Mensal
          </h3>
          <div className="h-64">
            {chartData.length > 0 && chartData[0].name !== "Nenhum dado" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af"
                    tick={{ fill: "#9ca3af" }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={{ fill: "#9ca3af" }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div 
                            className="bg-transparent p-2"
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              boxShadow: "none",
                            }}
                          >
                            <p className="text-white font-bold mb-1" style={{ textShadow: "0 0 8px rgba(0,0,0,0.8)" }}>
                              {label}
                            </p>
                            <p 
                              className="text-sm font-medium"
                              style={{ 
                                color: "#8b5cf6",
                                textShadow: "0 0 8px rgba(0,0,0,0.8)",
                              }}
                            >
                              Receita: {formatCurrency(payload[0].value as number || 0)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                    wrapperStyle={{
                      backgroundColor: "transparent",
                      border: "none",
                      boxShadow: "none",
                    }}
                    contentStyle={{
                      backgroundColor: "transparent",
                      border: "none",
                      boxShadow: "none",
                      padding: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                    name="Receita"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Nenhuma receita registrada ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            Eventos por Categoria
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Pedidos Recentes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                <th className="pb-3">ID</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-800/50">
                  <td className="py-3 font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="py-3">{order.userEmail}</td>
                  <td className="py-3">{formatCurrency(order.total || 0)}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        order.status === "paid"
                          ? "bg-green-500/20 text-green-400"
                          : order.status === "pending"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {order.status === "paid"
                        ? "Pago"
                        : order.status === "pending"
                          ? "Pendente"
                          : "Cancelado"}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
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
