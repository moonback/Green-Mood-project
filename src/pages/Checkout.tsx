import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, MapPin, Plus, CreditCard, Coins, ArrowLeft, ShieldCheck, Sparkles, CheckCircle2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Address } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import SEO from '../components/SEO';
import PromoCodeInput, { AppliedPromo } from '../components/PromoCodeInput';

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
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
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
  const promoDiscount = appliedPromo ? appliedPromo.discount_amount : 0;
  const tot = Math.max(0, total() - pointsValue - promoDiscount);

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
      const pointsRedeemed = usePoints && profile
        ? Math.floor(profile.loyalty_points / 100) * 100
        : 0;
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
          loyalty_points_redeemed: pointsRedeemed,
          promo_code: appliedPromo?.code ?? null,
          promo_discount: promoDiscount,
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

      // 5. Update loyalty points
      const newBalance = Math.max(0, (profile?.loyalty_points ?? 0) - pointsRedeemed + pointsEarned);
      await supabase
        .from('profiles')
        .update({ loyalty_points: newBalance })
        .eq('id', user.id);

      // Log earned points transaction
      if (pointsEarned > 0) {
        await supabase.from('loyalty_transactions').insert({
          user_id: user.id,
          order_id: order.id,
          type: 'earned',
          points: pointsEarned,
          balance_after: newBalance,
          note: `Commande #${order.id.slice(0, 8).toUpperCase()}`,
        });
      }

      // Log redeemed points transaction
      if (pointsRedeemed > 0) {
        await supabase.from('loyalty_transactions').insert({
          user_id: user.id,
          order_id: order.id,
          type: 'redeemed',
          points: pointsRedeemed,
          balance_after: newBalance,
          note: `Utilisation de ${pointsRedeemed} pts (−${pointsValue.toFixed(2)} €)`,
        });
      }

      // 5b. Increment promo uses
      if (appliedPromo) {
        await supabase.rpc('increment_promo_uses', { code_text: appliedPromo.code });
      }

      fetchProfile(user.id);

      // --- Referral Reward Logic ---
      if (profile?.referred_by_id && settings.referral_program_enabled) {
        // Check if this is the user's first paid order
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('payment_status', 'paid');

        // If count is 1 (this order), it's the first one
        if (count === 1) {
          const REWARD_POINTS = settings.referral_reward_points || 500;

          // 1. Update referral status
          const { data: referral } = await supabase
            .from('referrals')
            .update({
              status: 'completed',
              reward_issued: true,
              points_awarded: REWARD_POINTS
            })
            .eq('referee_id', user.id)
            .eq('status', 'joined')
            .select()
            .single();

          if (referral) {
            // 2. Credit the referrer
            const { data: referrerProfile } = await supabase
              .from('profiles')
              .select('loyalty_points')
              .eq('id', profile.referred_by_id)
              .single();

            if (referrerProfile) {
              const newReferrerBalance = (referrerProfile.loyalty_points || 0) + REWARD_POINTS;
              await supabase
                .from('profiles')
                .update({ loyalty_points: newReferrerBalance })
                .eq('id', profile.referred_by_id);

              // 3. Log transaction for referrer
              await supabase.from('loyalty_transactions').insert({
                user_id: profile.referred_by_id,
                type: 'referral', // This type needs to be handled in LoyaltyHistory
                points: REWARD_POINTS,
                balance_after: newReferrerBalance,
                note: `Récompense de parrainage : ${profile.full_name || 'Un ami'} a passé sa 1ère commande !`
              });
            }
          }
        }
      }
      // --- End Referral Logic ---

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
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
      <SEO title="Finalisation — L'Excellence Green Mood" description="Finalisez votre commande Green Mood CBD." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
          <div className="space-y-4">
            <Link to="/panier" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-semibold uppercase tracking-wider transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au Panier
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight leading-none">
              FINALISATION <br /><span className="text-green-neon italic">MASTR.</span>
            </h1>
          </div>
        </div>

        {/* Checkout Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {[
              { step: 1, label: 'Livraison', done: true },
              { step: 2, label: 'Adresse', done: deliveryType === 'click_collect' || !!selectedAddress },
              { step: 3, label: 'Paiement', done: false },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center gap-0 flex-1">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${item.done
                    ? 'bg-green-neon text-black'
                    : 'bg-white/[0.06] border border-white/[0.12] text-zinc-500'
                    }`}>
                    {item.done ? <Check className="w-4 h-4" /> : item.step}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${item.done ? 'text-green-neon' : 'text-zinc-600'}`}>
                    {item.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-px mx-3 mt-[-20px] ${item.done ? 'bg-green-neon/40' : 'bg-white/[0.08]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-8">

            {/* Delivery Methods Panel */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-8">
              <h2 className="text-xl font-serif font-bold flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-green-neon text-black text-xs flex items-center justify-center font-bold">01</span>
                MODE DE RÉCEPTION
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryType('click_collect')}
                  className={`relative flex flex-col gap-4 p-5 md:p-6 rounded-2xl border transition-all text-left overflow-hidden group ${deliveryType === 'click_collect'
                    ? 'bg-green-neon text-black border-transparent shadow-[0_0_40px_rgba(0,255,163,0.1)]'
                    : 'bg-white/5 border-white/[0.06] text-zinc-400 hover:border-white/20'
                    }`}
                >
                  <Package className={`w-8 h-8 ${deliveryType === 'click_collect' ? 'text-black' : 'text-green-neon'}`} />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider">Click & Collect</p>
                    <p className={`text-xs mt-1 opacity-60 font-medium`}>Retrait immédiat en boutique — Gratuit</p>
                  </div>
                  {deliveryType === 'click_collect' && <CheckCircle2 className="absolute top-6 right-6 w-5 h-5 text-black" />}
                </button>

                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={`relative flex flex-col gap-4 p-5 md:p-6 rounded-2xl border transition-all text-left overflow-hidden group ${deliveryType === 'delivery'
                    ? 'bg-green-neon text-black border-transparent'
                    : 'bg-white/5 border-white/[0.06] text-zinc-400 hover:border-white/20'
                    }`}
                >
                  <Truck className={`w-8 h-8 ${deliveryType === 'delivery' ? 'text-black' : 'text-green-neon'}`} />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider">Livraison Standard</p>
                    <p className={`text-xs mt-1 opacity-60 font-medium`}>Expédition prioritaire à domicile</p>
                  </div>
                  {deliveryType === 'delivery' && <CheckCircle2 className="absolute top-6 right-6 w-5 h-5 text-black" />}
                </button>
              </div>

              <AnimatePresence>
                {deliveryType === 'click_collect' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 bg-zinc-900/50 rounded-3xl border border-white/[0.06] space-y-4">
                      <div className="flex items-center gap-3 text-green-neon font-semibold text-xs uppercase tracking-wider">
                        <MapPin className="w-4 h-4" />
                        Points de Retrait Expert
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-bold leading-tight">{settings.store_address}</p>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                          {settings.store_hours} | TEL: {settings.store_phone}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Address Selection (Delivery only) */}
            {deliveryType === 'delivery' && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-8">
                <h2 className="text-xl font-serif font-bold flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-green-neon text-black text-xs flex items-center justify-center font-bold">02</span>
                  DESTINATION DE LIVRAISON
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`relative p-5 rounded-2xl border transition-all text-left group ${selectedAddress === addr.id
                        ? 'bg-zinc-900 border-green-neon/50 shadow-[0_0_20px_rgba(0,255,163,0.05)]'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04]'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedAddress === addr.id ? 'bg-green-neon text-black' : 'bg-white/5 text-zinc-500'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider ${selectedAddress === addr.id ? 'text-white' : 'text-zinc-500'}`}>{addr.label}</h4>
                      </div>
                      <p className="text-sm font-medium text-white leading-relaxed">{addr.street}</p>
                      <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mt-1">{addr.postal_code} {addr.city}</p>
                      {selectedAddress === addr.id && <CheckCircle2 className="absolute top-6 right-6 w-4 h-4 text-green-neon" />}
                    </button>
                  ))}

                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-white/[0.06] hover:border-green-neon/30 hover:bg-green-neon/5 transition-all text-zinc-500 hover:text-green-neon group"
                  >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Nouvelle Adresse</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showAddressForm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 md:p-6 space-y-6"
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ajout Coordonnées</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          placeholder="Libellé (ex: Domicile)"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          className="bg-white/5 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                        />
                        <input
                          placeholder="Adresse complète"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          className="bg-white/5 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                        />
                        <input
                          placeholder="Code postal"
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                          className="bg-white/5 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                        />
                        <input
                          placeholder="Ville"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="bg-white/5 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                        />
                      </div>
                      <div className="flex gap-4 pt-2">
                        <button
                          onClick={handleSaveAddress}
                          className="flex-1 bg-white text-black font-semibold uppercase tracking-wider py-4 rounded-xl hover:bg-green-neon transition-all text-sm"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setShowAddressForm(false)}
                          className="px-8 text-zinc-500 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Promo & Loyalty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-6 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-green-neon" />
                  CODE PRIVILÈGE
                </h2>
                <PromoCodeInput
                  subtotal={sub}
                  onApply={setAppliedPromo}
                  applied={appliedPromo}
                />
              </div>

              {profile && profile.loyalty_points >= 100 && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-[50px] -z-10 group-hover:bg-yellow-400/10 transition-all duration-1000" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-6 flex items-center gap-3">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    FIDÉLITÉ MASTER
                  </h2>
                  <label className="flex items-center gap-4 cursor-pointer p-6 bg-yellow-400/5 rounded-2xl border border-yellow-400/10 hover:bg-yellow-400/10 transition-all">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="w-6 h-6 rounded-lg accent-yellow-400 bg-zinc-900 border-white/[0.08]"
                    />
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white block">
                        Utiliser {profile.loyalty_points} Points
                      </span>
                      <span className="text-xs text-yellow-400 font-mono tracking-widest">
                        VALEUR: −{pointsValue.toFixed(2)}€
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right Summary Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-8 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-neon/5 blur-[60px] -z-10" />

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">RESUMÉ SÉLECTION</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-white truncate">{product.name}</p>
                        <p className="text-xs font-mono text-zinc-500">PIÈCES: {quantity}</p>
                      </div>
                      <span className="text-sm font-serif font-bold flex-shrink-0">
                        {(product.price * quantity).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/[0.06] font-medium">
                <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-widest">
                  <span>Sous-total</span>
                  <span>{sub.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-widest">
                  <span>Expédition</span>
                  <span className="text-green-neon">{fee === 0 ? 'Gratuit' : `${fee.toFixed(2)} €`}</span>
                </div>
                {pointsValue > 0 && (
                  <div className="flex justify-between text-yellow-500 text-xs uppercase tracking-widest">
                    <span>Fidélité</span>
                    <span>−{pointsValue.toFixed(2)} €</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-neon text-xs uppercase tracking-widest">
                    <span>Code {appliedPromo?.code}</span>
                    <span>−{promoDiscount.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-6 border-t border-white/[0.08]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">TOTAL MASTER</span>
                  <span className="text-3xl font-serif font-bold text-white">
                    {tot.toFixed(2)}<span className="text-green-neon text-lg ml-1">€</span>
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-xs font-medium uppercase tracking-widest text-center">
                  Error: {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handleOrder}
                  disabled={isSubmitting}
                  className="w-full bg-green-neon text-black font-semibold uppercase tracking-widest py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <CreditCard className="w-5 h-5" />
                  {isSubmitting ? 'TRAITEMENT EN COURS…' : `REGLER ${tot.toFixed(2)} €`}
                </button>

                <div className="flex items-center justify-center gap-3 py-2 opacity-40">
                  <ShieldCheck className="w-4 h-4 text-green-neon" />
                  <span className="text-xs font-medium uppercase tracking-wider">Paiement Securisé</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-600 text-center leading-relaxed uppercase px-6">
              {profile ? `CRÉDIT FIDÉLITÉ À VENIR: +${Math.floor(tot)} POINTS` : ''}
              <br />
              <span className="opacity-50">Validation immédiate en mode démonstration.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
