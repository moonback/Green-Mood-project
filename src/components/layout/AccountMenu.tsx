/**
 * AccountMenu.tsx
 *
 * Desktop dropdown menu for authenticated users (profile, orders, admin, sign-out).
 * Renders a "Connexion" link for unauthenticated users.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Clock, ShieldCheck, LogOut, Leaf } from 'lucide-react';
import { Profile } from '../../lib/types';

interface AccountMenuProps {
    user: { id: string; email?: string } | null;
    profile: Profile | null;
    isOpen: boolean;
    onToggle: () => void;
    onSignOut: () => void;
}

export default function AccountMenu({ user, profile, isOpen, onToggle, onSignOut }: AccountMenuProps) {
    if (!user) {
        return (
            <Link
                to="/connexion"
                className="hidden md:flex items-center gap-3 px-6 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/10 hover:border-green-neon/20 text-white rounded-full transition-all duration-300 group"
            >
                <User className="h-3.5 w-3.5 text-zinc-500 group-hover:text-green-neon transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Connexion</span>
            </Link>
        );
    }

    return (
        <>
            {/* Loyalty Points Badge */}
            {profile && (
                <Link
                    to="/compte"
                    className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full hover:border-green-neon/30 hover:bg-white/[0.06] transition-all duration-300 group"
                >
                    <div className="w-5 h-5 rounded-full bg-green-neon/10 flex items-center justify-center group-hover:bg-green-neon/20 transition-colors">
                        <Leaf className="h-2.5 w-2.5 text-green-neon" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-500 uppercase font-black leading-none tracking-tighter">Points</span>
                        <span className="text-xs font-black text-white leading-none mt-0.5 group-hover:text-green-neon transition-colors">
                            {profile.loyalty_points ?? 0}
                        </span>
                    </div>
                </Link>
            )}

            {/* Account Dropdown */}
            <div className="relative hidden md:block">
                <button
                    onClick={onToggle}
                    className={`flex items-center gap-2.5 p-1.5 pr-4 rounded-full border transition-all duration-300 ${isOpen
                        ? 'bg-green-neon border-green-neon text-black'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:border-green-neon/40 hover:text-white shadow-lg'
                        }`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-black/20' : 'bg-white/[0.08]'}`}>
                        <User className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">
                        {profile?.full_name?.split(' ')[0] ?? 'Profil'}
                    </span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            className="absolute right-0 top-full mt-4 w-56 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-2"
                        >
                            <Link
                                to="/compte"
                                className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-zinc-400 hover:bg-white/[0.04] hover:text-white rounded-xl transition-all"
                            >
                                <User className="h-4 w-4" />
                                Tableau de bord
                            </Link>
                            <Link
                                to="/compte/commandes"
                                className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-zinc-400 hover:bg-white/[0.04] hover:text-white rounded-xl transition-all"
                            >
                                <Clock className="h-4 w-4" />
                                Historique
                            </Link>
                            {profile?.is_admin && (
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-green-neon hover:bg-green-neon/10 rounded-xl transition-all"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    Administration
                                </Link>
                            )}
                            <div className="h-px bg-white/[0.06] my-2 mx-4" />
                            <button
                                onClick={onSignOut}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                            >
                                <LogOut className="h-4 w-4" />
                                Déconnexion
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
