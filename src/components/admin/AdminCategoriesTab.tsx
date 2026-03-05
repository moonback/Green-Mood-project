import { Plus, Search, Tag, Trash2 } from 'lucide-react';
import type { Category } from '../../lib/types';

export default function AdminCategoriesTab({ categories, searchQuery, setSearchQuery, onOpenModal, onDeleteCategory }: {
  categories: Category[]; searchQuery: string; setSearchQuery: (v: string) => void; onOpenModal: () => void; onDeleteCategory: (id: string) => void;
}) {
  return <div className="space-y-4">
    <div className="flex justify-between"><h2 className="flex items-center gap-2"><Tag className="w-5 h-5" />Catégories</h2><button onClick={onOpenModal}><Plus className="w-4 h-4" />Ajouter</button></div>
    <div className="relative"><Search className="absolute left-2 top-2 w-4 h-4" /><input className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
    {categories.map((category) => <div key={category.id} className="flex justify-between border rounded p-2"><span>{category.name}</span><button onClick={() => onDeleteCategory(category.id)}><Trash2 className="w-4 h-4" /></button></div>)}
  </div>;
}
