import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Tag, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ActionFeedback, EmptyState, ErrorState, LoadingState } from '../components/ui/state-feedback';
import {
  categoriesControllerCreate,
  categoriesControllerFindAll,
  categoriesControllerRemove,
  categoriesControllerUpdate,
} from '../lib/api-client';
import type { CategoryDto } from '../lib/api-client/models';

// Regras de validação do formulário (as mesmas do backend)
const categorySchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'O título deve ter no mínimo 2 caracteres.')
    .max(60, 'O título deve ter no máximo 60 caracteres.'),
  description: z.string().max(255, 'A descrição deve ter no máximo 255 caracteres.'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Extrai a mensagem de erro que a API devolveu 
function getErrorMessage(err: unknown, fallback: string): string {
  return (
    (err as { detail?: string })?.detail ||
    (err as { message?: string })?.message ||
    fallback
  );
}

export function CategoriesPage() {
  const queryClient = useQueryClient();

  // ---------- Memória da tela ----------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ---------- Buscar a lista de categorias (GET) ----------
  const {
    data: categories = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesControllerFindAll();
      return res.data as CategoryDto[];
    },
  });

  // ---------- Formulário ----------
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { title: '', description: '' },
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ title: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryDto) => {
    setEditingCategory(category);
    reset({ title: category.title, description: category.description ?? '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  // ---------- Criar ou editar (POST / PUT) ----------
  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const payload = { title: values.title, description: values.description.trim() };
      if (editingCategory) {
        const res = await categoriesControllerUpdate(editingCategory.id, payload);
        return res.data;
      }
      const res = await categoriesControllerCreate(payload);
      return res.data;
    },
    onSuccess: () => {
      setFeedback({
        type: 'success',
        message: editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!',
      });
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: unknown) => {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'Não foi possível salvar a categoria.') });
    },
  });

  // ---------- Excluir (DELETE) ----------
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await categoriesControllerRemove(id);
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Categoria excluída com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: unknown) => {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'Não foi possível excluir a categoria.') });
    },
  });

  const handleFormSubmit = (values: CategoryFormValues) => {
    setFeedback(null);
    saveMutation.mutate(values);
  };

  const handleDelete = (category: CategoryDto) => {
    const confirmed = window.confirm(
      `Excluir a categoria "${category.title}"? As tarefas dessa categoria ficarão sem categoria.`,
    );
    if (confirmed) {
      setFeedback(null);
      deleteMutation.mutate(category.id);
    }
  };

  // ---------- Desenho da tela ----------
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-600" />
            Gerenciamento de Categorias
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Categorias globais usadas para organizar as tarefas de todos os usuários.
          </p>
        </div>

        <Button onClick={openCreateModal} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Mensagem de sucesso/erro */}
      {feedback && (
        <ActionFeedback type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />
      )}

      {/* Lista ou estados (carregando / erro / vazio) */}
      {isLoading ? (
        <LoadingState message="Carregando categorias..." />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar categorias"
          message="Não foi possível consultar a lista de categorias."
          onRetry={() => refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria cadastrada"
          description="Crie categorias para organizar as tarefas."
          action={
            <Button size="sm" onClick={openCreateModal}>
              Criar primeira categoria
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Título</th>
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {category.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {category.description || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1.5"
                          onClick={() => openEditModal(category)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1.5"
                          isLoading={deleteMutation.isPending && deleteMutation.variables === category.id}
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Total de <strong>{categories.length}</strong> categorias
          </div>
        </Card>
      )}

      {/* Modal de criar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <Input
                label="Título"
                placeholder="Ex.: Estudos"
                {...register('title')}
                error={errors.title?.message}
              />

              <Input
                label="Descrição (opcional)"
                placeholder="Ex.: Tarefas da faculdade"
                {...register('description')}
                error={errors.description?.message}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" isLoading={saveMutation.isPending}>
                  {editingCategory ? 'Salvar alterações' : 'Criar categoria'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}