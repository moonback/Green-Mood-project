import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coins, ArrowLeft, TrendingUp, TrendingDown, Settings2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { LoyaltyTransaction } from '../lib/types';
import SEO from '../components/SEO';

const TYPE_CONFIG = {
  earned: {
    label: 'Points gagnés',
    icon: TrendingUp,
    color: 'text-green-400 bg-green-900/30 border-green-800',
    sign: '+',
  },
  redeemed: {
    label: 'Points utilisés',
    icon: TrendingDown,
    color: 'text-orange-400 bg-orange-900/30 border-orange-800',
    sign: '−',
  },
  adjusted: {
    label: 'Ajustement',
    icon: Settings2,
    color: 'text-purple-400 bg-purple-900/30 border-purple-800',
    sign: '±',
  },
  expired: {
    label: 'Points expirés',
    icon: TrendingDown,
    color: 'text-zinc-400 bg-zinc-800 border-zinc-700',
    sign: '−',
  },
};

export default function LoyaltyHistory() {
  const { user, profile } = useAuthStore();
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setTransactions((data as LoyaltyTransaction[]) ?? []);
        setIsLoading(false);
      });
  }, [user]);

  return (
    <>
      <SEO title="Programme de fidélité — Green Mood CBD" description="Consultez l'historique de vos points de fidélité." />

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

        <h1 className="font-serif text-3xl font-bold mb-8">Programme de fidélité</h1>

        {/* Balance hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-6 mb-8 flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center">
            <Coins className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Solde actuel</p>
            <p className="text-3xl font-bold text-white">{profile?.loyalty_points ?? 0} pts</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {Math.floor((profile?.loyalty_points ?? 0) / 100)} × 5 € de réduction disponibles
            </p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-zinc-500">Règle de conversion</p>
            <p className="text-sm text-zinc-300">1 € dépensé = 1 point</p>
            <p className="text-sm text-zinc-300">100 points = 5 € de réduction</p>
          </div>
        </motion.div>

        {/* Transactions list */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse h-16" />
            ))
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Coins className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction pour l'instant.</p>
              <p className="text-sm mt-1">Passez votre première commande pour gagner des points !</p>
            </div>
          ) : (
            transactions.map((tx, i) => {
              const config = TYPE_CONFIG[tx.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{config.label}</p>
                    {tx.note && (
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{tx.note}</p>
                    )}
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${
                      tx.type === 'earned' ? 'text-green-400' :
                      tx.type === 'redeemed' || tx.type === 'expired' ? 'text-orange-400' :
                      'text-purple-400'
                    }`}>
                      {tx.type === 'earned' ? '+' : '−'}{tx.points} pts
                    </p>
                    <p className="text-xs text-zinc-600">Solde : {tx.balance_after} pts</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
