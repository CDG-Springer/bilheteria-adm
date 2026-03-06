import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  X,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

type EventStatus = "pending" | "approved" | "rejected";

interface LotData {
  priceInteira: number;
  priceMeia: number;
  capacity: number;
  sold: number;
  endDate?: string;
}

interface SectorData {
  lots: LotData[];
}

interface EventData {
  id: string;
  eventName: string;
  category: string;
  date: string;
  time?: string;
  location: string;
  imageUrl: string;
  description?: string;
  producerId: string;
  status?: EventStatus;
  rejectionReason?: string;
  createdAt?: unknown;
  freeEvent?: boolean;
  sectors?: Record<string, SectorData>;
  // Campos legados (eventos antigos)
  pricePistaInteira?: number;
  capacityPista?: number;
  soldPista?: number;
}

// Helpers para extrair dados de eventos (compativel com formato antigo e novo)
function getEventPrice(event: EventData): number {
  if (event.sectors) {
    const firstSector = Object.values(event.sectors)[0];
    if (firstSector?.lots?.[0]) {
      return firstSector.lots[0].priceInteira ?? 0;
    }
  }
  return event.pricePistaInteira ?? 0;
}

function getEventCapacity(event: EventData): number {
  if (event.sectors) {
    let total = 0;
    for (const sector of Object.values(event.sectors)) {
      for (const lot of sector.lots || []) {
        total += lot.capacity || 0;
      }
    }
    return total;
  }
  return event.capacityPista ?? 0;
}

function getEventSold(event: EventData): number {
  if (event.sectors) {
    let total = 0;
    for (const sector of Object.values(event.sectors)) {
      for (const lot of sector.lots || []) {
        total += lot.sold || 0;
      }
    }
    return total;
  }
  return event.soldPista ?? 0;
}

