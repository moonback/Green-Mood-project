import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, Truck, Clock, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order, OrderItem } from '../lib/types';
import { useAuthStore } from '../store/authStore';
import SEO from '../components/SEO';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800' },
  paid: { label: 'Payé', color: 'text-blue-400 bg-blue-900/30 border-blue-800' },
  processing: { label: 'En préparation', color: 'text-purple-400 bg-purple-900/30 border-purple-800' },
  ready: { label: 'Prêt à retirer', color: 'text-green-400 bg-green-900/30 border-green-800' },
  shipped: { label: 'En livraison', color: 'text-blue-400 bg-blue-900/30 border-blue-800' },
  delivered: { label: 'Livré', color: 'text-green-400 bg-green-900/30 border-green-800' },
  cancelled: { label: 'Annulé', color: 'text-red-400 bg-red-900/30 border-red-800' },
};

export default function Orders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setIsLoading(false);
      });
  }, [user]);

  return (
    <>
      <SEO title="Mes Commandes — Green Mood CBD" description="Historique de vos commandes." />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/compte" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif text-3xl font-bold">Mes commandes</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-1/3 mb-3" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 mb-4">Aucune commande pour l'instant.</p>
            <Link
              to="/catalogue"
              className="text-green-neon hover:underline text-sm"
            >
              Découvrir le catalogue →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
              const isExpanded = expanded === order.id;
              const items = order.order_items as OrderItem[] | undefined;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                        {order.delivery_type === 'click_collect' ? (
                          <Package className="w-5 h-5 text-green-neon" />
                        ) : (
                          <Truck className="w-5 h-5 text-green-neon" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Commande #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-bold text-white">{order.total.toFixed(2)} €</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && items && (
                    <div className="border-t border-zinc-800 p-5 space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-zinc-400">
                            {item.product_name} ×{item.quantity}
                          </span>
                          <span className="text-white">{item.total_price.toFixed(2)} €</span>
                        </div>
                      ))}
                      <div className="border-t border-zinc-700 pt-2 text-sm">
                        <div className="flex justify-between text-zinc-500">
                          <span>Livraison</span>
                          <span>{order.delivery_fee === 0 ? 'Gratuit' : `${order.delivery_fee.toFixed(2)} €`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-white mt-1">
                          <span>Total</span>
                          <span>{order.total.toFixed(2)} €</span>
                        </div>
                      </div>
                      {order.delivery_type === 'click_collect' && (
                        <div className="text-xs text-zinc-500 bg-zinc-800 rounded-xl p-3 mt-2">
                          Retrait en boutique — 123 Rue de la Nature, 75000 Paris
                        </div>
                      )}
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
