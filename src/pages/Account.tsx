import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User,
  Users,
  Package,
  MapPin,
  Coins,
  ChevronRight,
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
      accent: 'from-zinc-500/5 to-zinc-500/2',
    },
    {
      icon: MapPin,
      label: 'Carnet d\'Adresses',
      description: 'GÉRER VOS LIEUX DE DESTINATION',
      to: '/compte/adresses',
      accent: 'from-zinc-500/5 to-zinc-500/2',
    },
    {
      icon: Coins,
      label: 'Programme Privilège',
      description: `${profile?.loyalty_points ?? 0} POINTS D'EXCELLENCE`,
      to: '/compte/fidelite',
      accent: 'from-yellow-500/5 to-yellow-500/2',
    },
    {
      icon: RefreshCw,
      label: 'Abonnements Maîtrisés',
      description: 'LIVRAISONS RÉCURRENTES AUTOMATISÉES',
      to: '/compte/abonnements',
      accent: 'from-green-neon/5 to-green-neon/2',
      enabled: settings.subscriptions_enabled,
    },
    {
      icon: Star,
      label: 'Mes Impressions',
      description: 'PARTAGER VOTRE EXPÉRIENCE SENSORIELLE',
      to: '/compte/avis',
      accent: 'from-zinc-500/5 to-zinc-500/2',
    },
    {
      icon: Users,
      label: 'Parrainage & Carats',
      description: 'GAGNEZ 500 PTS PAR AMI INVITÉ',
      to: '/compte/parrainage',
      accent: 'from-purple-500/5 to-purple-500/2',
    },
    {
      icon: Heart,
      label: 'Mes Favoris',
      description: 'VOS PRODUITS COUP DE CŒUR',
      to: '/compte/favoris',
      accent: 'from-red-500/5 to-red-500/2',
    },
    {
      icon: Settings,
      label: 'Paramètres Profil',
      description: 'VOS INFORMATIONS PERSONNELLES',
      to: '/compte/profil',
      accent: 'from-zinc-500/5 to-zinc-500/2',
    }
  ].filter(t => t.enabled !== false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
      <SEO title="Mon Espace — L'Excellence Green Mood" description="Votre espace personnel Green Mood." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero Section */}
        {/* <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20 relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-green-neon/5 blur-[100px] -z-10" />

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              <Sparkles className="w-3 h-3 text-green-neon" />
              Espace Membre Privilégié
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter leading-none uppercase">
              Mon <br /><span className="text-green-neon italic">Espace.</span>
            </h1>
          </div>

          <div className="md:text-right space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.4em] text-zinc-600">CLIENT RÉFÉRENCE</p>
            <p className="text-xl font-serif font-medium tracking-wide italic text-white/80">{user?.email}</p>
          </div>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left: Profile Overview Card */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-12 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-neon/5 blur-[60px] -z-10" />

              {/* Avatar & Verification */}
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-green-neon/20 blur-2xl group-hover:bg-green-neon/40 transition-all duration-1000 -z-10" />
                  <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border-2 border-green-neon/30 flex items-center justify-center group-hover:border-green-neon transition-all duration-500 overflow-hidden">
                    <span className="text-4xl font-serif font-black text-green-neon tracking-widest">{initials}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-neon text-black p-2 rounded-2xl shadow-xl">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-serif font-black tracking-tight">{profile?.full_name ?? 'Membre Anonyme'}</h2>
                  <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500 mt-2">Membre depuis {new Date(profile?.created_at ?? Date.now()).getFullYear()}</p>
                </div>
              </div>

              {/* Points Stats */}
              <div className="bg-white/5 rounded-[2.5rem] p-8 space-y-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="flex justify-between items-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                  <span>Fidélité</span>
                  <Coins className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-serif font-black text-white">{profile?.loyalty_points ?? 0}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-400/60">CARATS</span>
                </div>
                <p className="text-[10px] text-zinc-600 font-mono tracking-widest leading-relaxed">
                  VOTRE STATUT ACTUEL : <span className="text-white">MEMBRE MASTER</span>
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4 pt-10 border-t border-white/5">
                <button
                  onClick={signOut}
                  className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 hover:border-red-500/20 transition-all text-xs font-black uppercase tracking-widest group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Terminer la Session
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right: Service Grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service, i) => (
                <motion.div
                  key={service.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <Link
                    to={service.to}
                    className="group relative flex flex-col gap-8 p-10 bg-white/[0.02] border border-white/[0.05] rounded-[3rem] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 h-full overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                    <div className="flex justify-between items-start relative z-10">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover:bg-green-neon group-hover:text-black transition-all duration-500">
                        <service.icon className="w-7 h-7" />
                      </div>
                      <div className="p-3 rounded-full border border-white/5 group-hover:border-green-neon/30 transition-colors">
                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-green-neon transition-all group-hover:translate-x-1" />
                      </div>
                    </div>

                    <div className="relative z-10 space-y-2">
                      <h3 className="text-2xl font-serif font-black tracking-tight text-white">{service.label}</h3>
                      <p className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        {service.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 p-10 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 text-center md:text-left transition-all hover:bg-white/[0.02] hover:border-white/10 group">
              <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-green-neon/30 transition-all">
                <CreditCard className="w-8 h-8 text-zinc-700" />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-lg font-serif font-black italic">Besoin d'assistance ?</h4>
                <p className="text-zinc-500 text-sm max-w-md">Notre conciergerie est à votre disposition 7j/7 pour vous accompagner dans votre sélection.</p>
              </div>
              <Link to="/contact" className="px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-green-neon transition-all shrink-0">
                Contacter l'Expert
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
