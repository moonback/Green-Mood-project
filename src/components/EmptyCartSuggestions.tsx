import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Star, Sparkles, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useBudTenderMemory, SavedPrefs } from '../hooks/useBudTenderMemory';
import { CATEGORY_SLUGS } from '../lib/constants';
import { useAuthStore } from '../store/authStore';

interface ProductWithScore extends Product {
    score?: number;
}

export default function EmptyCartSuggestions() {
    const [products, setProducts] = useState<ProductWithScore[]>([]);
    const [loading, setLoading] = useState(true);
    const addItem = useCartStore((s) => s.addItem);
    const closeSidebar = useCartStore((s) => s.closeSidebar);
    const { savedPrefs } = useBudTenderMemory();
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        fetchSuggestions();
    }, [savedPrefs]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .eq('is_active', true)
                .eq('is_available', true)
                .gt('stock_quantity', 0)
                .order('is_featured', { ascending: false })
                .limit(15);

            if (error) throw error;

            let processed = (data as Product[]) || [];

            if (savedPrefs) {
                processed = processed.map(p => ({
                    ...p,
                    score: scoreProduct(p, savedPrefs)
                })).sort((a, b) => (b.score || 0) - (a.score || 0));
            }

            setProducts(processed.slice(0, 3));
        } catch (err) {
            console.error('[EmptyCartSuggestions] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    function scoreProduct(product: Product, prefs: SavedPrefs): number {
        let score = 0;
        const cat = product.category?.slug ?? '';
        const name = product.name.toLowerCase();
        const desc = (product.description ?? '').toLowerCase();

        if (prefs.goal === 'sleep') {
            if (name.includes('sommeil') || desc.includes('sommeil') || desc.includes('nuit')) score += 5;
            if (cat === CATEGORY_SLUGS.OILS && (product.cbd_percentage ?? 0) >= 15) score += 3;
        }
        if (prefs.goal === 'stress') {
            if (desc.includes('détente') || desc.includes('stress') || desc.includes('relaxat')) score += 5;
        }
        if (prefs.goal === 'pain') {
            if ((product.cbd_percentage ?? 0) >= 20) score += 5;
        }

        if (prefs.format === 'oil' && cat === CATEGORY_SLUGS.OILS) score += 4;
        if (prefs.format === 'flower' && (cat === CATEGORY_SLUGS.FLOWERS || cat === CATEGORY_SLUGS.RESINS)) score += 4;
        if (prefs.format === 'infusion' && cat === CATEGORY_SLUGS.INFUSIONS) score += 4;

        if (product.is_featured) score += 2;

        return score;
    }

    const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
    };

    if (loading) {
        return (
            <div className="w-full space-y-3 px-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!user) return null;

    if (products.length === 0) return null;

    return (
        <div className="w-full space-y-4 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 px-2">
                <Sparkles className="w-3.5 h-3.5 text-green-neon" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Suggestions pour vous
                </p>
            </div>

            <div className="space-y-3">
                {products.map((product, idx) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative"
                    >
                        <Link
                            to={`/catalogue/${product.slug}`}
                            onClick={closeSidebar}
                            className="flex gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 hover:bg-white/[0.05] transition-all cursor-pointer"
                        >
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                <img src={product.image_url ?? ''} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {product.is_featured && (
                                    <div className="absolute top-0 right-0 w-4 h-4 bg-green-neon rounded-full flex items-center justify-center text-black shadow-lg translate-x-1/2 -translate-y-1/2">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                <h4 className="font-serif text-[11px] font-bold text-white group-hover:text-green-neon transition-colors line-clamp-1">
                                    {product.name}
                                </h4>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-green-neon">
                                        {Number(product.price).toFixed(2)}€
                                    </p>
                                    <button
                                        onClick={(e) => handleQuickAdd(e, product)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-green-neon group/add transition-all border border-white/5 hover:border-green-neon shrink-0"
                                    >
                                        <span className="text-[8px] font-black uppercase text-zinc-500 group-hover/add:text-black">Ajouter</span>
                                        <Plus className="w-2.5 h-2.5 text-green-neon group-hover/add:text-black" />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
