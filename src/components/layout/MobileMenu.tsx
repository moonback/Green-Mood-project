/**
 * MobileMenu.tsx
 *
 * Full-screen slide-in mobile navigation menu with animated links,
 * user profile info, and sign-out/admin actions.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, LogOut, ShieldCheck, Leaf } from 'lucide-react';
import { Profile } from '../../lib/types';

interface NavLink {
    name: string;
    path: string;
}

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navLinks: NavLink[];
    currentPath: string;
    user: { id: string; email?: string } | null;
    profile: Profile | null;
    onSignOut: () => void;
}

export default function MobileMenu({ isOpen, onClose, navLinks, currentPath, user, profile, onSignOut }: MobileMenuProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: '100%' }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[100] lg:hidden bg-zinc-950 flex flex-col overflow-hidden"
                >
                    {/* Background glow decorations */}
                    <div className="absolute top-0 right-0 w-[80%] h-[40%] bg-green-neon/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[60%] h-[30%] bg-green-neon/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

                    {/* Mobile header */}
                    <div className="flex items-center justify-center px-6 h-32 relative z-10 border-b border-white/[0.04] bg-zinc-950/50 backdrop-blur-md">
                        <Link to="/" className="flex items-center" onClick={onClose}>
                            <img src="/logo.png" alt="Green Mood" className="h-32 w-auto object-contain" />
                        </Link>
                        <button
                            onClick={onClose}
                            className="absolute right-6 p-3 text-zinc-400 hover:text-white rounded-2xl bg-white/[0.04] border border-white/[0.08] active:scale-90 transition-all"
                            aria-label="Fermer le menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation links */}
                    <nav className="flex-1 overflow-y-auto px-6 py-10 relative z-10 scrollbar-none">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black mb-4 ml-4">Menu Principal</span>
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.path}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                                >
                                    <Link
                                        to={link.path}
                                        onClick={onClose}
                                        className={`group flex items-center justify-between px-5 py-4 rounded-3xl transition-all duration-300 ${currentPath === link.path
                                            ? 'bg-green-neon/10 text-green-neon'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                                            }`}
                                    >
                                        <span className="text-2xl font-serif font-bold tracking-tight">{link.name}</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${currentPath === link.path
                                            ? 'bg-green-neon text-black rotate-0'
                                            : 'bg-white/5 text-zinc-600 -rotate-45 group-hover:rotate-0 group-hover:bg-white/10 group-hover:text-white'
                                            }`}>
                                            <Leaf className="w-4 h-4" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </nav>

                    {/* Footer actions */}
                    <div className="px-6 pb-10 pt-6 border-t border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl relative z-20 space-y-4">
                        {user ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-3xl border border-white/[0.06]">
                                    <div className="w-12 h-12 rounded-2xl bg-green-neon/10 flex items-center justify-center text-green-neon">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Bienvenue</span>
                                        <span className="text-lg font-serif font-black text-white">{profile?.full_name ?? 'Client Mood'}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        to="/compte"
                                        onClick={onClose}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white/[0.04] border border-white/[0.08] rounded-3xl hover:bg-white/[0.08] transition-all"
                                    >
                                        <User className="h-5 w-5 text-green-neon" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Profil</span>
                                    </Link>
                                    <button
                                        onClick={() => { onSignOut(); onClose(); }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-red-400/5 border border-red-400/10 rounded-3xl hover:bg-red-400/10 transition-all group"
                                    >
                                        <LogOut className="h-5 w-5 text-red-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-300">Sortie</span>
                                    </button>
                                </div>
                                {profile?.is_admin && (
                                    <Link
                                        to="/admin"
                                        onClick={onClose}
                                        className="flex items-center justify-center gap-3 p-4 bg-green-neon text-black rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(57,255,20,0.2)]"
                                    >
                                        <ShieldCheck className="h-4 w-4" /> Administration
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/connexion"
                                onClick={onClose}
                                className="flex items-center justify-center gap-4 p-5 bg-green-neon text-black rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(57,255,20,0.3)] active:scale-95 transition-all"
                            >
                                <User className="h-5 w-5" /> Connexion
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
