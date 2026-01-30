import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Bell, User, ChevronRight, Loader2 } from "lucide-react";

export default function AdminHeader() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingProducersCount, setPendingProducersCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchPendingCount = async () => {
    if (!db) return;
    setLoadingCount(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const count = snap.docs.filter(
        (d) => (d.data() as { producerStatus?: string }).producerStatus === "pending"
      ).length;
      setPendingProducersCount(count);
    } catch {
      setPendingProducersCount(0);
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  useEffect(() => {
    if (notificationsOpen) {
      fetchPendingCount();
    }
  }, [notificationsOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToProducers = () => {
    setNotificationsOpen(false);
    navigate("/producers");
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between">
      <div className="lg:hidden w-10" />
      <h2 className="text-lg font-semibold text-white hidden lg:block">
        Painel de Administração - Bilheteria
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((v) => !v)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
            title="Notificações"
          >
            <Bell size={20} />
            {pendingProducersCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-gray-900" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold text-white">Notificações</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {loadingCount ? (
                  <div className="p-6 flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 size={18} className="animate-spin" />
                    Carregando...
                  </div>
                ) : pendingProducersCount > 0 ? (
                  <button
                    type="button"
                    onClick={goToProducers}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors border-b border-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 text-amber-400">
                        {pendingProducersCount}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">
                          Solicitações de produtor
                        </p>
                        <p className="text-xs text-gray-400">
                          {pendingProducersCount === 1
                            ? "1 cadastro aguardando aprovação"
                            : `${pendingProducersCount} cadastros aguardando aprovação`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-500 shrink-0" />
                  </button>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    Nenhuma notificação pendente
                  </div>
                )}
              </div>
              {pendingProducersCount > 0 && (
                <div className="p-2 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={goToProducers}
                    className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Ver todos em Produtores
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              {currentUser?.displayName || "Admin"}
            </p>
            <p className="text-xs text-gray-400">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
