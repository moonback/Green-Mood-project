import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User,
  Package,
  MapPin,
  Coins,
  ChevronRight,
  LogOut,
  RefreshCw,
  Star,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import SEO from '../components/SEO';

export default function Account() {
  const { profile, user, signOut } = useAuthStore();

  const initials = profile?.full_name
    ? profile.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : '?';

  const settings = useSettingsStore((s) => s.settings);

  const tiles = [
    {
      icon: Package,
      label: 'Mes commandes',
      description: 'Suivre et consulter vos commandes',
      to: '/compte/commandes',
      accent: 'from-blue-500/10 to-blue-600/5',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
      borderHover: 'hover:border-blue-500/40',
    },
    {
      icon: MapPin,
      label: 'Mes adresses',
      description: 'Gérer vos adresses de livraison',
      to: '/compte/adresses',
      accent: 'from-purple-500/10 to-purple-600/5',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
      borderHover: 'hover:border-purple-500/40',
    },
    {
      icon: Coins,
      label: 'Points fidélité',
      description: `${profile?.loyalty_points ?? 0} points disponibles`,
      to: '/compte/fidelite',
      accent: 'from-yellow-500/10 to-yellow-600/5',
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10 group-hover:bg-yellow-500/20',
      borderHover: 'hover:border-yellow-500/40',
    },
    {
      icon: RefreshCw,
      label: 'Abonnements',
      description: 'Livraisons automatiques récurrentes',
      to: '/compte/abonnements',
      accent: 'from-green-500/10 to-green-600/5',
      iconColor: 'text-green-neon',
      iconBg: 'bg-green-neon/10 group-hover:bg-green-neon/20',
      borderHover: 'hover:border-green-neon/40',
      enabled: settings.subscriptions_enabled,
    },
    {
      icon: Star,
      label: 'Mes avis',
      description: 'Rédiger et consulter vos avis',
      to: '/compte/avis',
      accent: 'from-orange-500/10 to-orange-600/5',
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10 group-hover:bg-orange-500/20',
      borderHover: 'hover:border-orange-500/40',
    },
  ].filter(t => t.enabled !== false);

  return (
    <>
      <SEO title="Mon Compte — Green Mood CBD" description="Gérez votre compte Green Mood CBD." />

      <div className="min-h-screen bg-zinc-950">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-green-neon/5 blur-3xl" />
            <div className="absolute -top-16 right-0 w-64 h-64 rounded-full bg-green-neon/3 blur-2xl" />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              {/* Profile card */}
              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden p-8">
                {/* Card background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-neon/5 via-transparent to-transparent pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-neon/30 to-green-neon/10 border border-green-neon/30 flex items-center justify-center shadow-lg glow-box-green-sm">
                      <span className="text-2xl font-bold text-green-neon font-sans tracking-wider">
                        {initials}
                      </span>
                    </div>
                    {/* Online dot */}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-neon border-2 border-zinc-900 shadow-sm" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h1 className="text-2xl font-bold text-white truncate">
                        {profile?.full_name ?? 'Mon compte'}
                      </h1>
                      {profile && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-neon/10 border border-green-neon/30 text-green-neon text-xs font-medium flex-shrink-0">
                          <Shield className="w-3 h-3" />
                          Vérifié
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm truncate">{user?.email}</p>
                  </div>

                  {/* Points badge */}
                  {profile && profile.loyalty_points > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex-shrink-0 flex flex-col items-center gap-0.5 bg-gradient-to-b from-yellow-900/40 to-yellow-900/20 border border-yellow-700/50 px-4 py-3 rounded-2xl"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400 mb-0.5" />
                      <span className="text-yellow-300 font-bold text-lg leading-none">
                        {profile.loyalty_points}
                      </span>
                      <span className="text-yellow-500 text-xs font-medium">points</span>
                    </motion.div>
                  )}
                </div>

                {/* Stats row */}
                <div className="relative mt-6 pt-5 border-t border-zinc-800 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Commandes', value: '—', icon: Package },
                    { label: 'Adresses', value: '—', icon: MapPin },
                    { label: 'Avis', value: '—', icon: Star },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center text-center">
                      <stat.icon className="w-4 h-4 text-zinc-500 mb-1" />
                      <span className="text-white font-semibold text-base">{stat.value}</span>
                      <span className="text-zinc-500 text-xs">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Navigation tiles */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4"
          >
            Mon espace
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {tiles.map((tile, i) => (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
              >
                <Link
                  to={tile.to}
                  className={`group relative flex items-center gap-4 rounded-2xl p-5 border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm transition-all duration-300 ${tile.borderHover} hover:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden`}
                >
                  {/* Subtle gradient bg on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tile.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className={`relative flex-shrink-0 w-11 h-11 rounded-xl ${tile.iconBg} flex items-center justify-center transition-all duration-300`}>
                    <tile.icon className={`w-5 h-5 ${tile.iconColor}`} />
                  </div>

                  <div className="relative flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{tile.label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{tile.description}</p>
                  </div>

                  <ChevronRight className="relative flex-shrink-0 w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all duration-300" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Sign out */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={signOut}
              className="group w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900/60 hover:bg-red-950/20 transition-all duration-300 text-sm font-medium"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
              Se déconnecter
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
