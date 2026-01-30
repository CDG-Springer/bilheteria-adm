import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Lock, Mail, AlertCircle, HelpCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      // Verificar se é admin
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (!userDoc.exists() || !userDoc.data().isAdmin) {
        await auth.signOut();
        setError("Acesso negado. Sua conta não tem permissão de administrador. Peça a um admin para marcar isAdmin no Firestore ou use uma conta criada pelo script create-admin.");
        setLoading(false);
        return;
      }

      navigate("/");
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      console.error(err);
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError(
          "Email ou senha incorretos. Use o mesmo email e senha do cadastro na bilheteria (se um admin já tiver marcado isAdmin para você) ou crie uma conta com: node scripts/create-admin.js seu@email.com SuaSenha"
        );
      } else if (code === "auth/too-many-requests") {
        setError("Muitas tentativas. Tente novamente mais tarde.");
      } else if (code === "auth/invalid-email") {
        setError("Formato de email inválido.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4">
            <span className="text-3xl">🎫</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Painel Administrativo
          </h1>
          <p className="text-gray-400 mt-2">
            Acesse sua conta de administrador
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-2xl p-8 border border-gray-800"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  size={20}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  size={20}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Sistema exclusivo para administradores
        </p>

        <div className="mt-6 border-t border-gray-800 pt-6">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center justify-center gap-2 w-full text-gray-400 hover:text-purple-400 text-sm transition-colors"
          >
            <HelpCircle size={18} />
            {showHelp ? "Ocultar" : "Como criar minha conta de administrador?"}
          </button>
          {showHelp && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg text-left text-sm text-gray-300 space-y-3">
              <p>
                O login usa <strong>Firebase Authentication</strong>. Você precisa ter um usuário criado com o mesmo email e senha que digita aqui.
              </p>
              <p className="font-medium">Opção 1 – Script (recomendado)</p>
              <p className="text-gray-400">
                Na pasta do painel, no terminal: <br />
                <code className="block mt-1 p-2 bg-gray-900 rounded text-purple-300 text-xs break-all">
                  npm run create-admin -- seu@email.com SuaSenha123
                </code>
                Ou: <code className="text-purple-300">node scripts/create-admin.js seu@email.com SuaSenha123</code>
                <br />
                Use depois <strong>exatamente</strong> esse email e senha nesta tela.
              </p>
              <p className="font-medium">Opção 2 – Cadastro na bilheteria + Firestore</p>
              <p className="text-gray-400">
                Cadastre-se na bilheteria (event-tickets-now). Depois, no Firebase Console → Firestore → coleção <code>users</code> → documento com o UID do seu usuário, adicione o campo <code>isAdmin: true</code>. Use aqui o mesmo email e senha da bilheteria.
              </p>
              <p className="font-medium">Opção 3 – Só pelo Firebase Console</p>
              <p className="text-gray-400">
                Authentication → Add user (email e senha). Anote o UID. Firestore → coleção <code>users</code> → Add document com esse UID como ID e campos <code>email</code>, <code>isAdmin: true</code>. Use esse email e senha aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
