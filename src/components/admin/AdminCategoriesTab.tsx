import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit3, Trash2, X, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../lib/types';
import CSVImporter from './CSVImporter';
import { slugify } from '../../lib/utils';

interface AdminCategoriesTabProps {
    categories: Category[];
    onRefresh: () => void;
}

const INPUT =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors';
const LABEL = 'block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wider';

export default function AdminCategoriesTab({ categories, onRefresh }: AdminCategoriesTabProps) {
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
    const paginatedCategories = categories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const openCategoryModal = (cat?: Category) => {
        if (cat) {
            setEditingCategoryId(cat.id);
            setCategoryForm({ ...cat });
        } else {
            setEditingCategoryId(null);
            setCategoryForm({ name: '', slug: '', description: '', is_active: true, sort_order: categories.length });
        }
        setShowCategoryModal(true);
    };

    const handleSaveCategory = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const payload = { ...categoryForm, slug: categoryForm.slug || slugify(categoryForm.name ?? '') };
        if (editingCategoryId) {
            await supabase.from('categories').update(payload).eq('id', editingCategoryId);
        } else {
            await supabase.from('categories').insert(payload);
        }
        setShowCategoryModal(false);
        onRefresh();
        setIsSaving(false);
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Désactiver cette catégorie ?')) return;
        await supabase.from('categories').update({ is_active: false }).eq('id', id);
        onRefresh();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <CSVImporter
                    type="categories"
                    onComplete={onRefresh}
                    exampleUrl="/examples/categories_example.csv"
                />

                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-green-neon shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            title="Vue Liste"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-green-neon shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            title="Vue Grille"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => openCategoryModal()}
                        className="flex items-center gap-2 bg-green-neon hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nouvelle catégorie
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-zinc-800/50">
                                    <th className="px-5 py-4 font-bold">Catégorie</th>
                                    <th className="px-5 py-4 font-bold">Slug</th>
                                    <th className="px-5 py-4 font-bold">Produits</th>
                                    <th className="px-5 py-4 font-bold">Ordre</th>
                                    <th className="px-5 py-4 font-bold">Statut</th>
                                    <th className="px-5 py-4 text-right font-bold flex-shrink-0">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/80">
                                {paginatedCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-zinc-800/40 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-xl border border-zinc-700/50 bg-zinc-800 overflow-hidden">
                                                    {cat.image_url ? (
                                                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px] uppercase font-bold">
                                                            N/A
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white text-sm group-hover:text-green-neon transition-colors line-clamp-1">{cat.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                /{cat.slug}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-bold text-white text-sm">
                                                {Array.isArray(cat.products) ? cat.products[0]?.count ?? 0 : (cat.products as any)?.count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-white text-sm">
                                            {cat.sort_order}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-lg border ${cat.is_active
                                                    ? 'text-green-400 bg-green-900/20 border-green-800/50'
                                                    : 'text-red-400 bg-red-900/20 border-red-800/50'
                                                    }`}
                                            >
                                                {cat.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openCategoryModal(cat)}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
                                                    title="Désactiver"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedCategories.map((cat) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
                        >
                            {cat.image_url && (
                                <div className="relative h-36 overflow-hidden">
                                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-white">{cat.name}</h3>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            /{cat.slug} · ordre {cat.sort_order} · {Array.isArray(cat.products) ? cat.products[0]?.count ?? 0 : (cat.products as any)?.count ?? 0} produit{(Array.isArray(cat.products) ? cat.products[0]?.count ?? 0 : (cat.products as any)?.count ?? 0) > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${cat.is_active
                                            ? 'text-green-400 bg-green-900/30 border-green-800'
                                            : 'text-red-400 bg-red-900/30 border-red-800'
                                            }`}
                                    >
                                        {cat.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {cat.description && (
                                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{cat.description}</p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openCategoryModal(cat)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-zinc-500 font-medium text-sm px-4">
                        Page {currentPage} sur {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            )}

            {categories.length === 0 && (
                <p className="text-zinc-500 text-center py-10">Aucune catégorie.</p>
            )}

            {/* Category Modal */}
            <AnimatePresence>
                {showCategoryModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCategoryModal(false)}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl z-50"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                                <h2 className="font-serif text-xl font-bold">
                                    {editingCategoryId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                                </h2>
                                <button onClick={() => setShowCategoryModal(false)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                                <div>
                                    <label className={LABEL}>Nom *</label>
                                    <input
                                        required
                                        value={categoryForm.name ?? ''}
                                        onChange={(e) =>
                                            setCategoryForm({ ...categoryForm, name: e.target.value, slug: slugify(e.target.value) })
                                        }
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Slug</label>
                                    <input
                                        value={categoryForm.slug ?? ''}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Description</label>
                                    <textarea
                                        rows={2}
                                        value={categoryForm.description ?? ''}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>URL Image</label>
                                    <input
                                        type="url"
                                        value={categoryForm.image_url ?? ''}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value || null })}
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Ordre d'affichage</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={categoryForm.sort_order ?? 0}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) })}
                                        className={INPUT}
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.is_active ?? true}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                        className="w-4 h-4 accent-green-600"
                                    />
                                    <span className="text-sm text-zinc-300">Catégorie active</span>
                                </label>
                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                                    >
                                        {isSaving ? 'Enregistrement…' : editingCategoryId ? 'Mettre à jour' : 'Créer'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryModal(false)}
                                        className="px-6 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
