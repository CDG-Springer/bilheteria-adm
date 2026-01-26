import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Search, UserCheck, UserX, Eye, Edit, Filter, Shield, ShieldOff } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserData {
  id: string;
  displayName: string;
  email: string;
  cpf: string;
  phone: string;
  isProducer: boolean;
  isAdmin: boolean;
  createdAt: any;
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "producer" | "admin">("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.cpf?.includes(s),
      );
    }

    if (filter === "producer") {
      result = result.filter((u) => u.isProducer);
    } else if (filter === "admin") {
      result = result.filter((u) => u.isAdmin);
    }

    setFilteredUsers(result);
  }, [search, filter, users]);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProducer = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isProducer: !currentStatus,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isProducer: !currentStatus } : u,
        ),
      );
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Tem certeza que deseja ${currentStatus ? 'remover' : 'conceder'} permissões de administrador?`)) return;
    
    try {
      await updateDoc(doc(db, "users", userId), {
        isAdmin: !currentStatus,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isAdmin: !currentStatus } : u,
        ),
      );
    } catch (error) {
      console.error("Error updating admin status:", error);
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
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <span className="text-gray-400">{filteredUsers.length} usuário(s)</span>
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
            placeholder="Buscar por nome, email ou CPF..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos</option>
            <option value="producer">Produtores</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm bg-gray-800/50">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Criado em</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-800 hover:bg-gray-800/30"
                >
                  <td className="px-6 py-4 font-medium">{user.displayName}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.isAdmin && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          Admin
                        </span>
                      )}
                      {user.isProducer && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          Produtor
                        </span>
                      )}
                      {!user.isAdmin && !user.isProducer && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                          Usuário
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.createdAt?.toDate
                      ? formatDate(user.createdAt.toDate().toISOString())
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => toggleProducer(user.id, user.isProducer)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isProducer
                            ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                            : "hover:bg-gray-700 text-gray-400 hover:text-white"
                        }`}
                        title={
                          user.isProducer
                            ? "Remover produtor"
                            : "Tornar produtor"
                        }
                      >
                        {user.isProducer ? (
                          <UserCheck size={18} />
                        ) : (
                          <UserX size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => toggleAdmin(user.id, user.isAdmin || false)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isAdmin
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "hover:bg-gray-700 text-gray-400 hover:text-white"
                        }`}
                        title={
                          user.isAdmin
                            ? "Remover admin"
                            : "Tornar admin"
                        }
                      >
                        {user.isAdmin ? (
                          <Shield size={18} />
                        ) : (
                          <ShieldOff size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Nenhum usuário encontrado
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
