import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Users,
    Copy,
    Check,
    Share2,
    Gift,
    ArrowLeft,
    ChevronRight,
    Clock,
    CheckCircle2,
    Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { Referral } from '../lib/types';
import SEO from '../components/SEO';

export default function Referrals() {
    const { profile } = useAuthStore();
    const { settings } = useSettingsStore();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (profile?.id) {
            loadReferrals();
        }
    }, [profile]);

    async function loadReferrals() {
        setIsLoading(true);
        const { data } = await supabase
            .from('referrals')
            .select('*, referee:profiles!referee_id(full_name, created_at)')
            .eq('referrer_id', profile?.id)
            .order('created_at', { ascending: false });

        if (data) setReferrals(data as Referral[]);
        setIsLoading(false);
    }

    const referralCode = profile?.referral_code || 'GRN-XXXXXX';
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalRewards = referrals.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);
    const completedCount = referrals.filter(r => r.status === 'completed').length;

    if (!settings.referral_program_enabled) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 flex flex-col items-center justify-center px-4">
                <SEO title="Parrainage — Green Moon Privilège" description="Le programme de parrainage est temporairement désactivé." />
                <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-[10px] font-black uppercase tracking-widest mb-12">
                    <ArrowLeft className="w-4 h-4" />
                    Retour au Compte
                </Link>
                <div className="text-center space-y-4 max-w-md">
                    <Gift className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
                    <h1 className="text-3xl font-serif font-black uppercase tracking-tighter">Programme Suspendu</h1>
                    <p className="text-zinc-500 text-sm leading-relaxed">Le programme de parrainage est temporairement désactivé. Revenez plus tard pour découvrir nos nouvelles offres.</p>
                </div>
            </div>
        );
    }

    const welcomeBonus = settings.referral_welcome_bonus || 0;

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
            <SEO title="Parrainage — Green Moon Privilège" description="Parrainez vos amis et gagnez des Carats." />

            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-black uppercase tracking-widest transition-colors mb-12">
                    <ArrowLeft className="w-4 h-4" />
                    Retour au Compte
                </Link>

                <div className="space-y-12">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
                            <Gift className="w-3 h-3" />
                            Programme Ambassadeur
                        </div>
                        <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tighter uppercase leading-none">
                            Partagez <br /><span className="text-green-neon italic">L'Excellence.</span>
                        </h1>
                        <p className="text-zinc-500 text-sm max-w-lg leading-relaxed">
                            Invitez vos amis à découvrir Green Moon. Recevez <span className="text-white font-bold">{settings.referral_reward_points} Carats</span> lors de leur première commande payée.
                        </p>
                    </div>

                    {/* Referral Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-green-neon/5 blur-[80px] -z-10 group-hover:bg-green-neon/10 transition-all duration-1000" />
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 space-y-10">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Votre lien unique</p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 font-mono text-sm text-zinc-400 truncate flex items-center">
                                        {referralLink}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center justify-center gap-3 px-8 py-4 bg-green-neon text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] transition-all shrink-0"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copié !
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copier le lien
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-10 border-t border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Amis invités</p>
                                    <p className="text-2xl font-serif font-bold text-white">{referrals.length}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Parrainages réussis</p>
                                    <p className="text-2xl font-serif font-bold text-green-neon">{completedCount}</p>
                                </div>
                                <div className="col-span-2 sm:col-span-1 space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total gagné</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-serif font-bold text-white">{totalRewards}</p>
                                        <Coins className="w-4 h-4 text-yellow-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity List */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3">
                            <Users className="w-4 h-4" />
                            Activité des Filleuls
                        </h3>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />
                                ))}
                            </div>
                        ) : referrals.length === 0 ? (
                            <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]">
                                <Share2 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                <p className="text-zinc-600 font-serif italic">Aucun parrainage pour le moment.</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mt-2">Envoyez votre lien pour commencer !</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {referrals.map((r, i) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl group hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{r.referee?.full_name || 'Ami invité'}</p>
                                                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                                                    Inscrit le {new Date(r.referee?.created_at || r.created_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {r.status === 'completed' ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-black uppercase tracking-widest text-green-neon">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Succès
                                                    </div>
                                                    <p className="text-xs font-bold text-white">+{r.points_awarded} pts</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                    <Clock className="w-3 h-3" />
                                                    En attente d'achat
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* FAQ/Rules */}
                    <div className="p-8 bg-zinc-900/50 rounded-3xl border border-white/5 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Règles du Programme</h4>
                        <ul className="space-y-3">
                            {[
                                "Le filleul doit être un nouvel utilisateur Green Moon.",
                                welcomeBonus > 0 ? `Le filleul reçoit ${welcomeBonus} Carats dès son inscription.` : null,
                                "La récompense est créditée dès que la commande du filleul est réglée.",
                                "Pas de limite sur le nombre de parrainages.",
                                "Les Carats sont valables sur toute la boutique."
                            ].filter(Boolean).map((rule, i) => (
                                <li key={i} className="flex gap-3 text-xs text-zinc-500 leading-relaxed">
                                    <ChevronRight className="w-4 h-4 text-green-neon shrink-0" />
                                    {rule}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
