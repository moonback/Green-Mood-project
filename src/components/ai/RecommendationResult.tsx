/**
 * RecommendationResult.tsx
 *
 * Renders the BudTender quiz result: recommended product cards with quick-add-to-cart,
 * a feedback section, and an ambassador/share promo code panel.
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, Share2, Copy, CheckCircle2, Gift, Sparkles } from 'lucide-react';
import { BudTenderFeedback } from '../budtender-ui';
import { Product } from '../../lib/types';

interface RecommendationResultProps {
    products: Product[];
    hasShared: boolean;
    showPromoTooltip: boolean;
    onAddToCart: (product: Product) => void;
    onFeedback: (type: string) => void;
    onShare: () => void;
    onCopyPromoCode: (code: string) => void;
    onViewProduct: () => void;
}

export default function RecommendationResult({
    products,
    hasShared,
    showPromoTooltip,
    onAddToCart,
    onFeedback,
    onShare,
    onCopyPromoCode,
    onViewProduct,
}: RecommendationResultProps) {
    return (
        <div className="space-y-4 pt-3">
            <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase px-1">Sélection sur-mesure</p>

            {/* Product cards */}
            {products.map((product, i) => (
                <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-4 bg-zinc-800/40 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-green-neon/30 p-4 rounded-[1.5rem] transition-all group"
                >
                    <div className="relative flex-shrink-0">
                        <img
                            src={product.image_url || ''}
                            className="w-16 h-16 rounded-2xl object-cover bg-zinc-900 shadow-md transition-transform group-hover:scale-105"
                            alt={product.name}
                        />
                        {product.cbd_percentage && (
                            <span className="absolute -top-1 -left-1 bg-green-neon text-black text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                                {product.cbd_percentage}%
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <Link
                            to={`/catalogue/${product.slug}`}
                            onClick={onViewProduct}
                            className="text-sm font-bold text-white hover:text-green-neon line-clamp-1"
                        >
                            {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-base font-black text-green-neon">{product.price}€</p>
                            {product.original_value && (
                                <p className="text-[10px] text-zinc-500 line-through">{product.original_value}€</p>
                            )}
                        </div>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onAddToCart(product)}
                        className="w-10 h-10 rounded-xl bg-green-neon hover:bg-green-400 text-black flex items-center justify-center transition-all shadow-lg hover:shadow-green-neon/20"
                    >
                        <ShoppingCart className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            ))}

            {/* Feedback */}
            <BudTenderFeedback onFeedback={onFeedback} />

            {/* Ambassador / Share section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6 bg-gradient-to-br from-green-neon/10 to-transparent border border-green-neon/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Gift className="w-12 h-12 text-green-neon" />
                </div>

                {!hasShared ? (
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-neon" />
                            <p className="text-xs font-black uppercase tracking-wider text-white">Cadeau Ambassadeur 🏆</p>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Partagez vos résultats ou invitez un ami à faire le test pour débloquer un code promo de{' '}
                            <span className="text-green-neon font-bold">-10%</span> sur votre commande !
                        </p>
                        <button
                            onClick={onShare}
                            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs border border-zinc-700"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            Partager &amp; Débloquer
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-2 text-green-neon">
                            <CheckCircle2 className="w-4 h-4" />
                            <p className="text-xs font-black uppercase tracking-wider">Lien Partagé !</p>
                        </div>
                        <div className="bg-zinc-950/50 border border-green-neon/30 rounded-xl p-3 flex items-center justify-between group">
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Votre code :</p>
                                <p className="text-lg font-black text-green-neon tracking-tighter">BUDTENDER10</p>
                            </div>
                            <button
                                onClick={() => onCopyPromoCode('BUDTENDER10')}
                                className="relative p-2 bg-green-neon/10 hover:bg-green-neon text-green-neon hover:text-black rounded-lg transition-all"
                            >
                                <Copy className="w-4 h-4" />
                                {showPromoTooltip && (
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap shadow-xl">
                                        Copié !
                                    </span>
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 text-center italic">Valable sur tout le catalogue Green Mood.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
