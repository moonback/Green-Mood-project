import { Link } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Package, Truck, ShoppingBag, ArrowRight, Minus, Plus, ShieldCheck } from 'lucide-react';
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
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60]"
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] z-[60] flex flex-col bg-zinc-950 border-l border-white/[0.08] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="relative px-8 pt-10 pb-8 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif font-black tracking-tight text-white uppercase italic">
                    CONCIERGERIE.
                  </h2>
                  <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600">
                    PANIER — {count} PIÈCE{count > 1 ? 'S' : ''}
                  </p>
                </div>
                <button
                  onClick={closeSidebar}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>
            </div>

            {/* ── Content ─────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-h-0">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-10 text-center space-y-8">
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-green-neon/5 rounded-full blur-xl" />
                    <ShoppingBag className="w-10 h-10 text-zinc-700" />
                  </div>
                  <div className="space-y-3">
                    <p className="font-serif text-2xl font-black text-white">Votre sélection est vide</p>
                    <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
                      Explorez l'excellence de nos collections pour commencer votre expérience.
                    </p>
                  </div>
                  <button
                    onClick={closeSidebar}
                    className="bg-white text-black font-black uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-green-neon transition-all shadow-xl"
                  >
                    Découvrir.
                  </button>
                </div>
              ) : (
                <>
                  {/* Delivery toggle & Gauge */}
                  <div className="px-8 pb-6 border-b border-white/[0.05] space-y-6">
                    <div className="relative grid grid-cols-2 gap-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-1.5 focus-within:border-white/20 transition-all">
                      <motion.div
                        layout
                        className="absolute inset-y-1.5 w-[calc(50%-6px)] rounded-xl bg-white shadow-xl"
                        animate={{ left: deliveryType === 'click_collect' ? 6 : 'calc(50% + 1px)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                      <button
                        onClick={() => setDeliveryType('click_collect')}
                        className={`relative z-10 flex items-center justify-center gap-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors ${deliveryType === 'click_collect' ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                      >
                        <Package className="w-4 h-4" />
                        Click & Collect
                      </button>
                      <button
                        onClick={() => setDeliveryType('delivery')}
                        className={`relative z-10 flex items-center justify-center gap-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors ${deliveryType === 'delivery' ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                      >
                        <Truck className="w-4 h-4" />
                        Livraison
                      </button>
                    </div>

                    <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-green-neon/5 blur-3xl -z-10 group-hover:bg-green-neon/10 transition-all" />
                      <FreeShippingGauge variant="compact" />
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-hide">
                    <AnimatePresence initial={false} mode="popLayout">
                      {items.map(({ product, quantity }) => (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: 20 }}
                          className="group relative flex gap-6 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-5 hover:bg-white/[0.04] transition-all"
                        >
                          {/* Image */}
                          <div className="relative w-24 h-24 aspect-square rounded-2xl overflow-hidden border border-white/10 shrink-0">
                            <img
                              src={product.image_url ?? ''}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            {product.cbd_percentage && (
                              <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest bg-green-neon text-black px-2 py-0.5 rounded-full leading-none border border-black/10">
                                {product.cbd_percentage}%
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="flex-1 font-serif text-lg font-black leading-tight text-white truncate group-hover:text-green-neon transition-colors">
                                {product.name}
                              </h4>
                              <button
                                onClick={() => removeItem(product.id)}
                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-400/20 text-zinc-600 hover:text-red-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                                <button
                                  onClick={() => updateQuantity(product.id, quantity - 1)}
                                  disabled={quantity <= 1}
                                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center transition-all"
                                >
                                  <Minus className="w-3 h-3 text-white" />
                                </button>
                                <span className="w-6 text-center text-xs font-black font-mono text-white">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(product.id, quantity + 1)}
                                  disabled={quantity >= product.stock_quantity}
                                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center transition-all"
                                >
                                  <Plus className="w-3 h-3 text-white" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-lg font-serif font-black text-white">
                                  {(product.price * quantity).toFixed(2)}<span className="text-[10px] text-green-neon ml-1 font-sans">€</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* ── Footer ─────────────────────────────────────────────── */}
                  <div className="px-8 pt-8 pb-10 border-t border-white/[0.08] bg-zinc-950 space-y-8 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-green-neon/5 to-transparent -z-10 pointer-events-none" />

                    {/* Totals */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                        <span>Sous-total</span>
                        <span className="text-sm font-medium text-white">{sub.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                        <span>Expédition</span>
                        <span className={`text-sm ${fee === 0 ? 'text-green-neon' : 'text-white'}`}>
                          {fee === 0 ? (deliveryType === 'click_collect' ? 'OFFERT' : 'OFFERT') : `${fee.toFixed(2)} €`}
                        </span>
                      </div>
                      <div className="flex justify-between items-end pt-6 border-t border-white/10">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600 mb-1">TOTAL MASTER</span>
                        <motion.span
                          key={tot}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-4xl font-serif font-black text-white tracking-tight"
                        >
                          {tot.toFixed(2)}<span className="text-green-neon text-lg ml-1">€</span>
                        </motion.span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="space-y-4">
                      <Link
                        to="/commande"
                        onClick={closeSidebar}
                        className="group relative block w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-green-neon/5 hover:shadow-green-neon/15 transition-all"
                      >
                        <div className="relative bg-white hover:bg-green-neon transition-all duration-500 text-black font-black text-sm uppercase tracking-[0.25em] text-center py-6 px-10 flex items-center justify-center gap-4 group">
                          <span>Finaliser la Sélection</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                        </div>
                      </Link>

                      <div className="flex items-center justify-center gap-3 opacity-40">
                        <ShieldCheck className="w-4 h-4 text-green-neon" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Transaction Securisée</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
