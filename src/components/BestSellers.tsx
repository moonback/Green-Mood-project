import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import ProductCard from './ProductCard';

export default function BestSellers() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchBestSellers() {
            try {
                // Since we don't have a direct 'sales_count' field, 
                // we fetch the most recently 'featured' products as a proxy,
                // or we could do a more complex join if needed.
                // For now, let's fetch products marked as is_featured.
                const { data, error } = await supabase
                    .from('products')
                    .select('*, category:categories(*)')
                    .eq('is_active', true)
                    .eq('is_available', true)
                    .eq('is_featured', true)
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (error) throw error;
                setProducts(data || []);
            } catch (err) {
                console.error('Error fetching best sellers:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchBestSellers();
    }, []);

    if (!isLoading && products.length === 0) return null;

    return (
        <section className="py-24 md:py-32 px-5 bg-zinc-950 relative overflow-hidden">
            {/* Decorative Gradient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.03)_0%,transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-neon/10 border border-green-neon/20 text-green-neon text-[10px] font-bold uppercase tracking-[0.2em]"
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                            SÉLECTION ÉLITE
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight"
                        >
                            Nos <span className="text-green-neon italic">Meilleures Ventes</span>
                        </motion.h2>
                        <p className="text-zinc-500 text-lg md:text-xl font-light max-w-2xl">
                            Découvrez les molécules les plus plébiscitées par la communauté Green Mood pour leur pureté et leurs effets exceptionnels.
                        </p>
                    </div>

                    <Link to="/catalogue" className="group flex items-center gap-3 bg-white/[0.03] border border-white/10 px-8 py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest hover:bg-green-neon hover:text-black transition-all">
                        Voir tout le catalogue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-6">
                                <div className="aspect-[3/4] bg-white/5 rounded-[2.5rem]" />
                                <div className="space-y-3 px-4">
                                    <div className="h-4 bg-white/5 rounded w-1/3" />
                                    <div className="h-6 bg-white/5 rounded w-3/4" />
                                    <div className="h-8 bg-white/5 rounded-xl w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                        {products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.6 }}
                            >
                                <div className="relative group">
                                    {/* Premium Label for Best Sellers */}
                                    <div className="absolute -top-3 -right-3 z-20 bg-green-neon text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg rotate-12 group-hover:rotate-0 transition-transform flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" />
                                        TOP VENTES
                                    </div>
                                    <ProductCard product={product} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
