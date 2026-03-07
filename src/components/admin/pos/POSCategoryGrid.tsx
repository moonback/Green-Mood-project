import { LayoutGrid, Star, ArrowLeft } from 'lucide-react';
import { Category } from '../../../lib/types';
import { motion } from 'motion/react';

interface POSCategoryGridProps {
    categories: Category[];
    onSelectCategory: (categoryId: string) => void;
    onBack?: () => void;
    isLightTheme?: boolean;
}

export default function POSCategoryGrid({ categories, onSelectCategory, onBack, isLightTheme }: POSCategoryGridProps) {
    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center gap-4 shrink-0">
                {onBack && (
                    <button
                        onClick={onBack}
                        className={`p-4 border rounded-3xl transition-all group ${isLightTheme
                            ? 'bg-white hover:bg-emerald-50 border-emerald-100 text-emerald-400 hover:text-emerald-900 shadow-sm'
                            : 'bg-zinc-800/30 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                )}
                <div>
                    <h2 className={`text-2xl font-black uppercase tracking-tight ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Catégories</h2>
                    <p className={`text-sm font-medium ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Sélectionnez une catégorie pour voir les articles</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                    {/* All Products */}
                    <motion.button
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectCategory('all')}
                        className={`flex flex-col items-center justify-center gap-4 border rounded-[2rem] p-8 transition-all group shadow-xl ${isLightTheme
                            ? 'bg-white hover:bg-emerald-50 border-emerald-100 hover:border-green-500/50 shadow-emerald-100/50'
                            : 'bg-zinc-900/40 hover:bg-zinc-800 border-zinc-800 hover:border-green-500/50'
                            }`}
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors ${isLightTheme ? 'bg-emerald-50 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            <LayoutGrid className="w-8 h-8" />
                        </div>
                        <h3 className={`font-black text-lg transition-colors group-hover:text-green-500 ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Tous les produits</h3>
                    </motion.button>

                    {/* Favorites */}
                    <motion.button
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectCategory('favorites')}
                        className={`flex flex-col items-center justify-center gap-4 border rounded-[2rem] p-8 transition-all group shadow-xl ${isLightTheme
                            ? 'bg-white hover:bg-emerald-50 border-emerald-100 hover:border-amber-500/50 shadow-emerald-100/50'
                            : 'bg-zinc-900/40 hover:bg-zinc-800 border-zinc-800 hover:border-amber-500/50'
                            }`}
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors ${isLightTheme ? 'bg-emerald-50 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            <Star className="w-8 h-8" />
                        </div>
                        <h3 className={`font-black text-lg transition-colors group-hover:text-amber-500 ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Favoris</h3>
                    </motion.button>

                    {/* Dynamic Categories */}
                    {categories.map((cat) => (
                        <motion.button
                            key={cat.id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelectCategory(cat.id)}
                            className={`flex flex-col items-center justify-center gap-4 border rounded-[2rem] p-8 transition-all group shadow-xl ${isLightTheme
                                ? 'bg-white hover:bg-emerald-50 border-emerald-100 hover:border-emerald-400 shadow-emerald-100/50'
                                : 'bg-zinc-900/40 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-500'
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isLightTheme ? 'bg-emerald-50 text-emerald-400 group-hover:bg-emerald-100 group-hover:text-emerald-900' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 hover:text-white'}`}>
                                <span className="text-2xl font-black">{cat.name.charAt(0)}</span>
                            </div>
                            <h3 className={`font-black text-lg transition-colors truncate w-full text-center ${isLightTheme ? 'text-emerald-950 group-hover:text-emerald-900' : 'text-white group-hover:text-zinc-300'}`}>
                                {cat.name}
                            </h3>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
