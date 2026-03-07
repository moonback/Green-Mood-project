import { LayoutGrid, Star, ArrowLeft } from 'lucide-react';
import { Category } from '../../../lib/types';
import { motion } from 'motion/react';

interface POSCategoryGridProps {
    categories: Category[];
    onSelectCategory: (categoryId: string) => void;
    onBack?: () => void;
}

export default function POSCategoryGrid({ categories, onSelectCategory, onBack }: POSCategoryGridProps) {
    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center gap-4 shrink-0">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-4 bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-800 rounded-3xl text-zinc-400 hover:text-white transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Catégories</h2>
                    <p className="text-sm text-zinc-500 font-medium">Sélectionnez une catégorie pour voir les articles</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                    {/* All Products */}
                    <motion.button
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectCategory('all')}
                        className="flex flex-col items-center justify-center gap-4 bg-zinc-900/40 hover:bg-zinc-800 border border-zinc-800 hover:border-green-500/50 rounded-[2rem] p-8 transition-all group shadow-xl"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-400 text-zinc-400 transition-colors">
                            <LayoutGrid className="w-8 h-8" />
                        </div>
                        <h3 className="font-black text-lg text-white group-hover:text-green-400 transition-colors">Tous les produits</h3>
                    </motion.button>

                    {/* Favorites */}
                    <motion.button
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectCategory('favorites')}
                        className="flex flex-col items-center justify-center gap-4 bg-zinc-900/40 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-[2rem] p-8 transition-all group shadow-xl"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 group-hover:text-amber-400 text-zinc-400 transition-colors">
                            <Star className="w-8 h-8" />
                        </div>
                        <h3 className="font-black text-lg text-white group-hover:text-amber-400 transition-colors">Favoris</h3>
                    </motion.button>

                    {/* Dynamic Categories */}
                    {categories.map((cat) => (
                        <motion.button
                            key={cat.id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelectCategory(cat.id)}
                            className="flex flex-col items-center justify-center gap-4 bg-zinc-900/40 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500 rounded-[2rem] p-8 transition-all group shadow-xl"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 text-zinc-400 transition-colors">
                                <span className="text-2xl font-black">{cat.name.charAt(0)}</span>
                            </div>
                            <h3 className="font-black text-lg text-white group-hover:text-zinc-300 transition-colors truncate w-full text-center">
                                {cat.name}
                            </h3>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
