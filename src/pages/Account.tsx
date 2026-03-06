import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users,
  Package,
  MapPin,
  Coins,
  LogOut,
  RefreshCw,
  Star,
  Shield,
  Sparkles,
  ArrowRight,
  CreditCard,
  Settings,
  Heart,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import SEO from '../components/SEO';

export default function Account() {
  const { profile, user, signOut } = useAuthStore();
  const { settings } = useSettingsStore();

  const initials = profile?.full_name
    ? profile.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : '?';

  const services = [
    {
      icon: Package,
      label: 'Historique des Commandes',
      description: 'SUIVRE VOS EXQUISES SÉLECTIONS',
      to: '/compte/commandes',
      accent: 'from-zinc-500/10 to-zinc-500/5',
      badge: 'Dashboard',
    },
    {
      icon: MapPin,
      label: 'Carnet d\'Adresses',
      description: 'GÉRER VOS LIEUX DE DESTINATION',
      to: '/compte/adresses',
      accent: 'from-cyan-500/10 to-zinc-500/5',
      badge: 'Adresse',
    },
    {
      icon: Coins,
      label: 'Programme Privilège',
      description: `${profile?.loyalty_points ?? 0} POINTS D'EXCELLENCE`,
      to: '/compte/fidelite',
      accent: 'from-yellow-400/15 to-amber-500/10',
      badge: 'Niveau',
    },
    {
      icon: RefreshCw,
      label: 'Abonnements Maîtrisés',
      description: 'LIVRAISONS RÉCURRENTES AUTOMATISÉES',
      to: '/compte/abonnements',
      accent: 'from-green-neon/15 to-emerald-500/8',
      enabled: settings.subscriptions_enabled,
      badge: 'Auto',
    },
    {
      icon: Star,
      label: 'Mes Impressions',
      description: 'PARTAGER VOTRE EXPÉRIENCE SENSORIELLE',
      to: '/compte/avis',
      accent: 'from-indigo-500/10 to-zinc-500/5',
      badge: 'Avis',
    },
    {
      icon: Users,
      label: 'Parrainage & Carats',
      description: 'GAGNEZ 500 PTS PAR AMI INVITÉ',
      to: '/compte/parrainage',
      accent: 'from-purple-500/15 to-fuchsia-500/10',
      badge: 'Bonus',
    },
    {
      icon: Heart,
      label: 'Mes Favoris',
      description: 'VOS PRODUITS COUP DE CŒUR',
      to: '/compte/favoris',
      accent: 'from-red-500/15 to-rose-500/10',
      badge: 'Wishlist',
    },
    {
      icon: Settings,
      label: 'Paramètres Profil',
      description: 'VOS INFORMATIONS PERSONNELLES',
      to: '/compte/profil',
      accent: 'from-emerald-500/10 to-zinc-500/5',
      badge: 'Compte',
    }
  ].filter(t => t.enabled !== false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 font-sans">
      <SEO title="Mon Espace — L'Excellence Green Mood" description="Votre espace personnel Green Mood." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,120,0.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,255,120,0.05),transparent_40%)] bg-zinc-950/80 backdrop-blur-2xl p-5 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

            {/* Left: Profile Overview Card */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/[0.03] backdrop-blur-[20px] border border-white/10 rounded-3xl p-7 md:p-8 space-y-9 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1cff6b] hover:shadow-[0_10px_30px_rgba(0,255,120,0.08)]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-neon/5 blur-[60px] -z-10" />

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-green-neon" />
                  Espace Membre Privilégié
                </div>

                {/* Avatar & Verification */}
                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-green-neon/20 blur-2xl group-hover:bg-green-neon/40 transition-all duration-1000 -z-10" />
                    <div className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-green-neon/30 flex items-center justify-center group-hover:border-green-neon transition-all duration-500 overflow-hidden">
                      <span className="text-4xl font-semibold text-green-neon tracking-widest">{initials}</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-neon text-black p-2 rounded-full shadow-[0_0_18px_rgba(0,255,120,0.7)]">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight">{profile?.full_name ?? 'Membre Anonyme'}</h2>
                    <p className="text-sm text-zinc-400 mt-1">{user?.email}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 mt-3">Membre depuis {new Date(profile?.created_at ?? Date.now()).getFullYear()}</p>
                  </div>
                </div>

                {/* Points Stats */}
                <div className="bg-white/[0.04] rounded-2xl p-6 space-y-4 border border-white/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="flex justify-between items-center text-zinc-500 text-[11px] uppercase tracking-[0.12em]">
                    <span>Programme Privilège</span>
                    <Coins className="w-4 h-4 text-yellow-300" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold text-white">{profile?.loyalty_points ?? 0}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-yellow-300/70">POINTS</span>
                  </div>
                  <p className="text-xs text-zinc-500 tracking-wide leading-relaxed">
                    VOTRE STATUT ACTUEL : <span className="text-white font-medium">GREEN MEMBER 🌿</span>
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3 pt-6 border-t border-white/10">
                  <Link
                    to="/compte/profil"
                    className="w-full h-12 inline-flex items-center justify-center rounded-xl border border-green-neon/30 bg-green-neon/10 text-sm font-medium text-white hover:bg-green-neon/20 transition-all"
                  >
                    Modifier mon profil
                  </Link>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-red-300 hover:bg-red-950/20 hover:border-red-500/20 transition-all text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Terminer la session
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right: Service Grid */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((service, i) => (
                  <motion.div
                    key={service.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.08 }}
                  >
                    <Link
                      to={service.to}
                      className="group relative flex flex-col gap-6 p-7 bg-white/[0.03] backdrop-blur-[20px] border border-white/10 rounded-3xl transition-all duration-300 h-full overflow-hidden hover:-translate-y-0.5 hover:border-[#1cff6b] hover:shadow-[0_10px_30px_rgba(0,255,120,0.08)]"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center group-hover:bg-green-neon group-hover:text-black transition-all duration-300">
                          <service.icon className="w-6 h-6" />
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.1em] text-zinc-400 group-hover:text-white group-hover:border-green-neon/30 transition-colors">
                          {service.badge}
                        </div>
                      </div>

                      <div className="relative z-10 space-y-2">
                        <h3 className="text-2xl font-semibold tracking-tight text-white">{service.label}</h3>
                        <p className="text-[13px] tracking-wide text-zinc-400 group-hover:text-zinc-200 transition-colors">
                          {service.description}
                        </p>
                      </div>

                      <div className="relative z-10 inline-flex items-center gap-2 text-sm text-green-neon/80 group-hover:text-green-neon transition-colors">
                        Ouvrir
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-7 bg-white/[0.03] border border-dashed border-white/10 rounded-3xl flex flex-col md:flex-row items-center gap-6 text-center md:text-left transition-all hover:border-green-neon/30 hover:bg-white/[0.04] group">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-green-neon/30 transition-all">
                  <CreditCard className="w-7 h-7 text-zinc-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-lg font-semibold">Besoin d'assistance ?</h4>
                  <p className="text-zinc-400 text-sm max-w-md">Notre conciergerie est à votre disposition 7j/7 pour vous accompagner dans votre sélection.</p>
                </div>
                <Link to="/contact" className="px-6 h-11 inline-flex items-center bg-white text-black text-sm font-semibold rounded-xl hover:bg-green-neon transition-all shrink-0">
                  Contacter l'Expert
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
