import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, Truck, MapPin, Plus, CreditCard, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Address } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import SEO from '../components/SEO';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore();
  const {
    items,
    deliveryType,
    setDeliveryType,
    clearCart,
    subtotal,
    deliveryFee,
    total,
  } = useCartStore();
  const { settings } = useSettingsStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // New address form
  const [newAddress, setNewAddress] = useState({
    label: 'Domicile',
    street: '',
    city: '',
    postal_code: '',
  });

  const sub = subtotal();
  const fee = deliveryFee();
  const pointsValue = usePoints && profile ? Math.floor(profile.loyalty_points / 100) * 5 : 0;
  const tot = Math.max(0, total() - pointsValue);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        if (data?.length) {
          setAddresses(data as Address[]);
          const def = (data as Address[]).find((a) => a.is_default);
          setSelectedAddress(def?.id ?? data[0].id);
        }
      });
  }, [user]);

  const handleSaveAddress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .insert({ ...newAddress, user_id: user.id, is_default: addresses.length === 0 })
      .select()
      .single();
    if (data) {
      setAddresses((prev) => [...prev, data as Address]);
      setSelectedAddress(data.id);
      setShowAddressForm(false);
      setNewAddress({ label: 'Domicile', street: '', city: '', postal_code: '' });
    }
  };

  const handleOrder = async () => {
    if (!user) return;
    if (deliveryType === 'delivery' && !selectedAddress) {
      setError('Veuillez sélectionner une adresse de livraison.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create order in Supabase
      const pointsEarned = Math.floor(tot);
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          delivery_type: deliveryType,
          address_id: deliveryType === 'delivery' ? selectedAddress : null,
          subtotal: sub,
          delivery_fee: fee,
          total: tot,
          loyalty_points_earned: pointsEarned,
          payment_status: 'pending',
          status: 'pending',
        })
        .select()
        .single();

      if (orderError || !order) throw new Error('Erreur lors de la création de la commande.');

      // 2. Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        unit_price: item.product.price,
        quantity: item.quantity,
        total_price: item.product.price * item.quantity,
      }));

      await supabase.from('order_items').insert(orderItems);

      // 3. Simulate payment (Viva Wallet placeholder)
      // TODO: Replace with real Viva Wallet integration when account is ready
      // const response = await fetch('/api/payment/create-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ orderId: order.id, amount: Math.round(tot * 100), ... })
      // });
      // const { orderCode } = await response.json();
      // window.location.href = `https://www.vivapayments.com/web/checkout?ref=${orderCode}`;

      // Simulation : mark as paid directly
      await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'processing', viva_order_code: `SIM-${order.id.slice(0, 8)}` })
        .eq('id', order.id);

      // 4. Decrement stock
      for (const item of items) {
        // Direct update (decrement_stock RPC can be added to Supabase later)
        await supabase
          .from('products')
          .update({ stock_quantity: Math.max(0, item.product.stock_quantity - item.quantity) })
          .eq('id', item.product.id);

        // Log stock movement
        await supabase.from('stock_movements').insert({
          product_id: item.product.id,
          quantity_change: -item.quantity,
          type: 'sale',
          note: `Commande ${order.id.slice(0, 8)}`,
        });
      }

      // 5. Add loyalty points
      if (pointsEarned > 0) {
        await supabase
          .from('profiles')
          .update({ loyalty_points: (profile?.loyalty_points ?? 0) + pointsEarned - (usePoints ? profile?.loyalty_points ?? 0 : 0) })
          .eq('id', user.id);
        fetchProfile(user.id);
      }

      // 6. Clear cart and redirect
      clearCart();
      navigate(`/commande/confirmation?id=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/panier');
    return null;
  }

  return (
    <>
      <SEO title="Commander — Green Mood CBD" description="Finalisez votre commande Green Mood CBD." />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-serif text-3xl font-bold mb-8">Finaliser la commande</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery type */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="font-serif font-semibold text-lg mb-4">Mode de réception</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryType('click_collect')}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${deliveryType === 'click_collect'
                    ? 'bg-green-primary/10 border-green-primary'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <Package className="w-5 h-5 text-green-primary" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Click & Collect</p>
                    <p className="text-xs text-zinc-500">En boutique — Gratuit</p>
                  </div>
                </button>
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${deliveryType === 'delivery'
                    ? 'bg-green-primary/10 border-green-primary'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <Truck className="w-5 h-5 text-green-primary" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Livraison</p>
                    <p className="text-xs text-zinc-500">À domicile</p>
                  </div>
                </button>
              </div>
              {deliveryType === 'click_collect' && (
                <div className="mt-4 p-4 bg-zinc-800 rounded-xl text-sm text-zinc-400">
                  <div className="flex items-center gap-2 text-green-primary font-medium mb-1">
                    <MapPin className="w-4 h-4" />
                    Adresse de retrait
                  </div>
                  {settings.store_address}
                  <br />
                  {settings.store_hours} | Tel : {settings.store_phone}
                </div>
              )}
            </div>

            {/* Address (delivery only) */}
            {deliveryType === 'delivery' && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h2 className="font-serif font-semibold text-lg mb-4">Adresse de livraison</h2>
                <div className="space-y-2 mb-4">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAddress === addr.id
                        ? 'bg-green-primary/10 border-green-primary'
                        : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                        }`}
                    >
                      <p className="font-medium text-sm">{addr.label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {addr.street}, {addr.postal_code} {addr.city}
                      </p>
                    </button>
                  ))}
                </div>

                {showAddressForm ? (
                  <div className="space-y-3 bg-zinc-800 rounded-xl p-4">
                    <input
                      placeholder="Libellé (ex: Domicile)"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                    />
                    <input
                      placeholder="Adresse"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Code postal"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                      />
                      <input
                        placeholder="Ville"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveAddress}
                        className="flex-1 bg-green-primary hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 text-zinc-400 hover:text-white text-sm transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 text-green-primary hover:text-green-400 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une adresse
                  </button>
                )}
              </div>
            )}

            {/* Loyalty points */}
            {profile && profile.loyalty_points >= 100 && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h2 className="font-serif font-semibold text-lg mb-4">Programme de fidélité</h2>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="w-5 h-5 rounded accent-green-600"
                  />
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">
                      Utiliser mes {profile.loyalty_points} points
                      <span className="text-green-primary font-semibold ml-1">
                        (−{pointsValue.toFixed(2)} €)
                      </span>
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Right: summary */}
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="font-serif font-semibold mb-4">Récapitulatif</h2>
              <div className="space-y-2 mb-4">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-zinc-400 line-clamp-1 flex-1 mr-2">
                      {product.name} ×{quantity}
                    </span>
                    <span className="text-white font-medium flex-shrink-0">
                      {(product.price * quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-700 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Sous-total</span>
                  <span>{sub.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Livraison</span>
                  <span>{fee === 0 ? 'Gratuit' : `${fee.toFixed(2)} €`}</span>
                </div>
                {pointsValue > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Réduction fidélité</span>
                    <span>−{pointsValue.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-zinc-700">
                  <span>Total</span>
                  <span>{tot.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleOrder}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-green-primary hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              {isSubmitting ? 'Traitement…' : `Payer ${tot.toFixed(2)} €`}
            </button>

            <p className="text-xs text-zinc-600 text-center">
              Paiement sécurisé. En mode démo, la commande est validée sans paiement réel.
            </p>

            <p className="text-xs text-zinc-600 text-center leading-relaxed">
              {profile ? `Vous gagnerez ${Math.floor(tot)} points de fidélité.` : ''}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
