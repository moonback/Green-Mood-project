import { Search, Package, Plus, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../../lib/types';
import { CartLine } from './types';

interface POSProductGridProps {
    products: Product[];
    cart: CartLine[];
    isLoading: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    onAddToCart: (p: Product) => void;
    onBack: () => void;
    categoryName: string;
}

export default function POSProductGrid({
    products,
    cart,
    isLoading,
    searchQuery,
    setSearchQuery,
    onAddToCart,
    onBack,
    categoryName
}: POSProductGridProps) {
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when the product list changes
    useEffect(() => {
        setCurrentPage(1);
    }, [products, searchQuery]);

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header & Search */}
            <div className="flex items-center gap-4 shrink-0">
                <button
                    onClick={onBack}
                    className="p-4 bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-800 rounded-3xl text-zinc-400 hover:text-white transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Rechercher dans ${categoryName}...`}
                        className="w-full bg-black/40 border border-zinc-800 rounded-3xl pl-14 pr-6 py-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50 focus:bg-black/60 transition-all shadow-inner"
                    />
                </div>
                <div className="px-4 py-2 bg-zinc-800/30 rounded-2xl border border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest hidden sm:block">
                    {products.length} Produits
                </div>
            </div>

            {/* Grid wrapper with scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className="bg-zinc-800/20 rounded-[2rem] h-56 animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                        <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                            <Package className="w-10 h-10 opacity-10" />
                        </div>
                        <p className="font-black uppercase tracking-[0.2em] text-xs">Aucun résultat trouvé</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start pb-10">
                        {paginatedProducts.map((product) => {
                            const inCart = cart.find((l) => l.product.id === product.id);
                            return (
                                <motion.button
                                    key={product.id}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onAddToCart(product)}
                                    className={`group relative flex flex-col items-center text-center rounded-[2.5rem] border transition-all overflow-hidden p-2 ${inCart
                                        ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.1)]'
                                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60 shadow-xl'
                                        }`}
                                >
                                    {/* Badge stock */}
                                    <div className="absolute top-4 left-4 z-10">
                                        {product.stock_quantity <= 5 && (
                                            <div className="flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-red-900/50">
                                                Low
                                            </div>
                                        )}
                                    </div>

                                    {/* Img Container */}
                                    <div className="w-full aspect-square rounded-[2rem] bg-zinc-800 overflow-hidden mb-4 relative shadow-2xl">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-10 h-10 text-zinc-700" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                            <div className="bg-white text-black p-3 rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-300">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-2 pb-4 w-full">
                                        <h4 className="text-sm font-black text-white truncate px-1">{product.name}</h4>
                                        <div className="flex items-center justify-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{product.stock_quantity} g</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                            <span className="text-lg font-black text-green-400">{product.price.toFixed(2)}€</span>
                                        </div>
                                    </div>

                                    {inCart && (
                                        <div className="absolute top-4 right-4 w-7 h-7 bg-green-500 text-black font-black text-xs rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-in zoom-in duration-300">
                                            {inCart.quantity}
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && products.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between shrink-0 bg-zinc-900/40 p-4 rounded-[2rem] border border-zinc-800">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-white rounded-xl transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-bold text-sm hidden sm:block mr-2">Page {currentPage} sur {totalPages}</span>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${currentPage === i + 1
                                        ? 'bg-green-500 text-black'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-white rounded-xl transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
