import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { Search, Check, X, FileText, ExternalLink } from "lucide-react";

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
}

export default function Producers() {
  const [producers, setProducers] = useState<ProducerData[]>([]);
  const [pendingProducers, setPendingProducers] = useState<ProducerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"pending" | "approved">("pending");

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

      const approved = data.filter((p) => p.isProducer);
      const pending = data.filter((p) => !p.isProducer && p.producerName);

      setProducers(approved);
      setPendingProducers(pending);
    } catch (error) {
      console.error("Error fetching producers:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveProducer = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { isProducer: true });
      const producer = pendingProducers.find((p) => p.id === userId);
      if (producer) {
        setPendingProducers((prev) => prev.filter((p) => p.id !== userId));
        setProducers((prev) => [...prev, { ...producer, isProducer: true }]);
      }
    } catch (error) {
      console.error("Error approving producer:", error);
    }
  };

  const rejectProducer = async (userId: string) => {
    if (!confirm("Tem certeza que deseja rejeitar este produtor?")) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        producerName: null,
        taxId: null,
        businessEmail: null,
        documentUrl: null,
      });
      setPendingProducers((prev) => prev.filter((p) => p.id !== userId));
    } catch (error) {
      console.error("Error rejecting producer:", error);
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
          { ...producer, isProducer: false },
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
      <div className="flex gap-2">
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
      {tab === "pending" ? (
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
                  </div>
                  <p className="text-gray-400">{producer.displayName}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>{producer.email}</span>
                    {producer.businessEmail && (
                      <span>Comercial: {producer.businessEmail}</span>
                    )}
                    {producer.taxId && <span>CNPJ: {producer.taxId}</span>}
                  </div>
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
                    onClick={() => rejectProducer(producer.id)}
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
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm bg-gray-800/50">
                  <th className="px-6 py-4">Nome Comercial</th>
                  <th className="px-6 py-4">Responsável</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">CNPJ</th>
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
                      colSpan={5}
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
