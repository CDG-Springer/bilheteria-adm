import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Search, Check, X, FileText, ExternalLink, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

interface LegalRep {
  fullName?: string;
  docType?: string;
  docNumber?: string;
  birthDate?: string;
  role?: string;
  nationality?: string;
  legalRepPhone?: string;
}

interface ProducerData {
  id: string;
  displayName: string;
  email: string;
  producerName: string;
  taxId: string;
  businessEmail: string;
  documentUrl: string;
  isProducer: boolean;
  createdAt: any;
  producerStatus?: "pending" | "approved" | "rejected";
  producerRequestedAt?: any;
  municipalRegistration?: string;
  headquartersAddress?: string;
  headquartersCity?: string;
  headquartersState?: string;
  headquartersZip?: string;
  cnae?: string;
  cnpjActive?: boolean;
  legalRep?: LegalRep;
  rejectionReason?: string;
  freeEventsOnly?: boolean;
}

export default function Producers() {
  const [producers, setProducers] = useState<ProducerData[]>([]);
  const [pendingProducers, setPendingProducers] = useState<ProducerData[]>([]);
  const [rejectedProducers, setRejectedProducers] = useState<ProducerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectingProducerId, setRejectingProducerId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchProducers();
  }, []);

  const fetchProducers = async () => {
    try {
      // Buscar todos os usuários que são produtores ou tem dados de produtor
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((u: any) => u.producerName || u.isProducer) as ProducerData[];

      // Filter based on new workflow fields or fallback to legacy logic
      const approved = data.filter(
        (p) => p.isProducer || p.producerStatus === "approved",
      );
      const pending = data.filter(
        (p) =>
          (!p.isProducer && p.producerName && !p.producerStatus) ||
          p.producerStatus === "pending",
      );
      const rejected = data.filter((p) => p.producerStatus === "rejected");

      setProducers(approved);
      setPendingProducers(pending);
      setRejectedProducers(rejected);
    } catch (error) {
      console.error("Error fetching producers:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveProducer = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isProducer: true,
        producerStatus: "approved",
        status: "PRODUTOR ATIVO",
      });
      const producer = pendingProducers.find((p) => p.id === userId);
      if (producer) {
        setPendingProducers((prev) => prev.filter((p) => p.id !== userId));
        setProducers((prev) => [...prev, { ...producer, isProducer: true }]);
      }
      toast.success("Produtor aprovado", {
        description: `${producer?.producerName || "Produtor"} pode acessar o painel de produtor.`,
      });
    } catch (error) {
      console.error("Error approving producer:", error);
      toast.error("Erro ao aprovar", { description: "Tente novamente." });
    }
  };

  const openRejectModal = (userId: string) => {
    setRejectingProducerId(userId);
    setRejectionReason("");
  };

  const closeRejectModal = () => {
    setRejectingProducerId(null);
    setRejectionReason("");
  };

  const rejectProducer = async () => {
    if (!rejectingProducerId || !rejectionReason.trim()) return;

    try {
      const producer = pendingProducers.find((p) => p.id === rejectingProducerId);
      await updateDoc(doc(db, "users", rejectingProducerId), {
        producerStatus: "rejected",
        status: "REJEITADO",
        isProducer: false,
        rejectionReason: rejectionReason.trim(),
      });

      // Criar notificação para o usuário
      await addDoc(collection(db, "notifications"), {
        userId: rejectingProducerId,
        type: "producer_rejected",
        title: "Solicitação de Produtor Rejeitada",
        message: `Sua solicitação como produtor "${producer?.producerName || ""}" foi rejeitada. Motivo: ${rejectionReason.trim()}`,
        rejectionReason: rejectionReason.trim(),
        read: false,
        createdAt: serverTimestamp(),
      });
      setPendingProducers((prev) => prev.filter((p) => p.id !== rejectingProducerId));
      if (producer) {
        setRejectedProducers((prev) => [
          ...prev,
          { ...producer, producerStatus: "rejected" as const, rejectionReason: rejectionReason.trim() },
        ]);
      }
      toast.success("Solicitação rejeitada", {
        description: "O usuário não terá acesso como produtor.",
      });
      closeRejectModal();
    } catch (error) {
      console.error("Error rejecting producer:", error);
      toast.error("Erro ao rejeitar", { description: "Tente novamente." });
    }
  };

  const revokeProducer = async (userId: string) => {
    if (!confirm("Tem certeza que deseja revogar o status de produtor?"))
      return;

    try {
      await updateDoc(doc(db, "users", userId), { isProducer: false });
      const producer = producers.find((p) => p.id === userId);
      if (producer) {
        setProducers((prev) => prev.filter((p) => p.id !== userId));
        setPendingProducers((prev) => [
          ...prev,
          { ...producer, isProducer: false, producerStatus: "pending" },
        ]);
      }
    } catch (error) {
      console.error("Error revoking producer:", error);
    }
  };

  const filteredPending = pendingProducers.filter(
    (p) =>
      !search ||
      p.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      p.producerName?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredApproved = producers.filter(
    (p) =>
      !search ||
      p.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      p.producerName?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredRejected = rejectedProducers.filter(
    (p) =>
      !search ||
      p.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      p.producerName?.toLowerCase().includes(search.toLowerCase()),
  );

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
        <h1 className="text-2xl font-bold text-white">Produtores</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === "pending"
              ? "bg-amber-500/20 text-amber-400"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Pendentes ({pendingProducers.length})
        </button>
        <button
          onClick={() => setTab("approved")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === "approved"
              ? "bg-green-500/20 text-green-400"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Aprovados ({producers.length})
        </button>
        <button
          onClick={() => setTab("rejected")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === "rejected"
              ? "bg-red-500/20 text-red-400"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Rejeitados ({rejectedProducers.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          size={20}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Content */}
      {tab === "pending" && (
        <div className="grid gap-4">
          {filteredPending.map((producer) => (
            <div
              key={producer.id}
              className="bg-gray-900 rounded-xl border border-gray-800 p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {producer.producerName}
                    </h3>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                      Pendente
                    </span>
                    {producer.freeEventsOnly && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        Produtor Gratuito
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400">{producer.displayName}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>{producer.email}</span>
                    {producer.businessEmail && (
                      <span>Comercial: {producer.businessEmail}</span>
                    )}
                    {producer.taxId && <span>CPF/CNPJ: {producer.taxId}</span>}
                    {producer.producerRequestedAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {producer.producerRequestedAt?.toDate
                          ? new Date(producer.producerRequestedAt.toDate()).toLocaleString("pt-BR")
                          : new Date(producer.producerRequestedAt).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                  {(producer.municipalRegistration ||
                    producer.headquartersAddress ||
                    producer.cnae ||
                    producer.legalRep?.fullName) && (
                    <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 space-y-1">
                      {producer.municipalRegistration && (
                        <p>Inscrição municipal: {producer.municipalRegistration}</p>
                      )}
                      {producer.headquartersAddress && (
                        <p>
                          Sede: {producer.headquartersAddress}
                          {producer.headquartersCity && `, ${producer.headquartersCity}`}
                          {producer.headquartersState && ` - ${producer.headquartersState}`}
                        </p>
                      )}
                      {producer.cnae && <p>CNAE: {producer.cnae}</p>}
                      {producer.cnpjActive === true && (
                        <p className="text-amber-400/80">CNPJ declarado ativo</p>
                      )}
                      {producer.legalRep?.fullName && (
                        <p>
                          Representante: {producer.legalRep.fullName}
                          {producer.legalRep.role && ` (${producer.legalRep.role})`}
                          {producer.legalRep.docNumber && ` · ${producer.legalRep.docType?.toUpperCase()}: ${producer.legalRep.docNumber}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {producer.documentUrl && (
                    <a
                      href={producer.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                    >
                      <FileText size={18} />
                      Documento
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => openRejectModal(producer.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <X size={18} />
                    Rejeitar
                  </button>
                  <button
                    onClick={() => approveProducer(producer.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                  >
                    <Check size={18} />
                    Aprovar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredPending.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum produtor pendente
            </div>
          )}
        </div>
      )}

      {tab === "rejected" && (
        <div className="grid gap-4">
          {filteredRejected.map((producer) => (
            <div
              key={producer.id}
              className="bg-gray-900 rounded-xl border border-gray-800 p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {producer.producerName}
                    </h3>
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                      <XCircle size={12} />
                      Rejeitado
                    </span>
                    {producer.freeEventsOnly && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        Produtor Gratuito
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400">{producer.displayName}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>{producer.email}</span>
                    {producer.businessEmail && (
                      <span>Comercial: {producer.businessEmail}</span>
                    )}
                    {producer.taxId && <span>CPF/CNPJ: {producer.taxId}</span>}
                    {producer.producerRequestedAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Solicitado:{" "}
                        {producer.producerRequestedAt?.toDate
                          ? new Date(producer.producerRequestedAt.toDate()).toLocaleString("pt-BR")
                          : new Date(producer.producerRequestedAt).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                  {producer.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400 font-medium">Motivo da rejeição:</p>
                      <p className="text-sm text-gray-300 mt-1">{producer.rejectionReason}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {producer.documentUrl && (
                    <a
                      href={producer.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                    >
                      <FileText size={18} />
                      Documento
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredRejected.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhuma solicitação rejeitada
            </div>
          )}
        </div>
      )}

      {/* Modal de Rejeição */}
      {rejectingProducerId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Rejeitar Produtor</h2>
              <button
                onClick={closeRejectModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-400 mb-4">
              Informe o motivo da rejeição. Esta mensagem será enviada ao solicitante.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={rejectProducer}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "approved" && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm bg-gray-800/50">
                  <th className="px-6 py-4">Nome Comercial</th>
                  <th className="px-6 py-4">Responsável</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">CNPJ</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {filteredApproved.map((producer) => (
                  <tr
                    key={producer.id}
                    className="border-t border-gray-800 hover:bg-gray-800/30"
                  >
                    <td className="px-6 py-4 font-medium">
                      {producer.producerName}
                    </td>
                    <td className="px-6 py-4">{producer.displayName}</td>
                    <td className="px-6 py-4">
                      {producer.businessEmail || producer.email}
                    </td>
                    <td className="px-6 py-4">{producer.taxId || "-"}</td>
                    <td className="px-6 py-4">
                      {producer.freeEventsOnly ? (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          Gratuito
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Completo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => revokeProducer(producer.id)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors"
                      >
                        Revogar
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApproved.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Nenhum produtor aprovado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
