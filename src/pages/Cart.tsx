import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ArrowLeft, Trash2, Package, Truck, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import QuantitySelector from '../components/QuantitySelector';
import SEO from '../components/SEO';
import FreeShippingGauge from '../components/FreeShippingGauge';

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
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4 overflow-hidden relative">
        <SEO title="Mon Panier — L'Expérience Green Mood" description="Votre panier d'achats Green Mood CBD." />

        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-neon/5 rounded-full blur-[120px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center mx-auto relative group">
            <div className="absolute inset-0 bg-green-neon/20 rounded-full blur-xl group-hover:bg-green-neon/30 transition-all" />
            <ShoppingBag className="w-10 h-10 text-zinc-500 group-hover:text-green-neon transition-colors relative z-10" />
          </div>
          <div className="space-y-4">
            <h1 className="font-serif text-2xl md:text-3xl font-bold">Votre sélection est <br /><span className="text-green-neon italic">encore vierge.</span></h1>
            <p className="text-zinc-500 max-w-sm mx-auto font-light leading-relaxed">
              Explorez nos collections d'exception pour commencer votre voyage sensoriel.
            </p>
          </div>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-3 bg-green-neon text-black font-semibold px-8 py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all shadow-2xl"
          >
            Découvrir le Catalogue
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 overflow-x-hidden">
      <SEO title="Mon Panier — L'Excellence Green Mood" description="Récapitulatif de votre panier d'achats." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4 text-center md:text-left">
            <Link to="/catalogue" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-semibold uppercase tracking-wider transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au Catalogue
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold tracking-tight leading-none">
              VOTRE <span className="text-green-neon italic">SÉLECTION.</span>
            </h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em]">
              PANIER — {items.length} PIÈCE{items.length > 1 ? 'S' : ''} D'EXCEPTION
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Items List */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="popLayout">
              {items.map(({ product, quantity }) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative flex flex-col sm:flex-row gap-8 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:bg-white/[0.04] transition-all"
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-40 aspect-square rounded-2xl overflow-hidden border border-white/[0.08] shrink-0">
                    <img
                      src={product.image_url ?? ''}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Link
                          to={`/catalogue/${product.slug}`}
                          className="text-2xl font-serif font-bold hover:text-green-neon transition-colors"
                        >
                          {product.name}
                        </Link>
                        <div className="flex flex-wrap gap-3 pt-1">
                          {product.cbd_percentage && (
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/[0.06]">
                              CBD {product.cbd_percentage}%
                            </span>
                          )}
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/[0.06]">
                            Stock Garanti
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="p-3 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block">Quantité</span>
                          <QuantitySelector
                            quantity={quantity}
                            onChange={(q) => updateQuantity(product.id, q)}
                            max={product.stock_quantity}
                          />
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block">Prix Total</span>
                        <p className="text-2xl font-serif font-bold text-white">
                          {(product.price * quantity).toFixed(2)}<span className="text-green-neon text-sm ml-1">€</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-5 space-y-6">

            {/* Delivery Methods Card */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-neon/5 blur-[50px] -z-10 group-hover:bg-green-neon/10 transition-all duration-1000" />

              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-3">
                <Truck className="w-4 h-4 text-green-neon" />
                Logistique
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => setDeliveryType('click_collect')}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${deliveryType === 'click_collect'
                    ? 'bg-green-neon text-black border-transparent'
                    : 'bg-white/5 border-white/[0.06] text-zinc-400 hover:border-white/20'
                    }`}
                >
                  <Package className="w-6 h-6 flex-shrink-0" />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold uppercase tracking-wider ${deliveryType === 'click_collect' ? 'text-black' : 'text-white'}`}>Click & Collect</p>
                    <p className={`text-xs font-medium leading-none mt-1 opacity-60 text-inherit`}>Retrait Gratuit Boutique</p>
                  </div>
                </button>

                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${deliveryType === 'delivery'
                    ? 'bg-green-neon text-black border-transparent'
                    : 'bg-white/5 border-white/[0.06] text-zinc-400 hover:border-white/20'
                    }`}
                >
                  <Truck className="w-6 h-6 flex-shrink-0" />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold uppercase tracking-wider ${deliveryType === 'delivery' ? 'text-black' : 'text-white'}`}>Livraison</p>
                    <p className={`text-xs font-medium leading-none mt-1 opacity-60 text-inherit`}>
                      {sub >= settings.delivery_free_threshold
                        ? 'Offerte — Dès 0€'
                        : `${settings.delivery_fee.toFixed(2)}€ — Standard`}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Threshold Gauge */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <FreeShippingGauge variant="full" />
            </div>

            {/* Summary & Checkout Card */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Récapitulatif</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-400">Sous-total</span>
                  <span className="font-bold">{sub.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-400">Expédition</span>
                  <span className="font-bold text-green-neon">{fee === 0 ? 'Offerte' : `${fee.toFixed(2)} €`}</span>
                </div>
                <div className="pt-6 border-t border-white/[0.06] flex justify-between items-end">
                  <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-1">Total TTC</span>
                  <span className="text-3xl font-serif font-bold text-white">
                    {tot.toFixed(2)}<span className="text-green-neon text-lg ml-1">€</span>
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Link
                  to="/commande"
                  className="block w-full bg-green-neon text-black text-center font-semibold py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all shadow-xl shadow-green-neon/10"
                >
                  Payer la Sélection
                </Link>
                <div className="flex items-center justify-center gap-3 py-2 opacity-50">
                  <ShieldCheck className="w-4 h-4 text-green-neon" />
                  <span className="text-xs font-medium uppercase tracking-wider">Transaction Sécurisée</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-600 text-center leading-relaxed uppercase px-6">
              Paiement crypté par Viva Wallet. <br />
              Green Mood respecte votre vie privée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
