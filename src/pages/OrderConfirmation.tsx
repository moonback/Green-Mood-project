import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, Package, Truck, Clock, ArrowRight, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order } from '../lib/types';
import SEO from '../components/SEO';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    supabase
      .from('orders')
      .select('*, order_items(*), address:addresses(*)')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data as Order);
      });
  }, [orderId]);

  return (
    <>
      <SEO title="Commande confirmée — Green Mood CBD" description="Votre commande a été confirmée." />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-24 h-24 bg-green-neon/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-neon" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-4xl font-bold mb-4"
        >
          Commande confirmée !
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-400 text-lg mb-8"
        >
          Merci pour votre commande. Vous recevrez bientôt un email de confirmation.
        </motion.p>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-left space-y-4 mb-8"
          >
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">N° de commande</span>
              <span className="font-mono text-sm text-green-neon">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Total payé</span>
              <span className="font-bold">{order.total.toFixed(2)} €</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Mode de réception</span>
              <span className="flex items-center gap-1.5 text-sm">
                {order.delivery_type === 'click_collect' ? (
                  <>
                    <Package className="w-4 h-4 text-green-neon" />
                    Click & Collect
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 text-green-neon" />
                    Livraison
                  </>
                )}
              </span>
            </div>

            {order.loyalty_points_earned > 0 && (
              <div className="flex justify-between items-center bg-yellow-900/20 border border-yellow-800 rounded-xl px-4 py-2">
                <span className="text-yellow-400 text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Points de fidélité gagnés
                </span>
                <span className="text-yellow-400 font-bold">+{order.loyalty_points_earned} pts</span>
              </div>
            )}

            {order.delivery_type === 'click_collect' && (
              <div className="bg-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2 text-white font-medium mb-1">
                  <Clock className="w-4 h-4 text-green-neon" />
                  Retrait en boutique
                </div>
                123 Rue de la Nature, 75000 Paris
                <br />
                Lun–Sam 10h00–19h30 | Tél : 01 23 45 67 89
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/compte/commandes"
            className="flex items-center justify-center gap-2 bg-green-neon hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
          >
            Mes commandes
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/catalogue"
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
          >
            Continuer mes achats
          </Link>
        </motion.div>
      </div>
    </>
  );
}
