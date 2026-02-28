import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coins, ArrowLeft, TrendingUp, TrendingDown, Settings2, Sparkles, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { LoyaltyTransaction } from '../lib/types';
import SEO from '../components/SEO';

const TYPE_CONFIG = {
  earned: {
    label: 'ACQUISITION D\'EXCELLENCE',
    icon: TrendingUp,
    color: 'text-green-neon bg-green-neon/5 border-green-neon/20',
    sign: '+',
  },
  redeemed: {
    label: 'PRIVILÈGE UTILISÉ',
    icon: TrendingDown,
    color: 'text-yellow-400 bg-yellow-400/5 border-yellow-400/20',
    sign: '−',
  },
  adjusted: {
    label: 'AJUSTEMENT EXPERT',
    icon: Settings2,
    color: 'text-purple-400 bg-purple-400/5 border-purple-400/20',
    sign: '±',
  },
  expired: {
    label: 'POINTS EXPIRÉS',
    icon: TrendingDown,
    color: 'text-zinc-500 bg-white/5 border-white/10',
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
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
      <SEO title="Programme Privilège — L'Excellence Green Mood" description="Consultez l'historique de vos points de fidélité." />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-black uppercase tracking-widest transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au Hub
            </Link>
            <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight leading-none uppercase">
              PROGRAMME <br /><span className="text-yellow-500 italic">PRIVILÈGE.</span>
            </h1>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600 md:text-right">
            STATUT : MEMBRE MASTER — {profile?.loyalty_points ?? 0} CARATS
          </p>
        </div>

        {/* Balance hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 md:p-16 mb-16 overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -z-10 group-hover:bg-yellow-500/10 transition-all duration-1000" />

          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full -z-10" />
              <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-900 border-2 border-yellow-500/30 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group-hover:border-yellow-500 transition-all duration-700">
                <Coins className="w-16 h-16 md:w-20 md:h-20 text-yellow-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black p-2.5 rounded-2xl shadow-2xl">
                <Star className="w-6 h-6" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase tracking-[0.4em] text-zinc-500">SOLDE D'EXCELLENCE ACTUEL</p>
                <p className="text-6xl md:text-8xl font-serif font-black text-white leading-none">
                  {profile?.loyalty_points ?? 0}<span className="text-yellow-500 text-xl md:text-2xl ml-4 italic font-sans uppercase tracking-[0.2em]">Carats</span>
                </p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {Math.floor((profile?.loyalty_points ?? 0) / 100)} × 5€ DE RÉDUCTION DISPONIBLES
                </span>
                <span className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black uppercase tracking-widest text-yellow-500">
                  1€ DÉPENSÉ = 1 POINT
                </span>
              </div>
            </div>

            <div className="hidden lg:block w-px h-32 bg-white/5 mx-4" />

            <div className="hidden lg:flex flex-col gap-6 text-right">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-zinc-600 uppercase">PROCHAIN PALIER</p>
                <p className="text-xl font-serif font-black text-white italic">Elite Member</p>
              </div>
              <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((profile?.loyalty_points ?? 0) / 1000 * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transactions list */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-600 mb-8 px-2">CHRONOLOGIE DES RÉCOMPENSES</h2>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 animate-pulse h-24" />
            ))
          ) : transactions.length === 0 ? (
            <div className="text-center py-24 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] space-y-6">
              <Sparkles className="w-16 h-16 mx-auto text-zinc-800" />
              <div className="space-y-2">
                <p className="font-serif text-2xl font-black text-white">Votre odyssée commence ici</p>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto italic">Passez votre première commande pour initier votre capital d'excellence.</p>
              </div>
            </div>
          ) : (
            transactions.map((tx, i) => {
              const config = TYPE_CONFIG[tx.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 flex items-center gap-8 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 ${config.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-white">{config.label}</p>
                    {tx.note && (
                      <p className="text-sm italic font-serif text-zinc-400 truncate tracking-wide">{tx.note}</p>
                    )}
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                      LE {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className={`text-2xl font-serif font-black ${tx.type === 'earned' ? 'text-green-neon' :
                        tx.type === 'redeemed' || tx.type === 'expired' ? 'text-yellow-500' :
                          'text-purple-400'
                      }`}>
                      {tx.type === 'earned' ? '+' : '−'}{tx.points}<span className="text-[10px] ml-1 uppercase font-black font-sans tracking-widest opacity-60">pts</span>
                    </p>
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">NOUVEAU SOLDE : {tx.balance_after}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="mt-20 p-10 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] text-center max-w-2xl mx-auto">
          <h4 className="text-lg font-serif font-black italic mb-4 text-white">L'Exquise Loyauté.</h4>
          <p className="text-sm text-zinc-500 leading-relaxed font-serif">
            Chaque gramme, chaque goutte, chaque moment partagé avec Green Mood vous rapproche de privilèges inaccessibles.
            Cultivons ensemble l'exception.
          </p>
        </div>
      </div>
    </div>
  );
}
