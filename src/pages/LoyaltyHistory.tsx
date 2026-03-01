import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coins, ArrowLeft, TrendingUp, TrendingDown, Settings2, Sparkles, Star, Award, Crown, Gift, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { LoyaltyTransaction } from '../lib/types';
import SEO from '../components/SEO';

/* ── Tier definitions ─────────────────────────────────────────────── */

interface Tier {
  name: string;
  minPoints: number;
  maxPoints: number | null;
  icon: typeof Award;
  color: string;       // tailwind text color
  bgGlow: string;      // glow color class
  border: string;      // border accent
  gradient: string;    // gradient for the card
  benefits: string[];
}

const TIERS: Tier[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 499,
    icon: Award,
    color: 'text-amber-600',
    bgGlow: 'bg-amber-600/20',
    border: 'border-amber-600/30',
    gradient: 'from-amber-900/20 via-amber-800/10 to-transparent',
    benefits: ['1 point par euro', 'Accès aux offres membres', 'Newsletter exclusive'],
  },
  {
    name: 'Silver',
    minPoints: 500,
    maxPoints: 1499,
    icon: Star,
    color: 'text-zinc-300',
    bgGlow: 'bg-zinc-300/20',
    border: 'border-zinc-400/30',
    gradient: 'from-zinc-600/20 via-zinc-500/10 to-transparent',
    benefits: ['1.5x points par euro', 'Livraison offerte dès 30\u00A0\u20AC', 'Accès ventes privées', 'Cadeau anniversaire'],
  },
  {
    name: 'Gold',
    minPoints: 1500,
    maxPoints: null,
    icon: Crown,
    color: 'text-yellow-400',
    bgGlow: 'bg-yellow-400/20',
    border: 'border-yellow-400/30',
    gradient: 'from-yellow-500/20 via-yellow-400/10 to-transparent',
    benefits: ['2x points par euro', 'Livraison offerte illimitée', 'Accès avant-premières', 'Réductions VIP -15%', 'Service prioritaire'],
  },
];

function getCurrentTier(points: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
}

function getNextTier(points: number): Tier | null {
  const current = getCurrentTier(points);
  const idx = TIERS.indexOf(current);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

/* ── Transaction type config ──────────────────────────────────────── */

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
    sign: '\u2212',
  },
  adjusted: {
    label: 'AJUSTEMENT EXPERT',
    icon: Settings2,
    color: 'text-purple-400 bg-purple-400/5 border-purple-400/20',
    sign: '\u00B1',
  },
  expired: {
    label: 'POINTS EXPIRÉS',
    icon: TrendingDown,
    color: 'text-zinc-500 bg-white/5 border-white/10',
    sign: '\u2212',
  },
};

/* ── Component ────────────────────────────────────────────────────── */

