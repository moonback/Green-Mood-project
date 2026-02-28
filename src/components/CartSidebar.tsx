import { Link } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Package, Truck, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCartStore } from '../store/cartStore';
import FreeShippingGauge from './FreeShippingGauge';

export default function CartSidebar() {
  const {
    items,
    isOpen,
    deliveryType,
    closeSidebar,
    removeItem,
    updateQuantity,
    setDeliveryType,
    itemCount,
    subtotal,
    deliveryFee,
    total,
  } = useCartStore();

  const sub = subtotal();
  const fee = deliveryFee();
  const tot = total();
  const count = itemCount();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-[60] flex flex-col bg-zinc-950 border-l border-white/[0.06] shadow-2xl"
          >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="relative flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
              {/* subtle top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-neon/40 to-transparent" />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-neon/10 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-green-neon" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-base leading-tight">Mon Panier</h2>
                  {count > 0 && (
                    <p className="text-[11px] text-zinc-500 leading-none mt-0.5">
                      {count} article{count > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={closeSidebar}
                aria-label="Fermer le panier"
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Empty state ─────────────────────────────────────────── */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-zinc-700" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold flex items-center justify-center">
                    0
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-base">Votre panier est vide</p>
                  <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
                    Découvrez nos produits CBD premium et commencez votre sélection.
                  </p>
                </div>
                <Link
                  to="/catalogue"
                  onClick={closeSidebar}
                  className="group flex items-center gap-2 bg-green-neon text-black font-bold px-6 py-3 rounded-xl hover:bg-green-400 transition-colors text-sm"
                >
                  Voir le catalogue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ) : (
              <>
                {/* ── Delivery toggle ───────────────────────────────────── */}
                <div className="px-5 py-3 border-b border-white/[0.06]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">
                    Mode de réception
                  </p>
                  <div className="relative grid grid-cols-2 gap-1.5 bg-zinc-900 rounded-xl p-1">
                    {/* Sliding pill */}
                    <motion.div
                      layout
                      className="absolute inset-y-1 w-[calc(50%-6px)] rounded-lg bg-zinc-700"
                      animate={{ left: deliveryType === 'click_collect' ? 4 : 'calc(50% + 2px)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                    <button
                      onClick={() => setDeliveryType('click_collect')}
                      className={`relative z-10 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${deliveryType === 'click_collect' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      Click &amp; Collect
                    </button>
                    <button
                      onClick={() => setDeliveryType('delivery')}
                      className={`relative z-10 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${deliveryType === 'delivery' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Livraison
                    </button>
                  </div>

                  {/* Gauge */}
                  <div className="mt-2.5">
                    <FreeShippingGauge variant="compact" />
                  </div>
                </div>

                {/* ── Items list ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {items.map(({ product, quantity }) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="group flex gap-3 bg-zinc-900/60 border border-white/[0.05] rounded-2xl p-3 hover:border-zinc-700/60 transition-colors"
                      >
                        {/* Product image */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={product.image_url ?? ''}
                            alt={product.name}
                            className="w-[68px] h-[68px] object-cover rounded-xl"
                          />
                          {product.cbd_percentage && (
                            <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-green-neon text-black px-1.5 py-0.5 rounded-full leading-none">
                              {product.cbd_percentage}%
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-semibold text-sm text-white leading-tight line-clamp-2 pr-1">
                              {product.name}
                            </p>
                            <button
                              onClick={() => removeItem(product.id)}
                              aria-label="Supprimer"
                              className="flex-shrink-0 w-6 h-6 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Inline qty controls */}
                            <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
                              <button
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                disabled={quantity <= 1}
                                aria-label="Diminuer"
                                className="w-6 h-6 rounded-md bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-3 h-3 text-white" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-white">
                                {quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                disabled={quantity >= product.stock_quantity}
                                aria-label="Augmenter"
                                className="w-6 h-6 rounded-md bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-3 h-3 text-white" />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-bold text-white">
                                {(product.price * quantity).toFixed(2)} €
                              </p>
                              {quantity > 1 && (
                                <p className="text-[10px] text-zinc-500">
                                  {product.price.toFixed(2)} € / u
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* ── Footer / Summary ──────────────────────────────────── */}
                <div className="border-t border-white/[0.06] px-5 pt-4 pb-5 space-y-3 bg-zinc-950/90 backdrop-blur-sm">
                  {/* Totals */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Sous-total</span>
                      <span className="font-medium text-zinc-300">{sub.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Livraison</span>
                      <span className={`font-medium ${fee === 0 ? 'text-green-neon' : 'text-zinc-300'}`}>
                        {fee === 0
                          ? deliveryType === 'click_collect'
                            ? 'Retrait gratuit'
                            : '🎁 Offerte'
                          : `${fee.toFixed(2)} €`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                      <span className="font-bold text-white text-base">Total TTC</span>
                      <motion.span
                        key={tot}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="font-bold text-xl text-white"
                      >
                        {tot.toFixed(2)} €
                      </motion.span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    to="/commande"
                    onClick={closeSidebar}
                    className="group relative block w-full overflow-hidden rounded-xl"
                  >
                    <div className="relative bg-green-neon hover:bg-green-400 transition-colors text-black font-bold text-sm text-center py-3.5 px-4 flex items-center justify-center gap-2">
                      <span>Commander</span>
                      <span className="opacity-70">—</span>
                      <span>{tot.toFixed(2)} €</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform ml-1" />
                    </div>
                  </Link>

                  <button
                    onClick={closeSidebar}
                    className="w-full text-zinc-500 hover:text-zinc-300 text-xs text-center py-1.5 transition-colors"
                  >
                    ← Continuer mes achats
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
