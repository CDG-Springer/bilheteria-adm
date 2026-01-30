import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Search, UserCheck, UserX, Eye, Edit, Filter, Shield, ShieldOff, Users as UsersIcon, X } from "lucide-react";
import { toast } from "sonner";

interface LegalRepData {
  fullName?: string;
  docType?: string;
  docNumber?: string;
  birthDate?: string;
  role?: string;
  nationality?: string;
  legalRepPhone?: string;
}

interface UserData {
  id: string;
  displayName?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  isProducer?: boolean;
  isAdmin?: boolean;
  producerName?: string;
  producerStatus?: "pending" | "approved" | "rejected";
  businessEmail?: string;
  taxId?: string;
  documentUrl?: string;
  municipalRegistration?: string;
  headquartersAddress?: string;
  headquartersCity?: string;
  headquartersState?: string;
  headquartersZip?: string;
  cnae?: string;
  cnpjActive?: boolean;
  legalRep?: LegalRepData;
  createdAt?: { toDate?: () => Date } | string | number;
}

function formatUserDate(createdAt: UserData["createdAt"]): string {
  if (createdAt == null) return "-";
  try {
    const date =
      typeof (createdAt as { toDate?: () => Date }).toDate === "function"
        ? (createdAt as { toDate: () => Date }).toDate()
        : new Date(createdAt as string | number);
    return date.toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "producer" | "admin" | "pending_producer">("all");
  const [detailUser, setDetailUser] = useState<UserData | null>(null);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});
  const [saving, setSaving] = useState(false);

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
          u.cpf?.includes(s) ||
          u.producerName?.toLowerCase().includes(s),
      );
    }

    if (filter === "producer") {
      result = result.filter((u) => u.isProducer);
    } else if (filter === "admin") {
      result = result.filter((u) => u.isAdmin);
    } else if (filter === "pending_producer") {
      result = result.filter((u) => u.producerStatus === "pending");
    }

    setFilteredUsers(result);
  }, [search, filter, users]);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      // Todos os documentos da coleção "users" = todos os usuários cadastrados no sistema
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as UserData[];
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
      if (code === "permission-denied" || (error && typeof error === "object" && "message" in error && String((error as { message: string }).message).includes("permission"))) {
        toast.error(
          "Sem permissão para ler usuários. Publique as regras do Firestore (projeto event-tickets-now): firebase deploy --only firestore:rules",
          { duration: 8000 }
        );
      } else {
        toast.error("Erro ao carregar usuários. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleProducer = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isProducer: !currentStatus,
        ...(currentStatus ? { producerStatus: "rejected" } : { producerStatus: "approved" }),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, isProducer: !currentStatus, producerStatus: currentStatus ? "rejected" : "approved" }
            : u,
        ),
      );
      toast.success(currentStatus ? "Produtor removido" : "Usuário definido como produtor");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar. Tente novamente.");
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Tem certeza que deseja ${currentStatus ? "remover" : "conceder"} permissões de administrador?`))
      return;

    try {
      await updateDoc(doc(db, "users", userId), {
        isAdmin: !currentStatus,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isAdmin: !currentStatus } : u,
        ),
      );
      setDetailUser((u) => (u?.id === userId ? { ...u, isAdmin: !currentStatus } : u));
      setEditUser((u) => (u?.id === userId ? { ...u, isAdmin: !currentStatus } : u));
      toast.success(currentStatus ? "Admin removido" : "Usuário definido como admin");
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Erro ao atualizar. Tente novamente.");
    }
  };

  const openEdit = (user: UserData) => {
    setEditUser(user);
    setEditForm({
      displayName: user.displayName ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      birthDate: user.birthDate ?? "",
      producerName: user.producerName ?? "",
      businessEmail: user.businessEmail ?? "",
      taxId: user.taxId ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (editForm.displayName !== undefined) payload.displayName = editForm.displayName;
      if (editForm.phone !== undefined) payload.phone = editForm.phone;
      if (editForm.address !== undefined) payload.address = editForm.address;
      if (editForm.birthDate !== undefined) payload.birthDate = editForm.birthDate;
      if (editForm.producerName !== undefined) payload.producerName = editForm.producerName;
      if (editForm.businessEmail !== undefined) payload.businessEmail = editForm.businessEmail;
      if (editForm.taxId !== undefined) payload.taxId = editForm.taxId;

      await updateDoc(doc(db, "users", editUser.id), payload);
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, ...payload } : u)),
      );
      setFilteredUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, ...payload } : u)),
      );
      setEditUser(null);
      toast.success("Usuário atualizado.");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UsersIcon size={28} />
          Usuários
        </h1>
        <span className="text-gray-400">
          {filteredUsers.length} de {users.length} usuário(s) cadastrado(s)
        </span>
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
            placeholder="Buscar por nome, email, CPF ou produtora..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "producer" | "admin" | "pending_producer")}
            className="bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos</option>
            <option value="producer">Produtores</option>
            <option value="pending_producer">Solicitantes (pendentes)</option>
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
                  <td className="px-6 py-4 font-medium">
                    {user.displayName || user.email || user.id || "-"}
                  </td>
                  <td className="px-6 py-4">{user.email || "-"}</td>
                  <td className="px-6 py-4">{user.phone || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
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
                      {user.producerStatus === "pending" && !user.isProducer && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                          Aguardando aprovação
                        </span>
                      )}
                      {!user.isAdmin && !user.isProducer && user.producerStatus !== "pending" && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                          Usuário
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatUserDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailUser(user)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => toggleProducer(user.id, user.isProducer ?? false)}
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

      {/* Modal Ver detalhes */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setDetailUser(null)}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Detalhes do usuário</h2>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <span className="text-gray-500 block">Nome</span>
                <span className="text-white">{detailUser.displayName || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Email</span>
                <span className="text-white">{detailUser.email || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Telefone</span>
                <span className="text-white">{detailUser.phone || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">CPF</span>
                <span className="text-white">{detailUser.cpf || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Endereço</span>
                <span className="text-white">{detailUser.address || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Data de nascimento</span>
                <span className="text-white">{detailUser.birthDate || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Tipo</span>
                <div className="flex gap-2 flex-wrap mt-1">
                  {detailUser.isAdmin && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Admin</span>
                  )}
                  {detailUser.isProducer && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">Produtor</span>
                  )}
                  {detailUser.producerStatus === "pending" && !detailUser.isProducer && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">Aguardando aprovação</span>
                  )}
                </div>
              </div>
              {(detailUser.producerName || detailUser.businessEmail || detailUser.taxId) && (
                <>
                  <div className="border-t border-gray-800 pt-4 mt-4">
                    <span className="text-gray-400 font-medium">Dados de produtor</span>
                  </div>
                  {detailUser.producerName && (
                    <div>
                      <span className="text-gray-500 block">Nome da produtora</span>
                      <span className="text-white">{detailUser.producerName}</span>
                    </div>
                  )}
                  {detailUser.businessEmail && (
                    <div>
                      <span className="text-gray-500 block">Email comercial</span>
                      <span className="text-white">{detailUser.businessEmail}</span>
                    </div>
                  )}
                  {detailUser.taxId && (
                    <div>
                      <span className="text-gray-500 block">CPF/CNPJ</span>
                      <span className="text-white">{detailUser.taxId}</span>
                    </div>
                  )}
                  {detailUser.municipalRegistration && (
                    <div>
                      <span className="text-gray-500 block">Inscrição municipal</span>
                      <span className="text-white">{detailUser.municipalRegistration}</span>
                    </div>
                  )}
                  {detailUser.headquartersAddress && (
                    <div>
                      <span className="text-gray-500 block">Endereço da sede</span>
                      <span className="text-white">
                        {detailUser.headquartersAddress}
                        {detailUser.headquartersCity && `, ${detailUser.headquartersCity}`}
                        {detailUser.headquartersState && ` - ${detailUser.headquartersState}`}
                        {detailUser.headquartersZip && ` CEP ${detailUser.headquartersZip}`}
                      </span>
                    </div>
                  )}
                  {detailUser.cnae && (
                    <div>
                      <span className="text-gray-500 block">CNAE</span>
                      <span className="text-white">{detailUser.cnae}</span>
                    </div>
                  )}
                  {detailUser.cnpjActive === true && (
                    <div>
                      <span className="text-gray-500 block">CNPJ</span>
                      <span className="text-green-400">Declarado ativo</span>
                    </div>
                  )}
                  {detailUser.legalRep?.fullName && (
                    <>
                      <div className="border-t border-gray-800 pt-3 mt-3">
                        <span className="text-gray-400 font-medium">Representante legal</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Nome</span>
                        <span className="text-white">{detailUser.legalRep.fullName}</span>
                      </div>
                      {detailUser.legalRep.role && (
                        <div>
                          <span className="text-gray-500 block">Cargo</span>
                          <span className="text-white">{detailUser.legalRep.role}</span>
                        </div>
                      )}
                      {detailUser.legalRep.docNumber && (
                        <div>
                          <span className="text-gray-500 block">{detailUser.legalRep.docType === "rg" ? "RG" : "CPF"}</span>
                          <span className="text-white">{detailUser.legalRep.docNumber}</span>
                        </div>
                      )}
                      {detailUser.legalRep.birthDate && (
                        <div>
                          <span className="text-gray-500 block">Nascimento</span>
                          <span className="text-white">{detailUser.legalRep.birthDate}</span>
                        </div>
                      )}
                      {detailUser.legalRep.nationality && (
                        <div>
                          <span className="text-gray-500 block">Nacionalidade</span>
                          <span className="text-white">{detailUser.legalRep.nationality}</span>
                        </div>
                      )}
                    </>
                  )}
                  {detailUser.documentUrl && (
                    <div>
                      <span className="text-gray-500 block">Documento</span>
                      <a
                        href={detailUser.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                      >
                        Abrir documento
                      </a>
                    </div>
                  )}
                </>
              )}
              <div>
                <span className="text-gray-500 block">Cadastrado em</span>
                <span className="text-white">{formatUserDate(detailUser.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">UID</span>
                <span className="text-gray-400 text-xs font-mono break-all">{detailUser.id}</span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailUser(null);
                  openEdit(detailUser);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
              >
                <Edit size={16} />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setEditUser(null)}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Editar usuário</h2>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={editForm.displayName ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email (somente leitura)</label>
                <input
                  type="text"
                  value={editUser.email ?? ""}
                  readOnly
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                <input
                  type="text"
                  value={editForm.phone ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Endereço</label>
                <input
                  type="text"
                  value={editForm.address ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data de nascimento</label>
                <input
                  type="text"
                  value={editForm.birthDate ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, birthDate: e.target.value }))}
                  placeholder="AAAA-MM-DD"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              {(editUser.isProducer || editUser.producerName) && (
                <>
                  <div className="border-t border-gray-800 pt-4">
                    <span className="text-gray-400 font-medium">Dados de produtor</span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome da produtora</label>
                    <input
                      type="text"
                      value={editForm.producerName ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, producerName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email comercial</label>
                    <input
                      type="text"
                      value={editForm.businessEmail ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, businessEmail: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">CPF/CNPJ</label>
                    <input
                      type="text"
                      value={editForm.taxId ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, taxId: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
