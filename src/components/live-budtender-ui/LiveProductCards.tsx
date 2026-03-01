import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ChevronRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import type { LiveRecommendedProduct } from '../../lib/types';

interface LiveProductCardsProps {
    products: LiveRecommendedProduct[];
}

export default function LiveProductCards({ products }: LiveProductCardsProps) {
    const addItem = useCartStore((s) => s.addItem);
    const cartItems = useCartStore((s) => s.items);

    if (products.length === 0) return null;

    return (
        <div className="border-t border-white/[0.06]">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <Package className="w-3 h-3 text-green-neon" />
                <p className="text-[9px] font-black tracking-[0.2em] text-zinc-500 uppercase">
                    Produits suggérés
                </p>
                <span className="text-[9px] bg-green-neon/10 text-green-neon px-1.5 py-0.5 rounded-full font-bold">
                    {products.length}
                </span>
            </div>

            {/* Horizontal scroll of cards */}
            <div className="flex gap-2.5 px-4 pb-3 overflow-x-auto snap-x snap-mandatory custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {products.map((rec, i) => {
                        const { product } = rec;
                        const isInCart = cartItems.some((item) => item.product.id === product.id);

                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.08, type: 'spring', damping: 20 }}
                                className="snap-start flex-shrink-0 w-[180px] bg-zinc-800/40 hover:bg-zinc-800/60 border border-zinc-700/40 hover:border-green-neon/20 rounded-2xl overflow-hidden transition-all group"
                            >
                                {/* Product image */}
                                <div className="relative h-24 bg-zinc-900 overflow-hidden">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-8 h-8 text-zinc-700" />
                                        </div>
                                    )}
                                    {/* CBD badge */}
                                    {product.cbd_percentage && (
                                        <span className="absolute top-1.5 left-1.5 bg-green-neon text-black text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                            {product.cbd_percentage}% CBD
                                        </span>
                                    )}
                                    {/* In cart badge */}
                                    {isInCart && (
                                        <span className="absolute top-1.5 right-1.5 bg-green-neon/20 text-green-neon text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-green-neon/30">
                                            Dans le panier
                                        </span>
                                    )}
                                </div>

                                {/* Product info */}
                                <div className="p-2.5 space-y-1.5">
                                    <Link
                                        to={`/catalogue/${product.slug}`}
                                        className="text-[11px] font-bold text-white hover:text-green-neon line-clamp-2 leading-tight transition-colors"
                                    >
                                        {product.name}
                                    </Link>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-green-neon">{product.price}€</span>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => addItem(product)}
                                            className="w-7 h-7 rounded-lg bg-green-neon/10 hover:bg-green-neon text-green-neon hover:text-black flex items-center justify-center transition-all"
                                            title="Ajouter au panier"
                                        >
                                            <ShoppingCart className="w-3 h-3" />
                                        </motion.button>
                                    </div>
                                    {rec.reason && (
                                        <p className="text-[9px] text-zinc-500 truncate flex items-center gap-1">
                                            <ChevronRight className="w-2.5 h-2.5" />
                                            {rec.reason}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
