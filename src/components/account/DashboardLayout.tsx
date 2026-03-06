import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, MapPin, Package, RefreshCw, Settings, Shield, Sparkles, Star, Users } from 'lucide-react';
import type { ReactNode } from 'react';

type DashboardLayoutProps = {
  title: string;
  subtitle: string;
  statText?: string;
  children: ReactNode;
  rightAction?: ReactNode;
  maxWidthClass?: string;
};

const NAV_ITEMS = [
  { to: '/compte/profil', label: 'Mon profil', icon: Settings },
  { to: '/compte/commandes', label: 'Commandes', icon: Package },
  { to: '/compte/adresses', label: 'Adresses', icon: MapPin },
  { to: '/compte/fidelite', label: 'Fidélité', icon: Star },
  { to: '/compte/parrainage', label: 'Parrainage', icon: Users },
  { to: '/compte/abonnements', label: 'Abonnements', icon: RefreshCw },
  { to: '/compte/avis', label: 'Avis', icon: Sparkles },
  { to: '/compte/favoris', label: 'Favoris', icon: Bell },
];

export default function DashboardLayout({
  title,
  subtitle,
  statText,
  children,
  rightAction,
  maxWidthClass = 'max-w-7xl',
}: DashboardLayoutProps) {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 font-sans">
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,120,0.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,255,120,0.05),transparent_40%)] bg-zinc-950/80 backdrop-blur-2xl p-5 md:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-[250px_1fr] gap-6 lg:gap-8">
            <aside className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-[20px] p-5 h-fit xl:sticky xl:top-24">
              <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-400 hover:text-green-neon text-xs font-semibold uppercase tracking-[0.18em] transition-colors mb-5">
                <ArrowLeft className="w-4 h-4" />
                Retour au Hub
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-zinc-400 mb-4">
                <Shield className="w-3.5 h-3.5 text-green-neon" /> Dashboard client
              </div>
              <div className="space-y-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = path === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${active ? 'border-green-neon/40 bg-green-neon/10 text-white' : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-green-neon/25 hover:text-zinc-200'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </aside>

            <div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{title}</h1>
                  <p className="text-zinc-400 text-sm mt-2">{subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  {statText && <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">{statText}</span>}
                  {rightAction}
                </div>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
