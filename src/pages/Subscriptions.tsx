import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RefreshCw, Pause, Play, X, ChevronDown, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import type { Subscription, SubscriptionFrequency } from '../lib/types';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';

const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  weekly: 'Chaque semaine',
  biweekly: 'Toutes les 2 semaines',
  monthly: 'Chaque mois',
};

const STATUS_CONFIG = {
  active: { label: 'Actif', color: 'text-green-400 bg-green-900/30 border-green-800' },
  paused: { label: 'En pause', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800' },
  cancelled: { label: 'Annulé', color: 'text-red-400 bg-red-900/30 border-red-800' },
};

export default function Subscriptions() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [changingFreq, setChangingFreq] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.subscriptions_enabled) {
      navigate('/compte');
      return;
    }
    if (!user) return;
    loadSubscriptions();
  }, [user, settings.subscriptions_enabled, navigate]);

  async function loadSubscriptions() {
    if (!user) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('*, product:products(id, name, slug, image_url, price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSubscriptions((data as Subscription[]) ?? []);
    setIsLoading(false);
  }

  async function handleTogglePause(sub: Subscription) {
    if (sub.status === 'cancelled') return;
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    await supabase.from('subscriptions').update({ status: newStatus }).eq('id', sub.id);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
    );
  }

  async function handleCancel(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir résilier cet abonnement ? Cette action est irréversible.')) return;
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    );
  }

  async function handleChangeFrequency(id: string, frequency: SubscriptionFrequency) {
    // Recalculate next delivery date based on new frequency
    const now = new Date();
    if (frequency === 'weekly') now.setDate(now.getDate() + 7);
    else if (frequency === 'biweekly') now.setDate(now.getDate() + 14);
    else now.setMonth(now.getMonth() + 1);

    const next_delivery_date = now.toISOString().split('T')[0];
    await supabase
      .from('subscriptions')
      .update({ frequency, next_delivery_date })
      .eq('id', id);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, frequency, next_delivery_date } : s))
    );
    setChangingFreq(null);
  }

  return (
    <>
      <SEO title="Mes abonnements — Green Mood CBD" description="Gérez vos livraisons automatiques." />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/compte"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Mon compte
          </Link>
        </div>

        <h1 className="font-serif text-3xl font-bold mb-2">Mes abonnements</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Gérez vos livraisons automatiques. Modifiables ou résiliables à tout moment.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucun abonnement actif</p>
            <p className="text-sm mt-1 mb-6">Abonnez-vous à vos produits CBD préférés pour des livraisons automatiques.</p>
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 bg-green-neon hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Découvrir les produits
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const statusCfg = STATUS_CONFIG[sub.status];
              return (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex gap-4">
                    {/* Product image */}
                    {sub.product?.image_url ? (
                      <img
                        src={sub.product.image_url}
                        alt={sub.product.name}
                        className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-zinc-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white truncate">
                            {sub.product?.name ?? 'Produit'}
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Qté : {sub.quantity} × {sub.product?.price?.toFixed(2)} €
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                        <span>Fréquence : <span className="text-zinc-300">{FREQUENCY_LABELS[sub.frequency]}</span></span>
                        <span>
                          Prochaine livraison :{' '}
                          <span className="text-zinc-300">
                            {new Date(sub.next_delivery_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                            })}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {sub.status !== 'cancelled' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {/* Frequency selector */}
                      <div className="relative">
                        <button
                          onClick={() => setChangingFreq(changingFreq === sub.id ? null : sub.id)}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl transition-colors border border-zinc-700"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Changer la fréquence
                          <ChevronDown className={`w-3 h-3 transition-transform ${changingFreq === sub.id ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {changingFreq === sub.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl z-10 min-w-[180px]"
                            >
                              {(Object.keys(FREQUENCY_LABELS) as SubscriptionFrequency[]).map((freq) => (
                                <button
                                  key={freq}
                                  onClick={() => handleChangeFrequency(sub.id, freq)}
                                  className={`block w-full text-left px-4 py-2.5 text-xs transition-colors ${sub.frequency === freq
                                    ? 'bg-green-neon/20 text-green-400'
                                    : 'text-zinc-300 hover:bg-zinc-700'
                                    }`}
                                >
                                  {FREQUENCY_LABELS[freq]}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Pause/Resume */}
                      <button
                        onClick={() => handleTogglePause(sub)}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl transition-colors border border-zinc-700"
                      >
                        {sub.status === 'active' ? (
                          <><Pause className="w-3.5 h-3.5" /> Mettre en pause</>
                        ) : (
                          <><Play className="w-3.5 h-3.5" /> Reprendre</>
                        )}
                      </button>

                      {/* Cancel */}
                      <button
                        onClick={() => handleCancel(sub.id)}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 px-3 py-2 rounded-xl transition-colors border border-red-900/50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Résilier
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
