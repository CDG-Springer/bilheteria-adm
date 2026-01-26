import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, isConfigValid } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AlertCircle } from "lucide-react";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async (user: User) => {
    if (!db) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc && userDoc.exists()) {
        setIsAdmin(userDoc.data().isAdmin === true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.warn("Error fetching user role:", error);
      setIsAdmin(false);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (!isConfigValid || !auth) {
      setError("Configuração do Firebase inválida. Verifique o arquivo .env");
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          setCurrentUser(user);
          if (user) {
            await fetchUserRole(user);
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Auth Error:", err);
          setError("Erro na autenticação: " + err.message);
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch (e: any) {
      console.error("Auth Init Error:", e);
      setError("Erro ao inicializar: " + e.message);
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-lg max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro de Configuração</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const value = {
    currentUser,
    loading,
    isAdmin,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">Carregando...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
