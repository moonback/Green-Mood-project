import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, ArrowLeft, Trash2, Package, Truck } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import QuantitySelector from '../components/QuantitySelector';
import SEO from '../components/SEO';

export default function Cart() {
  const {
    items,
    deliveryType,
    setDeliveryType,
    removeItem,
    updateQuantity,
    subtotal,
    deliveryFee,
    total,
  } = useCartStore();
  const { settings } = useSettingsStore();

  const sub = subtotal();
  const fee = deliveryFee();
  const tot = total();

  if (items.length === 0) {
    return (
      <>
        <SEO title="Mon Panier — Green Moon CBD" description="Votre panier d'achats Green Moon CBD." />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
          <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-zinc-600" />
          </div>
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold mb-2">Votre panier est vide</h1>
            <p className="text-zinc-400">Découvrez notre catalogue pour commencer vos achats.</p>
          </div>
          <Link
            to="/catalogue"
            className="flex items-center gap-2 bg-green-primary hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
          >
            Voir le catalogue
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Mon Panier — Green Moon CBD" description="Récapitulatif de votre panier d'achats." />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/catalogue" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif text-3xl font-bold">Mon Panier</h1>
          <span className="text-zinc-500 text-lg">({items.length} article{items.length > 1 ? 's' : ''})</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
              >
                <img
                  src={product.image_url ?? ''}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        to={`/catalogue/${product.slug}`}
                        className="font-semibold text-white hover:text-green-primary transition-colors"
                      >
                        {product.name}
                      </Link>
                      {product.cbd_percentage && (
                        <p className="text-sm text-zinc-400 mt-0.5">CBD {product.cbd_percentage}%</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <QuantitySelector
                      quantity={quantity}
                      onChange={(q) => updateQuantity(product.id, q)}
                      max={product.stock_quantity}
                    />
                    <span className="font-bold text-lg">
                      {(product.price * quantity).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {/* Delivery selector */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="font-serif font-semibold mb-4">Mode de réception</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setDeliveryType('click_collect')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${deliveryType === 'click_collect'
                    ? 'bg-green-primary/10 border-green-primary text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                >
                  <Package className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Click & Collect</p>
                    <p className="text-xs mt-0.5 opacity-70">Retrait en boutique — Gratuit</p>
                  </div>
                </button>
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${deliveryType === 'delivery'
                    ? 'bg-green-primary/10 border-green-primary text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                >
                  <Truck className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Livraison à domicile</p>
                    <p className="text-xs mt-0.5 opacity-70">
                      {sub >= settings.delivery_free_threshold
                        ? 'Offerte !'
                        : `${settings.delivery_fee.toFixed(2)} € (offerte dès ${settings.delivery_free_threshold} €)`}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-3">
              <h3 className="font-serif font-semibold mb-2">Récapitulatif</h3>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Sous-total</span>
                <span>{sub.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Livraison</span>
                <span>{fee === 0 ? 'Gratuit' : `${fee.toFixed(2)} €`}</span>
              </div>
              <div className="border-t border-zinc-700 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{tot.toFixed(2)} €</span>
              </div>

              <Link
                to="/commande"
                className="block w-full bg-green-primary hover:bg-green-600 text-white text-center font-bold py-4 rounded-2xl transition-colors mt-2"
              >
                Passer la commande
              </Link>

              <Link
                to="/catalogue"
                className="block w-full text-zinc-400 hover:text-white text-sm text-center py-2 transition-colors"
              >
                Continuer mes achats
              </Link>
            </div>

            <p className="text-xs text-zinc-600 text-center leading-relaxed">
              Paiement sécurisé par Viva Wallet. Vos données sont protégées.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
