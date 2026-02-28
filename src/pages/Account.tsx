import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Package, MapPin, Coins, ChevronRight, LogOut, RefreshCw, Star } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import SEO from '../components/SEO';

export default function Account() {
  const { profile, user, signOut } = useAuthStore();

  const tiles = [
    {
      icon: Package,
      label: 'Mes commandes',
      description: 'Suivre et consulter l\'historique de vos commandes',
      to: '/compte/commandes',
    },
    {
      icon: MapPin,
      label: 'Mes adresses',
      description: 'Gérer vos adresses de livraison',
      to: '/compte/adresses',
    },
    {
      icon: Coins,
      label: 'Mes points fidélité',
      description: `${profile?.loyalty_points ?? 0} points — voir l'historique`,
      to: '/compte/fidelite',
    },
    {
      icon: RefreshCw,
      label: 'Mes abonnements',
      description: 'Gérer vos livraisons automatiques',
      to: '/compte/abonnements',
    },
    {
      icon: Star,
      label: 'Mes avis',
      description: 'Consulter et rédiger vos avis produits',
      to: '/compte/avis',
    },
  ];

  return (
    <>
      <SEO title="Mon Compte — Green Mood CBD" description="Gérez votre compte Green Mood CBD." />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-green-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-green-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">
              {profile?.full_name ?? 'Mon compte'}
            </h1>
            <p className="text-zinc-400 text-sm">{user?.email}</p>
          </div>
          {profile && profile.loyalty_points > 0 && (
            <div className="ml-auto flex items-center gap-2 bg-yellow-900/30 border border-yellow-800 px-3 py-1.5 rounded-xl">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">
                {profile.loyalty_points} pts
              </span>
            </div>
          )}
        </motion.div>

        {/* Tiles */}
        <div className="space-y-3 mb-6">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
                  <Link
                  to={tile.to}
                  className="flex items-center gap-4 bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-600 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 group-hover:bg-green-primary/20 flex items-center justify-center transition-colors">
                    <tile.icon className="w-5 h-5 text-green-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{tile.label}</p>
                    <p className="text-sm text-zinc-400">{tile.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
            </motion.div>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 rounded-2xl py-3 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </>
  );
}