export default function Events() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusTab, setStatusTab] = useState<EventStatus>("pending");
  const [detailEvent, setDetailEvent] = useState<EventData | null>(null);
  const [editEvent, setEditEvent] = useState<EventData | null>(null);
  const [editForm, setEditForm] = useState<Partial<EventData>>({});
  const [saving, setSaving] = useState(false);
  const [rejectingEventId, setRejectingEventId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let result = events;

    // Filtrar por status (aba ativa)
    result = result.filter((e) => {
      const eventStatus = e.status || "pending";
      return eventStatus === statusTab;
    });

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.eventName?.toLowerCase().includes(s) ||
          e.location?.toLowerCase().includes(s),
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((e) => e.category === categoryFilter);
    }

    setFilteredEvents(result);
  }, [search, categoryFilter, events, statusTab]);

  const fetchEvents = async () => {
    try {
      const snap = await getDocs(collection(db, "events"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventData[];
      setEvents(data);
      setFilteredEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    try {
      await deleteDoc(doc(db, "events", eventId));
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setFilteredEvents((prev) => prev.filter((e) => e.id !== eventId));
      setDetailEvent((e) => (e?.id === eventId ? null : e));
      setEditEvent((e) => (e?.id === eventId ? null : e));
      toast.success("Evento excluído.");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Erro ao excluir evento. Tente novamente.");
    }
  };

  const approveEvent = async (eventId: string) => {
    try {
      await updateDoc(doc(db, "events", eventId), { status: "approved" });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "approved" as EventStatus } : e)),
      );
      toast.success("Evento aprovado com sucesso!");
    } catch (error) {
      console.error("Error approving event:", error);
      toast.error("Erro ao aprovar evento.");
    }
  };

  const rejectEvent = async (eventId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Informe o motivo da rejeição.");
      return;
    }
    try {
      const event = events.find((e) => e.id === eventId);
      await updateDoc(doc(db, "events", eventId), {
        status: "rejected",
        rejectionReason: reason.trim(),
      });

      // Criar notificação para o produtor
      if (event?.producerId) {
        await addDoc(collection(db, "notifications"), {
          userId: event.producerId,
          type: "event_rejected",
          title: "Evento Rejeitado",
          message: `Seu evento "${event.eventName}" foi rejeitado. Motivo: ${reason.trim()}`,
          eventId,
          eventName: event.eventName,
          rejectionReason: reason.trim(),
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, status: "rejected" as EventStatus, rejectionReason: reason.trim() }
            : e,
        ),
      );
      setRejectingEventId(null);
      setRejectionReason("");
      toast.success("Evento rejeitado.");
    } catch (error) {
      console.error("Error rejecting event:", error);
      toast.error("Erro ao rejeitar evento.");
    }
  };

  const openEdit = (event: EventData) => {
    setEditEvent(event);
    setEditForm({
      eventName: event.eventName,
      category: event.category,
      date: event.date,
      time: event.time ?? "",
      location: event.location,
      imageUrl: event.imageUrl,
      description: event.description ?? "",
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveEdit = async () => {
    if (!editEvent) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        eventName: editForm.eventName,
        category: editForm.category,
        date: editForm.date,
        time: editForm.time || null,
        location: editForm.location,
        imageUrl: editForm.imageUrl,
        description: editForm.description || null,
      };
      await updateDoc(doc(db, "events", editEvent.id), payload);
      setEvents((prev) =>
        prev.map((e) => (e.id === editEvent.id ? { ...e, ...payload } : e)),
      );
      setFilteredEvents((prev) =>
        prev.map((e) => (e.id === editEvent.id ? { ...e, ...payload } : e)),
      );
      setEditEvent(null);
      toast.success("Evento atualizado.");
    } catch (error) {
      console.error("Error updating event:", error);
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

  const pendingCount = events.filter((e) => (e.status || "pending") === "pending").length;
  const approvedCount = events.filter((e) => e.status === "approved").length;
  const rejectedCount = events.filter((e) => e.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Eventos</h1>
        <span className="text-gray-400">{filteredEvents.length} evento(s)</span>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStatusTab("pending")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            statusTab === "pending"
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
              : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"
          }`}
        >
          <Clock size={16} />
          Pendentes
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-yellow-500/30 text-yellow-300">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setStatusTab("approved")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            statusTab === "approved"
              ? "bg-green-500/20 text-green-400 border border-green-500/50"
              : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"
          }`}
        >
          <CheckCircle size={16} />
          Aprovados
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-300">
            {approvedCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStatusTab("rejected")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            statusTab === "rejected"
              ? "bg-red-500/20 text-red-400 border border-red-500/50"
              : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"
          }`}
        >
          <XCircle size={16} />
          Rejeitados
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-300">
            {rejectedCount}
          </span>
        </button>
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
            placeholder="Buscar por nome ou local..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todas categorias</option>
            <option value="Evento">Evento</option>
            <option value="Festival">Festival</option>
            <option value="Show">Show</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden group"
          >
            <div className="relative h-40">
              <img
                src={event.imageUrl}
                alt={event.eventName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                  {event.category}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  (event.status || "pending") === "pending"
                    ? "bg-yellow-500/80 text-white"
                    : event.status === "approved"
                    ? "bg-green-500/80 text-white"
                    : "bg-red-500/80 text-white"
                }`}>
                  {(event.status || "pending") === "pending"
                    ? "Pendente"
                    : event.status === "approved"
                    ? "Aprovado"
                    : "Rejeitado"}
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-white truncate">
                {event.eventName}
              </h3>

              <div className="mt-3 space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">A partir de</p>
                  <p className="text-lg font-bold text-white">
                    {event.freeEvent ? (
                      <span className="text-green-400">Gratuito</span>
                    ) : (
                      formatCurrency(getEventPrice(event))
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Vendidos</p>
                  <p className="text-sm text-gray-300">
                    {getEventSold(event)}/{getEventCapacity(event)}
                  </p>
                </div>
              </div>

              {/* Motivo da rejeição */}
              {event.status === "rejected" && event.rejectionReason && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400 font-medium mb-1">Motivo da rejeição:</p>
                  <p className="text-sm text-red-300">{event.rejectionReason}</p>
                </div>
              )}

              {/* Botões de aprovação para eventos pendentes */}
              {(event.status || "pending") === "pending" && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => approveEvent(event.id)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <CheckCircle size={16} />
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingEventId(event.id)}
                      className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <XCircle size={16} />
                      Rejeitar
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailEvent(event)}
                      className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id)}
                      className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Botões padrão para eventos aprovados/rejeitados */}
              {(event.status === "approved" || event.status === "rejected") && (
                <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailEvent(event)}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(event)}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEvent(event.id)}
                    className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {statusTab === "pending"
            ? "Nenhum evento pendente de aprovação"
            : statusTab === "approved"
            ? "Nenhum evento aprovado"
            : "Nenhum evento rejeitado"}
        </div>
      )}

      {/* Modal Ver detalhes */}
      {detailEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setDetailEvent(null)}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Detalhes do evento</h2>
              <button
                type="button"
                onClick={() => setDetailEvent(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg overflow-hidden border border-gray-800">
                <img
                  src={detailEvent.imageUrl}
                  alt={detailEvent.eventName}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div>
                <span className="text-gray-500 block text-sm">Nome</span>
                <p className="text-white font-semibold text-lg">{detailEvent.eventName}</p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <span className="text-gray-500 block text-sm">Categoria</span>
                  <span className="text-white">{detailEvent.category}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Data</span>
                  <span className="text-white">{formatDate(detailEvent.date)}</span>
                </div>
                {detailEvent.time && (
                  <div>
                    <span className="text-gray-500 block text-sm">Horário</span>
                    <span className="text-white">{detailEvent.time}</span>
                  </div>
                )}
              </div>
              <div>
                <span className="text-gray-500 block text-sm">Local</span>
                <p className="text-white">{detailEvent.location}</p>
              </div>
              {detailEvent.description && (
                <div>
                  <span className="text-gray-500 block text-sm">Descrição</span>
                  <p className="text-white text-sm">{detailEvent.description}</p>
                </div>
              )}
              <div className="pt-2 border-t border-gray-800 space-y-3">
                {detailEvent.freeEvent && (
                  <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                    Evento Gratuito
                  </span>
                )}
                {detailEvent.sectors ? (
                  Object.entries(detailEvent.sectors).map(([key, sector]) => (
                    <div key={key} className="space-y-2">
                      <span className="text-gray-400 block text-sm font-medium capitalize">
                        Setor {key}
                      </span>
                      {sector.lots?.map((lot, i) => (
                        <div key={i} className="grid grid-cols-3 gap-4 pl-3 border-l-2 border-gray-700">
                          <div>
                            <span className="text-gray-500 block text-xs">
                              {sector.lots.length > 1 ? `${i + 1}º Lote - Preço` : "Preço"}
                            </span>
                            <span className="text-white font-semibold">
                              {detailEvent.freeEvent ? "Gratuito" : formatCurrency(lot.priceInteira)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Capacidade</span>
                            <span className="text-white">{lot.capacity}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Vendidos</span>
                            <span className="text-white">{lot.sold ?? 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 block text-sm">Preço Pista (inteira)</span>
                      <span className="text-white font-semibold">{formatCurrency(detailEvent.pricePistaInteira ?? 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-sm">Vendidos / Capacidade</span>
                      <span className="text-white">
                        {detailEvent.soldPista ?? 0} / {detailEvent.capacityPista ?? 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className="text-gray-500 block text-sm">ID do evento</span>
                <span className="text-gray-400 text-xs font-mono break-all">{detailEvent.id}</span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailEvent(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailEvent(null);
                  openEdit(detailEvent);
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
      {editEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setEditEvent(null)}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Editar evento</h2>
              <button
                type="button"
                onClick={() => setEditEvent(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do evento</label>
                <input
                  type="text"
                  name="eventName"
                  value={editForm.eventName ?? ""}
                  onChange={handleEditChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Categoria</label>
                  <select
                    name="category"
                    value={editForm.category ?? ""}
                    onChange={handleEditChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                  >
                    <option value="Evento">Evento</option>
                    <option value="Festival">Festival</option>
                    <option value="Show">Show</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Data</label>
                  <input
                    type="date"
                    name="date"
                    value={editForm.date ?? ""}
                    onChange={handleEditChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Horário</label>
                <input
                  type="time"
                  name="time"
                  value={editForm.time ?? ""}
                  onChange={handleEditChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Local</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location ?? ""}
                  onChange={handleEditChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL da imagem</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={editForm.imageUrl ?? ""}
                  onChange={handleEditChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <textarea
                  name="description"
                  value={editForm.description ?? ""}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white resize-none"
                />
              </div>
              {/* Setores e lotes (somente leitura) */}
              {editEvent?.sectors && (
                <div className="space-y-2">
                  <label className="block text-sm text-gray-400 mb-1">Setores e Lotes</label>
                  {Object.entries(editEvent.sectors).map(([key, sector]) => (
                    <div key={key} className="bg-gray-800 rounded-lg p-3 space-y-1">
                      <span className="text-white font-medium capitalize text-sm">Setor {key}</span>
                      {sector.lots?.map((lot, i) => (
                        <div key={i} className="flex gap-4 text-xs text-gray-400 pl-2">
                          <span>{sector.lots.length > 1 ? `${i + 1}º Lote` : "Lote"}</span>
                          <span>Preço: {editEvent.freeEvent ? "Gratuito" : formatCurrency(lot.priceInteira)}</span>
                          <span>Cap: {lot.capacity}</span>
                          <span>Vendidos: {lot.sold ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">Os preços e capacidades dos lotes são definidos pelo produtor.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditEvent(null)}
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

      {/* Modal Rejeitar */}
      {rejectingEventId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => {
            setRejectingEventId(null);
            setRejectionReason("");
          }}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Rejeitar Evento</h2>
              <button
                type="button"
                onClick={() => {
                  setRejectingEventId(null);
                  setRejectionReason("");
                }}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm">
                Informe o motivo da rejeição para que o produtor saiba o que precisa corrigir.
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Motivo da rejeição</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Ex: Imagem de baixa qualidade, descrição incompleta..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white resize-none placeholder-gray-500 focus:outline-none focus:border-red-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingEventId(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => rejectEvent(rejectingEventId, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2"
              >
                <XCircle size={16} />
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
