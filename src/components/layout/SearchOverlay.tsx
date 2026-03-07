/**
 * SearchOverlay.tsx
 *
 * Full-screen search modal with real-time keyword + vector results.
 * Shows categories, products with ratings/aromas/benefits, and popular suggestions.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Leaf, Sparkles } from 'lucide-react';
import StarRating from '../StarRating';
import { SearchResults } from '../../services/searchService';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    searchQuery: string;
    onQueryChange: (query: string) => void;
    searchResults: SearchResults;
    isSearching: boolean;
}

const POPULAR_SUGGESTIONS = ['Amnesia', 'N10', 'Huile CBD', 'Fleurs', 'Résines'];

export default function SearchOverlay({
    isOpen,
    onClose,
    searchQuery,
    onQueryChange,
    searchResults,
    isSearching,
}: SearchOverlayProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-xl flex items-start justify-center pt-20 px-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-3xl bg-zinc-900/80 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden glassmorphism"
                    >
                        <div className="p-8 space-y-8">
                            {/* Search input */}
                            <div className="relative">
                                <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors ${isSearching ? 'text-green-neon animate-pulse' : 'text-zinc-500'}`} />
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onQueryChange(e.target.value)}
                                    placeholder="Que cherchez-vous ?"
                                    className="w-full bg-white/[0.04] border border-white/5 rounded-2xl pl-16 pr-20 py-5 text-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-neon/30 transition-all font-serif italic"
                                />
                                <button
                                    onClick={onClose}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Results area */}
                            <div className="min-h-[100px] max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {searchQuery.length >= 2 ? (
                                    <div className="space-y-10">
                                        {/* Category results */}
                                        {searchResults.categories.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 flex items-center gap-3">
                                                    <span className="w-8 h-[1px] bg-white/10" />
                                                    Collections
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {searchResults.categories.map((cat) => (
                                                        <Link
                                                            key={cat.id}
                                                            to={`/catalogue?category=${cat.id}`}
                                                            onClick={onClose}
                                                            className="group p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-green-neon/[0.03] hover:border-green-neon/20 transition-all"
                                                        >
                                                            <p className="text-sm font-bold text-white group-hover:text-green-neon transition-colors truncate">{cat.name}</p>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Product results */}
                                        {searchResults.products.length > 0 ? (
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 flex items-center gap-3">
                                                    <span className="w-8 h-[1px] bg-white/10" />
                                                    Produits Premium
                                                </h3>
                                                <div className="space-y-3">
                                                    {searchResults.products.map((prod) => (
                                                        <Link
                                                            key={prod.id}
                                                            to={`/catalogue/${prod.slug}`}
                                                            onClick={onClose}
                                                            className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/5 bg-zinc-800">
                                                                    <img src={prod.image_url || ''} alt={prod.name} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-white group-hover:text-green-neon transition-colors">{prod.name}</p>
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{prod.category?.name}</p>
                                                                            {prod.avg_rating && prod.avg_rating > 0 && (
                                                                                <>
                                                                                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                                                    <StarRating rating={prod.avg_rating} size="sm" showCount={false} />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                            {prod.attributes?.aromas?.slice(0, 2).map((aroma: string, i: number) => (
                                                                                <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[8px] text-zinc-400 font-bold uppercase tracking-tighter">
                                                                                    <Leaf className="w-2 h-2 text-green-neon/50 shrink-0" />
                                                                                    <span className="truncate max-w-[60px]">{aroma}</span>
                                                                                </div>
                                                                            ))}
                                                                            {prod.attributes?.benefits?.slice(0, 2).map((benefit: string, i: number) => (
                                                                                <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-neon/[0.03] border border-green-neon/10 text-[8px] text-green-neon font-bold uppercase tracking-tighter">
                                                                                    <Sparkles className="w-2 h-2 shrink-0" />
                                                                                    <span className="truncate max-w-[60px]">{benefit}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-sm font-black text-white">{prod.price.toFixed(2)}€</p>
                                                                {prod.original_value && prod.original_value > prod.price ? (
                                                                    <p className="text-[10px] text-zinc-500 line-through">{prod.original_value.toFixed(2)}€</p>
                                                                ) : (
                                                                    <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-tighter italic opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Voir détail</p>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            !isSearching && (
                                                <div className="text-center py-10">
                                                    <p className="text-zinc-500 text-sm italic">Aucun produit trouvé pour &ldquo;{searchQuery}&rdquo;</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : searchQuery.length > 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-zinc-500 text-sm">Tapez au moins 2 caractères...</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 space-y-6">
                                        <p className="text-zinc-500 text-sm uppercase tracking-[0.2em] font-bold">Suggestions Populaires</p>
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {POPULAR_SUGGESTIONS.map((term) => (
                                                <button
                                                    key={term}
                                                    onClick={() => onQueryChange(term)}
                                                    className="px-6 py-2.5 bg-white/[0.03] border border-white/10 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:border-green-neon/30 transition-all"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-black/50 border-t border-white/5 p-4 text-[10px] text-center text-zinc-600 font-bold uppercase tracking-[0.3em]">
                            Appuyez sur <span className="text-zinc-400">ESC</span> pour fermer
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
