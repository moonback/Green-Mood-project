import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ArrowLeft, ShoppingBag, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useWishlistStore } from '../store/wishlistStore';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

export default function Favorites() {
    const { items: wishlistIds } = useWishlistStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadFavorites() {
            if (wishlistIds.length === 0) {
                setProducts([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, category:categories(*)')
                    .in('id', wishlistIds)
                    .eq('is_active', true);

                if (error) throw error;

                // Fetch ratings for these products
                if (data && data.length > 0) {
                    const productIds = data.map((p) => p.id);
                    const { data: ratingsData } = await supabase
                        .from('reviews')
                        .select('product_id, rating')
                        .in('product_id', productIds)
                        .eq('is_published', true);

                    const ratingMap = new Map<string, { sum: number; count: number }>();
                    (ratingsData ?? []).forEach((r: { product_id: string; rating: number }) => {
                        const cur = ratingMap.get(r.product_id) ?? { sum: 0, count: 0 };
                        ratingMap.set(r.product_id, { sum: cur.sum + r.rating, count: cur.count + 1 });
                    });

                    const withRatings = data.map((p) => {
                        const r = ratingMap.get(p.id);
                        return r ? { ...p, avg_rating: r.sum / r.count, review_count: r.count } : p;
                    });
                    setProducts(withRatings as Product[]);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadFavorites();
    }, [wishlistIds]);

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
            <SEO title="Mes Favoris — L'Excellence Green Mood" description="Retrouvez vos sélections préférées." />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-black uppercase tracking-widest transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Retour au Hub
                        </Link>
                        <h1 className="text-4xl md:text-4xl font-serif font-black tracking-tight leading-none">
                            MES <br /><span className="text-green-neon italic">FAVORIS.</span>
                        </h1>
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600 md:text-right">
                        SÉLECTIONS PRÉVENTIVES — {wishlistIds.length} ITEMS
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[4/5] bg-white/[0.04] rounded-2xl" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 bg-white/[0.04] rounded-lg w-1/2" />
                                    <div className="h-8 bg-white/[0.04] rounded-xl w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-green-neon/5 rounded-full blur-xl" />
                            <Heart className="w-10 h-10 text-zinc-700" />
                        </div>
                        <div className="space-y-3">
                            <p className="font-serif text-2xl font-black text-white">Votre liste est vide</p>
                            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
                                Parcourez notre catalogue pour ajouter vos produits préférés à votre sélection.
                            </p>
                        </div>
                        <Link
                            to="/catalogue"
                            className="bg-zinc-900 border border-white/10 text-white font-black uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-green-neon hover:text-black hover:border-transparent transition-all"
                        >
                            Explorer le Catalogue
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        <AnimatePresence mode="popLayout">
                            {products.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{
                                        delay: idx * 0.05,
                                        duration: 0.4,
                                        ease: [0.25, 0.1, 0.25, 1]
                                    }}
                                    layout
                                >
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
