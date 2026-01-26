import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
} from "lucide-react";

interface EventData {
  id: string;
  eventName: string;
  category: string;
  date: string;
  location: string;
  imageUrl: string;
  pricePistaInteira: number;
  capacityPista: number;
  soldPista: number;
  producerId: string;
  createdAt: any;
}

export default function Events() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let result = events;

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
  }, [search, categoryFilter, events]);

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
    } catch (error) {
      console.error("Error deleting event:", error);
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
        <h1 className="text-2xl font-bold text-white">Eventos</h1>
        <span className="text-gray-400">{filteredEvents.length} evento(s)</span>
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
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                  {event.category}
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
                    {formatCurrency(event.pricePistaInteira)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Vendidos</p>
                  <p className="text-sm text-gray-300">
                    {event.soldPista}/{event.capacityPista}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
                <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Eye size={16} />
                  Ver
                </button>
                <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Edit size={16} />
                  Editar
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhum evento encontrado
        </div>
      )}
    </div>
  );
}
