import { useAuth } from "@/contexts/AuthContext";
import { Bell, User } from "lucide-react";

export default function AdminHeader() {
  const { currentUser } = useAuth();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between">
      <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
      <h2 className="text-lg font-semibold text-white hidden lg:block">
        Painel de Administração - Bilheteria
      </h2>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

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
