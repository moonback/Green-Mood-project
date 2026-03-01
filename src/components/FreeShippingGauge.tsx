import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Plus, CheckCircle2, PackageOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';

interface FreeShippingGaugeProps {
    /** compact = sidebar, full = cart page */
    variant?: 'compact' | 'full';
}

export default function FreeShippingGauge({ variant = 'compact' }: FreeShippingGaugeProps) {
    const { settings } = useSettingsStore();
    const { subtotal, deliveryType, items, addItem } = useCartStore();
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [addedId, setAddedId] = useState<string | null>(null);

    const sub = subtotal();
    const threshold = settings.delivery_free_threshold;
    const remaining = Math.max(0, threshold - sub);
    const percent = Math.min(100, (sub / threshold) * 100);
    const isUnlocked = remaining === 0;

    // Only show when delivery mode is selected and threshold > 0
    const shouldShow = deliveryType === 'delivery' && threshold > 0;

    // Fetch cheap products not already in cart, whose price ≤ remaining+buffer
    useEffect(() => {
        if (!shouldShow || isUnlocked) return;
        const cartIds = items.map((i) => i.product.id);

        supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .eq('is_available', true)
            .gt('stock_quantity', 0)
            .lte('price', remaining + 5) // small buffer so we show items just above too
            .order('price', { ascending: true })
            .limit(4)
            .then(({ data }) => {
                if (data) {
                    // Exclude already-in-cart items
                    setSuggestions((data as Product[]).filter((p) => !cartIds.includes(p.id)).slice(0, 3));
                }
            });
    }, [shouldShow, isUnlocked, remaining, items]);

    const handleAdd = (product: Product) => {
        addItem(product);
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1800);
    };

    if (!shouldShow) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border overflow-hidden ${isUnlocked
                ? 'border-green-neon/30 bg-green-neon/5'
                : 'border-zinc-700/60 bg-zinc-900/70'
                } ${variant === 'full' ? 'p-4' : 'px-4 pt-3 pb-3'}`}
        >
            {/* Header row */}
            <div className="flex items-center gap-2 mb-2">
                {isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-green-neon flex-shrink-0" />
                ) : (
                    <Truck className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                )}
                <p className={`text-xs font-semibold ${isUnlocked ? 'text-green-neon' : 'text-zinc-300'}`}>
                    {isUnlocked
                        ? 'Livraison offerte débloquée 🎉'
                        : `Plus que ${remaining.toFixed(2)} € pour la livraison gratuite !`}
                </p>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden mb-1">
                <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${isUnlocked ? 'bg-green-neon' : 'bg-gradient-to-r from-green-neon/60 to-green-neon'
                        }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                {/* Shimmer on incomplete */}
                {!isUnlocked && (
                    <motion.div
                        className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ left: ['-15%', '110%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                    />
                )}
            </div>

            {/* Threshold labels */}
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
                <span>{sub.toFixed(2)} €</span>
                <span>{threshold.toFixed(0)} €</span>
            </div>

            {/* Quick-add suggestions */}
            {/* <AnimatePresence>
                {!isUnlocked && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2"
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <PackageOpen className="w-3 h-3 text-zinc-500" />
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                                Ajouter pour débloquer
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            {suggestions.map((product) => {
                                const isAdded = addedId === product.id;
                                const newTotal = sub + product.price;
                                const wouldUnlock = newTotal >= threshold;
                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        className={`flex items-center gap-2.5 rounded-lg p-2 border transition-colors ${isAdded
                                                ? 'border-green-neon/40 bg-green-neon/8'
                                                : 'border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600'
                                            }`}
                                    >
                                        {product.image_url && (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-9 h-9 object-cover rounded-md flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-white truncate">{product.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-xs text-zinc-400 font-semibold">
                                                    {product.price.toFixed(2)} €
                                                </span>
                                                {wouldUnlock && (
                                                    <span className="text-[10px] text-green-neon font-medium bg-green-neon/10 px-1.5 py-0.5 rounded-full">
                                                        Livraison offerte !
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAdd(product)}
                                            disabled={isAdded}
                                            aria-label={`Ajouter ${product.name} au panier`}
                                            className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isAdded
                                                    ? 'bg-green-neon/20 text-green-neon cursor-default'
                                                    : 'bg-zinc-700 hover:bg-green-neon hover:text-black text-zinc-300'
                                                }`}
                                        >
                                            {isAdded ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : (
                                                <Plus className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence> */}
        </motion.div>
    );
}
