import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ArrowUpDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product, StockMovement } from '../../lib/types';

interface AdminStockTabProps {
    products: Product[];
    movements: StockMovement[];
    onRefresh: () => void;
}

export default function AdminStockTab({ products, movements, onRefresh }: AdminStockTabProps) {
    const [stockAdjust, setStockAdjust] = useState<{ id: string; qty: string; note: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleStockAdjust = async () => {
        if (!stockAdjust) return;
        const qty = parseInt(stockAdjust.qty);
        if (isNaN(qty) || qty === 0) return;
        setIsSaving(true);
        const product = products.find((p) => p.id === stockAdjust.id);
        if (!product) { setIsSaving(false); return; }
        const newStock = Math.max(0, product.stock_quantity + qty);
        await supabase.from('products').update({ stock_quantity: newStock }).eq('id', stockAdjust.id);
        await supabase.from('stock_movements').insert({
            product_id: stockAdjust.id,
            quantity_change: qty,
            type: qty > 0 ? 'restock' : 'adjustment',
            note: stockAdjust.note || 'Ajustement manuel',
        });
        onRefresh();
        setStockAdjust(null);
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            {/* Alerts */}
            {products.some((p) => p.stock_quantity <= 5) && (
                <div className="bg-orange-900/10 border border-orange-800 rounded-2xl p-5">
                    <p className="text-orange-400 font-medium text-sm flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        Produits à réapprovisionner en priorité
                    </p>
                    <div className="space-y-2">
                        {products
                            .filter((p) => p.stock_quantity <= 5)
                            .sort((a, b) => a.stock_quantity - b.stock_quantity)
                            .map((p) => (
                                <div key={p.id} className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-300">{p.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`font-bold text-sm ${p.stock_quantity === 0 ? 'text-red-400' : 'text-orange-400'}`}
                                        >
                                            {p.stock_quantity === 0 ? 'Rupture' : `${p.stock_quantity} restant${p.stock_quantity > 1 ? 's' : ''}`}
                                        </span>
                                        <button
                                            onClick={() => setStockAdjust({ id: p.id, qty: '', note: 'Réapprovisionnement' })}
                                            className="text-xs bg-orange-900/40 hover:bg-orange-900/70 border border-orange-800 text-orange-400 px-3 py-1 rounded-lg transition-colors"
                                        >
                                            + Réappro
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Stock adjustment form */}
            <AnimatePresence>
                {stockAdjust && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-zinc-900 border border-green-primary/50 rounded-2xl p-5"
                    >
                        <p className="text-sm font-medium text-white mb-3">
                            Ajustement —{' '}
                            <span className="text-green-neon">
                                {products.find((p) => p.id === stockAdjust.id)?.name}
                            </span>
                            <span className="ml-2 text-zinc-500 text-xs">
                                (stock actuel : {products.find((p) => p.id === stockAdjust.id)?.stock_quantity})
                            </span>
                        </p>
                        <div className="flex gap-3 flex-wrap">
                            <input
                                type="number"
                                placeholder="+20 réappro ou -2 casse"
                                value={stockAdjust.qty}
                                onChange={(e) => setStockAdjust({ ...stockAdjust, qty: e.target.value })}
                                className="w-44 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-primary"
                            />
                            <input
                                type="text"
                                placeholder="Raison (réappro, retour client, casse…)"
                                value={stockAdjust.note}
                                onChange={(e) => setStockAdjust({ ...stockAdjust, note: e.target.value })}
                                className="flex-1 min-w-40 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-primary"
                            />
                            <button
                                onClick={handleStockAdjust}
                                disabled={isSaving}
                                className="bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                                {isSaving ? 'Confirmation…' : 'Confirmer'}
                            </button>
                            <button
                                onClick={() => setStockAdjust(null)}
                                className="text-zinc-400 hover:text-white px-3 text-sm transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* All products stock levels */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800">
                    <h2 className="font-serif font-semibold">Niveaux de stock</h2>
                </div>
                <div className="divide-y divide-zinc-800">
                    {products.map((product) => {
                        const pct = Math.min(100, (product.stock_quantity / 50) * 100);
                        return (
                            <div key={product.id} className="px-5 py-3.5 flex items-center gap-4">
                                <div
                                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${product.stock_quantity === 0
                                        ? 'bg-red-400'
                                        : product.stock_quantity <= 5
                                            ? 'bg-orange-400'
                                            : 'bg-green-400'
                                        }`}
                                />
                                <span className="text-sm text-white flex-1">{product.name}</span>
                                <div className="hidden sm:flex items-center gap-2 w-32">
                                    <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${product.stock_quantity === 0
                                                ? 'bg-red-500'
                                                : product.stock_quantity <= 5
                                                    ? 'bg-orange-500'
                                                    : 'bg-green-500'
                                                }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                                <span
                                    className={`font-semibold text-sm w-16 text-right ${product.stock_quantity === 0
                                        ? 'text-red-400'
                                        : product.stock_quantity <= 5
                                            ? 'text-orange-400'
                                            : 'text-white'
                                        }`}
                                >
                                    {product.stock_quantity}
                                </span>
                                <button
                                    onClick={() => setStockAdjust({ id: product.id, qty: '', note: '' })}
                                    className="p-1.5 text-zinc-500 hover:text-green-neon hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <ArrowUpDown className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Movements history */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="px-5 py-4 border-b border-zinc-800">
                    <h2 className="font-serif font-semibold">Historique des mouvements</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-zinc-800/40">
                                <th className="px-5 py-3">Date & heure</th>
                                <th className="px-5 py-3">Produit</th>
                                <th className="px-5 py-3">Variation</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {movements.map((mv) => (
                                <tr key={mv.id} className="hover:bg-zinc-800/20 transition-colors">
                                    <td className="px-5 py-3 text-xs text-zinc-500">
                                        {new Date(mv.created_at).toLocaleDateString('fr-FR')}{' '}
                                        {new Date(mv.created_at).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-white">
                                        {(mv.product as { name?: string })?.name ?? '—'}
                                    </td>
                                    <td
                                        className={`px-5 py-3 font-bold ${mv.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}`}
                                    >
                                        {mv.quantity_change > 0 ? '+' : ''}
                                        {mv.quantity_change}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full border ${mv.type === 'sale'
                                                ? 'text-blue-400 bg-blue-900/20 border-blue-800'
                                                : mv.type === 'restock'
                                                    ? 'text-green-400 bg-green-900/20 border-green-800'
                                                    : mv.type === 'return'
                                                        ? 'text-purple-400 bg-purple-900/20 border-purple-800'
                                                        : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                                                }`}
                                        >
                                            {mv.type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-xs text-zinc-500">{mv.note ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {movements.length === 0 && (
                        <p className="text-zinc-500 text-center py-10">Aucun mouvement de stock.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
