import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Tag, Loader2, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function Categories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const queryClient = useQueryClient();

  // Buscar categorias
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const q = query(collection(db, "categories"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
    },
  });

  // Criar categoria
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await addDoc(collection(db, "categories"), {
        name: name.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada com sucesso!");
      setIsDialogOpen(false);
      setCategoryName("");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });

  // Atualizar categoria
  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const categoryRef = doc(db, "categories", id);
      await updateDoc(categoryRef, {
        name: name.trim(),
        updatedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada com sucesso!");
      setIsDialogOpen(false);
      setEditingCategory(null);
      setCategoryName("");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });

  // Deletar categoria
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const categoryRef = doc(db, "categories", id);
      await deleteDoc(categoryRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria deletada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao deletar categoria: " + error.message);
    },
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }

    // Verificar se já existe categoria com o mesmo nome
    const existingCategory = categories?.find(
      (cat) =>
        cat.name.toLowerCase() === categoryName.trim().toLowerCase() &&
        cat.id !== editingCategory?.id
    );

    if (existingCategory) {
      toast.error("Já existe uma categoria com este nome");
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name: categoryName });
    } else {
      createMutation.mutate(categoryName);
    }
  };

  const handleDelete = (category: Category) => {
    if (
      window.confirm(
        `Tem certeza que deseja deletar a categoria "${category.name}"?`
      )
    ) {
      deleteMutation.mutate(category.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Tag className="w-8 h-8" />
            Categorias de Eventos
          </h1>
          <p className="text-gray-400 mt-2">
            Gerencie as categorias disponíveis para os produtores criarem eventos
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-medium">Nome</th>
                <th className="text-left p-4 text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4 text-white font-medium">{category.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDialog(category)}
                          className="flex items-center gap-1 px-3 py-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="text-center text-gray-400 py-8">
                    Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para criar/editar */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </h2>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 mb-4">
              {editingCategory
                ? "Atualize o nome da categoria"
                : "Digite o nome da nova categoria de eventos"}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Categoria
                </label>
                <input
                  id="name"
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Show, Festival, Teatro..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    !categoryName.trim()
                  }
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingCategory
                    ? "Atualizar"
                    : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
