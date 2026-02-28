import { Link } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Package, Truck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import QuantitySelector from './QuantitySelector';

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
  const { settings } = useSettingsStore();

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-green-neon" />
                <h2 className="font-serif text-xl font-semibold">
                  Mon Panier
                  {count > 0 && (
                    <span className="ml-2 text-sm font-normal text-zinc-400">
                      ({count} article{count > 1 ? "s" : ""})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeSidebar}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-zinc-600" />
                </div>
                <div>
                  <p className="text-zinc-300 font-medium">Votre panier est vide</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    Découvrez notre catalogue pour commencer
                  </p>
                </div>
                <Link
                  to="/catalogue"
                  onClick={closeSidebar}
                  className="mt-2 bg-green-primary hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Voir le catalogue
                </Link>
              </div>
            ) : (
              <>
                {/* Delivery type selector */}
                <div className="px-6 py-4 border-b border-zinc-800">
                  <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Mode de réception</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDeliveryType('click_collect')}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${deliveryType === 'click_collect'
                        ? 'bg-green-primary border-green-primary text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                    >
                      <Package className="w-4 h-4" />
                      Click & Collect
                    </button>
                    <button
                      onClick={() => setDeliveryType('delivery')}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${deliveryType === 'delivery'
                        ? 'bg-green-primary border-green-primary text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                    >
                      <Truck className="w-4 h-4" />
                      Livraison
                    </button>
                  </div>
                  {deliveryType === 'delivery' && sub < settings.delivery_free_threshold && (
                    <p className="text-xs text-orange-400 mt-2">
                      Plus que {(settings.delivery_free_threshold - sub).toFixed(2)} € pour la livraison offerte !
                    </p>
                  )}
                  {deliveryType === 'delivery' && sub >= settings.delivery_free_threshold && (
                    <p className="text-xs text-green-400 mt-2">Livraison offerte !</p>
                  )}
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-3">
                      <img
                        src={product.image_url ?? ''}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white line-clamp-1">{product.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{product.price.toFixed(2)} € / unité</p>
                        <div className="flex items-center justify-between mt-2">
                          <QuantitySelector
                            quantity={quantity}
                            onChange={(q) => updateQuantity(product.id, q)}
                            max={product.stock_quantity}
                            size="sm"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {(product.price * quantity).toFixed(2)} €
                            </span>
                            <button
                              onClick={() => removeItem(product.id)}
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-zinc-800 space-y-3">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-zinc-400">
                      <span>Sous-total</span>
                      <span>{sub.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Livraison</span>
                      <span>{fee === 0 ? (deliveryType === 'click_collect' ? 'Click & Collect' : 'Offerte') : `${fee.toFixed(2)} €`}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-zinc-800">
                      <span>Total</span>
                      <span>{tot.toFixed(2)} €</span>
                    </div>
                  </div>

                  <Link
                    to="/commande"
                    onClick={closeSidebar}
                    className="block w-full bg-green-primary hover:bg-green-600 text-white text-center font-bold py-3.5 rounded-xl transition-colors"
                  >
                    Commander — {tot.toFixed(2)} €
                  </Link>
                  <button
                    onClick={closeSidebar}
                    className="block w-full text-zinc-400 hover:text-white text-sm text-center py-2 transition-colors"
                  >
                    Continuer mes achats
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
