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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-[60] flex flex-col bg-zinc-950 border-l border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-8 pb-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-lg font-serif font-bold tracking-tight text-white uppercase italic">
                  CONCIERGERIE.
                </h2>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-green-neon animate-pulse" />
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">
                    {count} ARTICLE{count > 1 ? 'S' : ''} SÉLECTIONNÉ{count > 1 ? 'S' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={closeSidebar}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all group"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 ">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-6 z-[9999]">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-serif text-xl font-bold text-white">Panier Vide</p>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px] mx-auto">
                      Votre sélection est actuellement vide.
                    </p>
                  </div>
                  <button
                    onClick={closeSidebar}
                    className="bg-green-neon text-black font-semibold text-xs px-6 py-3 rounded-xl uppercase tracking-wider transition-all"
                  >
                    Découvrir
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-6 pb-4 space-y-4">
                    <div className="relative grid grid-cols-2 gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                      <motion.div
                        layout
                        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-white"
                        animate={{ left: deliveryType === 'click_collect' ? 4 : 'calc(50%)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                      <button
                        onClick={() => setDeliveryType('click_collect')}
                        className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${deliveryType === 'click_collect' ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        Collect
                      </button>
                      <button
                        onClick={() => setDeliveryType('delivery')}
                        className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${deliveryType === 'delivery' ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Livraison
                      </button>
                    </div>

                    <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                      <FreeShippingGauge variant="compact" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 scrollbar-thin">
                    <AnimatePresence initial={false} mode="popLayout">
                      {items.map(({ product, quantity }) => (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group relative flex gap-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 hover:bg-white/[0.04] transition-all"
                        >
                          <div className="relative w-20 h-20 aspect-square rounded-xl overflow-hidden border border-white/10 shrink-0">
                            <img src={product.image_url ?? ''} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-serif text-sm font-bold text-white group-hover:text-green-neon transition-colors">
                                  {product.name}
                                </h4>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {[1, 5, 10, 30, 50, 100].map(weight => (
                                    <button
                                      key={weight}
                                      onClick={() => updateQuantity(product.id, Math.min(weight, product.stock_quantity))}
                                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border transition-all ${quantity === weight
                                        ? 'bg-green-neon border-green-neon text-black shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                                        : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                                        }`}
                                    >
                                      {weight}g
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button onClick={() => removeItem(product.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-1.5 bg-white/5 rounded-xl border border-white/5 p-1">
                                <button onClick={() => updateQuantity(product.id, quantity - 1)} disabled={quantity <= 1} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all">
                                  <Minus className="w-3 h-3 text-white" />
                                </button>
                                <div className="relative flex items-center gap-1 px-1">
                                  <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => updateQuantity(product.id, Math.min(parseFloat(e.target.value) || 1, product.stock_quantity))}
                                    className="w-10 bg-transparent text-xs font-black text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-[10px] text-zinc-500 font-bold">g</span>
                                </div>
                                <button onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock_quantity} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all">
                                  <Plus className="w-3 h-3 text-white" />
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-serif font-bold text-white leading-none">
                                  {(product.price * quantity).toFixed(2)}<span className="text-[10px] text-green-neon ml-1 font-sans">€</span>
                                </p>
                                <p className="text-[9px] text-zinc-500 font-medium uppercase mt-1 tracking-tighter">Soit {product.price.toFixed(2)}€/g</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-6 border-t border-white/[0.08] bg-zinc-950 space-y-6">
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
                        <span>Sous-total</span>
                        <span className="text-zinc-200">{sub.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
                        <span>Livraison</span>
                        <span className={fee === 0 ? 'text-green-neon' : 'text-zinc-200'}>{fee === 0 ? 'GRATUIT' : `${fee.toFixed(2)} €`}</span>
                      </div>
                      <div className="flex justify-between items-end pt-3 border-t border-white/5">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">Total</span>
                        <span className="text-2xl font-serif font-bold text-white tracking-tight">
                          {tot.toFixed(2)}<span className="text-green-neon text-sm ml-0.5">€</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Link to="/commande" onClick={closeSidebar} className="block w-full group">
                        <div className="bg-green-neon text-black font-semibold text-sm py-3.5 hover:shadow-[0_0_16px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all duration-300 uppercase tracking-wider rounded-xl flex items-center justify-center gap-3">
                          <span>Commander</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                      <div className="flex items-center justify-center gap-2 opacity-30">
                        <ShieldCheck className="w-3 h-3 text-green-neon" />
                        <span className="text-xs font-medium uppercase tracking-wider">Paiement Sécurisé</span>
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