export default function LoyaltyHistory() {
  const { user, profile } = useAuthStore();
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const points = profile?.loyalty_points ?? 0;
  const currentTier = useMemo(() => getCurrentTier(points), [points]);
  const nextTier = useMemo(() => getNextTier(points), [points]);

  const progressPercent = useMemo(() => {
    if (!nextTier) return 100; // already max tier
    const range = nextTier.minPoints - currentTier.minPoints;
    const progress = points - currentTier.minPoints;
    return Math.min(Math.round((progress / range) * 100), 100);
  }, [points, currentTier, nextTier]);

  const pointsToNext = nextTier ? nextTier.minPoints - points : 0;

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

  const TierIcon = currentTier.icon;

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
            STATUT : MEMBRE MASTER — {points} CARATS
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
            GAMIFIED TIER CARD
            ════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`relative bg-white/[0.02] backdrop-blur-3xl border ${currentTier.border} rounded-[3rem] p-8 md:p-12 mb-10 overflow-hidden`}
        >
          {/* Background glow */}
          <div className={`absolute -top-20 -right-20 w-80 h-80 ${currentTier.bgGlow} blur-[120px] -z-10 pointer-events-none`} />
          <div className={`absolute -bottom-10 -left-10 w-56 h-56 ${currentTier.bgGlow} blur-[100px] -z-10 pointer-events-none opacity-50`} />

          {/* Top: tier badge + info */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Tier icon badge */}
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
              className="relative flex-shrink-0"
            >
              <div className={`absolute inset-0 ${currentTier.bgGlow} blur-2xl rounded-full -z-10`} />
              <div className={`w-24 h-24 md:w-28 md:h-28 bg-zinc-900/80 border-2 ${currentTier.border} rounded-[2rem] flex items-center justify-center relative overflow-hidden`}>
                <TierIcon className={`w-12 h-12 md:w-14 md:h-14 ${currentTier.color}`} />
                <div className={`absolute inset-0 bg-gradient-to-t ${currentTier.gradient}`} />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
                className="absolute -bottom-2 -right-2 bg-green-neon text-black p-2 rounded-xl shadow-lg"
              >
                <Zap className="w-4 h-4" />
              </motion.div>
            </motion.div>

            {/* Tier info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className={`text-3xl md:text-4xl font-serif font-black uppercase tracking-tight ${currentTier.color}`}>
                  {currentTier.name}
                </h2>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Niveau actuel
                </span>
              </div>
              <p className="text-sm text-zinc-400 font-serif italic max-w-md">
                {currentTier.name === 'Bronze' && 'Bienvenue dans le programme. Chaque achat vous rapproche de nouveaux privilèges.'}
                {currentTier.name === 'Silver' && 'Vous avez atteint le palier Silver. Profitez d\'avantages exclusifs sur vos commandes.'}
                {currentTier.name === 'Gold' && 'Statut Gold atteint. Vous bénéficiez de l\'intégralité des privilèges Green Mood.'}
              </p>
            </div>

            {/* Points display on the right */}
            <div className="flex-shrink-0 text-center lg:text-right space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">Vos points</p>
              <p className={`text-5xl md:text-6xl font-serif font-black leading-none ${currentTier.color}`}>
                {points}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Carats</p>
            </div>
          </div>

          {/* Progress bar to next tier */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className={currentTier.color}>{currentTier.name} — {currentTier.minPoints} pts</span>
              {nextTier ? (
                <span className="text-zinc-500">{nextTier.name} — {nextTier.minPoints} pts</span>
              ) : (
                <span className="text-yellow-400">Niveau maximum atteint</span>
              )}
            </div>
            <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full relative"
                style={{
                  background: currentTier.name === 'Gold'
                    ? 'linear-gradient(90deg, #facc15, #f59e0b)'
                    : currentTier.name === 'Silver'
                      ? 'linear-gradient(90deg, #a1a1aa, #d4d4d8)'
                      : 'linear-gradient(90deg, #b45309, #d97706)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </motion.div>
            </div>
            {nextTier && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-zinc-500 font-mono text-center"
              >
                Encore <span className="text-white font-black">{pointsToNext}</span> points pour atteindre{' '}
                <span className={`font-black ${TIERS[TIERS.indexOf(currentTier) + 1]?.color ?? ''}`}>{nextTier.name}</span>
              </motion.p>
            )}
          </div>

          {/* Tier benefits */}
          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4">
              Avantages {currentTier.name}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentTier.benefits.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <Gift className={`w-4 h-4 flex-shrink-0 ${currentTier.color}`} />
                  <span className="text-sm text-zinc-300">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* All tiers overview */}
          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4">
              Tous les paliers
            </p>
            <div className="grid grid-cols-3 gap-3">
              {TIERS.map((tier) => {
                const isActive = tier.name === currentTier.name;
                const TIcon = tier.icon;
                return (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`relative rounded-2xl p-4 text-center transition-all duration-300 ${
                      isActive
                        ? `bg-white/[0.05] border-2 ${tier.border}`
                        : 'bg-white/[0.01] border border-white/5 opacity-50'
                    }`}
                  >
                    <TIcon className={`w-6 h-6 mx-auto mb-2 ${tier.color}`} />
                    <p className={`text-sm font-black uppercase tracking-wider ${tier.color}`}>{tier.name}</p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-1">
                      {tier.maxPoints ? `${tier.minPoints}–${tier.maxPoints}` : `${tier.minPoints}+`} pts
                    </p>
                    {isActive && (
                      <motion.div
                        layoutId="tier-indicator"
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-neon rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

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
                  {points}<span className="text-yellow-500 text-xl md:text-2xl ml-4 italic font-sans uppercase tracking-[0.2em]">Carats</span>
                </p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {Math.floor(points / 100)} &times; 5&euro; DE RÉDUCTION DISPONIBLES
                </span>
                <span className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black uppercase tracking-widest text-yellow-500">
                  1&euro; DÉPENSÉ = 1 POINT
                </span>
              </div>
            </div>

            <div className="hidden lg:block w-px h-32 bg-white/5 mx-4" />

            <div className="hidden lg:flex flex-col gap-6 text-right">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-zinc-600 uppercase">PROCHAIN PALIER</p>
                <p className="text-xl font-serif font-black text-white italic">
                  {nextTier ? nextTier.name : 'Niveau Max'}
                </p>
              </div>
              <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
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
                      {tx.type === 'earned' ? '+' : '\u2212'}{tx.points}<span className="text-[10px] ml-1 uppercase font-black font-sans tracking-widest opacity-60">pts</span>
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
