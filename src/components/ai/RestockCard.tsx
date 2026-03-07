/**
 * RestockCard.tsx
 *
 * Displays a restock reminder card inside a BudTender chat message.
 * Shows product image, days since last purchase, price, and quick-add-to-cart action.
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, ShoppingCart } from 'lucide-react';
import { Product } from '../../lib/types';

export interface RestockProduct {
    product_id: string;
    product_name: string;
    slug: string | null;
    image_url: string | null;
    price: number;
    daysSince: number;
}

interface RestockCardProps {
    restockProduct: RestockProduct;
    allProducts: Product[];
    onAddToCart: (product: Product) => void;
    onViewProduct: () => void;
}

export default function RestockCard({ restockProduct, allProducts, onAddToCart, onViewProduct }: RestockCardProps) {
    const handleAddToCart = () => {
        const product = allProducts.find(p => p.id === restockProduct.product_id);
        if (product) onAddToCart(product);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 space-y-3"
        >
            <div className="flex items-center gap-2 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black tracking-widest uppercase">Rappel de Stock</span>
            </div>
            <div className="flex items-center gap-3">
                {restockProduct.image_url && (
                    <img
                        src={restockProduct.image_url}
                        alt={restockProduct.product_name}
                        className="w-14 h-14 rounded-xl object-cover bg-zinc-900 flex-shrink-0"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white line-clamp-1">{restockProduct.product_name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Commandé il y a <span className="text-amber-400 font-bold">{restockProduct.daysSince}j</span>
                    </p>
                    <p className="text-base font-black text-green-neon mt-1">{restockProduct.price.toFixed(2)} €</p>
                </div>
            </div>
            <div className="flex gap-2">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-neon hover:bg-green-400 text-black font-black text-xs py-2.5 rounded-xl transition-all"
                >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Réapprovisionner
                </motion.button>
                {restockProduct.slug && (
                    <Link
                        to={`/catalogue/${restockProduct.slug}`}
                        onClick={onViewProduct}
                        className="px-3 py-2.5 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center"
                    >
                        Voir
                    </Link>
                )}
            </div>
        </motion.div>
    );
}
