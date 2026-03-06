import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, ArrowLeft, Save, Sparkles, Phone, BrainCircuit, Target, Zap, Waves, Coins, Cake, Flame, Leaf, ChevronDown, SlidersHorizontal, LockKeyhole, Eye, EyeOff, Monitor, Smartphone, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useBudTenderMemory, SavedPrefs } from '../hooks/useBudTenderMemory';
import { BUDTENDER_DEFAULT_QUIZ, QuizStep, fetchBudTenderSettings } from '../lib/budtenderSettings';
import SEO from '../components/SEO';

export default function Profile() {
    const { user, profile, setProfile } = useAuthStore();
    const { savedPrefs, savePrefs, isLoading: isPrefsLoading } = useBudTenderMemory();

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showBudTender, setShowBudTender] = useState(false);

    const [sessions, setSessions] = useState<Array<{ id: string; device_id: string; device_name: string | null; user_agent: string | null; last_seen: string }>>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [isRevokingOthers, setIsRevokingOthers] = useState(false);

    // Dynamic quiz steps from DB
    const [quizSteps, setQuizSteps] = useState<QuizStep[]>(BUDTENDER_DEFAULT_QUIZ);

    // State for preferences (user's answers)
    const [prefs, setPrefs] = useState<SavedPrefs>({
        goal: '',
        experience: '',
        format: '',
        budget: '',
        age: '',
        intensity: '',
        terpenes: []
    });

    useEffect(() => {
        // Load dynamically configured quiz steps and merge with defaults
        const loadSteps = async () => {
            try {
                const settings = await fetchBudTenderSettings();
                let steps = [...BUDTENDER_DEFAULT_QUIZ];

                if (settings.quiz_steps && settings.quiz_steps.length > 0) {
                    // Keep custom steps but ensure default ones exist if they are official categories
                    const customSteps = settings.quiz_steps;

                    // Map existing steps to update them with custom labels/options if modified in admin
                    steps = steps.map(defStep => {
                        const custom = customSteps.find(s => s.id === defStep.id);
                        return custom || defStep;
                    });

                    // Add any purely custom steps added via Admin
                    customSteps.forEach(cs => {
                        if (!steps.find(s => s.id === cs.id)) {
                            steps.push(cs);
                        }
                    });
                }
                setQuizSteps(steps);
            } catch (err) {
                console.error('Error loading quiz steps:', err);
                setQuizSteps(BUDTENDER_DEFAULT_QUIZ);
            }
        };
        loadSteps();
    }, []);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
        }
    }, [profile]);

    useEffect(() => {
        if (savedPrefs) {
            setPrefs(prev => ({ ...prev, ...savedPrefs }));
        }
    }, [savedPrefs]);

    useEffect(() => {
        if (user?.id) {
            loadSessions();
        }
    }, [user?.id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const isPasswordChangeRequested = Boolean(currentPassword || newPassword || confirmNewPassword);

            if (isPasswordChangeRequested && (!currentPassword || !newPassword || !confirmNewPassword)) {
                throw new Error('Veuillez remplir les trois champs mot de passe pour confirmer le changement.');
            }

            if (isPasswordChangeRequested && newPassword.length < 8) {
                throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
            }

            if (isPasswordChangeRequested && newPassword !== confirmNewPassword) {
                throw new Error('La confirmation du nouveau mot de passe ne correspond pas.');
            }

            if (isPasswordChangeRequested && currentPassword === newPassword) {
                throw new Error('Le nouveau mot de passe doit être différent de l\'ancien.');
            }

            // 1. Update Profile (Name & Phone)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    phone: phone
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Re-authenticate and update password if requested
            if (isPasswordChangeRequested) {
                if (!user.email) {
                    throw new Error('Impossible de valider le mot de passe actuel : e-mail introuvable.');
                }

                const { error: reauthError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword
                });

                if (reauthError) {
                    throw new Error('Ancien mot de passe incorrect.');
                }

                const { error: passwordError } = await supabase.auth.updateUser({
                    password: newPassword
                });

                if (passwordError) throw passwordError;
            }

            // 3. Update AI Preferences
            if (import.meta.env.DEV) console.log('[Profile] Saving prefs:', prefs);
            await savePrefs(prefs as any);

            // Update local store
            setProfile({ ...profile!, full_name: fullName, phone: phone });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setMessage({
                type: 'success',
                text: isPasswordChangeRequested
                    ? 'Votre profil, vos préférences et votre mot de passe ont été mis à jour.'
                    : 'Votre profil et vos préférences ont été mis à jour.'
            });
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            console.error('Save error:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Une erreur est survenue lors de la mise à jour.';

            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    const updatePref = (key: string, value: string) => {
        if (key === 'terpenes') {
            const current = (prefs.terpenes || []) as string[];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            setPrefs(prev => ({ ...prev, [key]: updated }));
        } else {
            setPrefs(prev => ({ ...prev, [key]: value }));
        }
    };


    const getDeviceId = () => localStorage.getItem('gm_device_id') || '';

    const loadSessions = async () => {
        if (!user) return;
        setIsSessionsLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_active_sessions')
                .select('id, device_id, device_name, user_agent, last_seen')
                .eq('user_id', user.id)
                .order('last_seen', { ascending: false });

            if (error) throw error;
            setSessions((data || []) as any);
        } catch (err) {
            console.error('Error loading sessions:', err);
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const handleDisconnectOthers = async () => {
        if (!user) return;
        setIsRevokingOthers(true);
        setMessage(null);

        try {
            const currentDeviceId = getDeviceId();

            const { error: signOutOthersError } = await supabase.auth.signOut({ scope: 'others' });
            if (signOutOthersError) throw signOutOthersError;

            if (currentDeviceId) {
                await supabase
                    .from('user_active_sessions')
                    .delete()
                    .eq('user_id', user.id)
                    .neq('device_id', currentDeviceId);
            }

            await loadSessions();
            setMessage({ type: 'success', text: 'Tous les autres appareils ont été déconnectés.' });
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            console.error('Disconnect others error:', error);
            setMessage({ type: 'error', text: 'Impossible de déconnecter les autres appareils.' });
        } finally {
            setIsRevokingOthers(false);
        }
    };

    const isPrefSelected = (key: string, value: any) => {
        const val = prefs[key as keyof SavedPrefs];
        if (key === 'terpenes') {
            return Array.isArray(val) && val.includes(value);
        }
        return val === value;
    };

    const loyaltyPoints = profile?.loyalty_points ?? 0;
    const nextTierTarget = 1250;
    const progressPct = Math.min(100, Math.round((loyaltyPoints / nextTierTarget) * 100));
    const userInitials = (profile?.full_name || user?.email || 'GM')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 font-sans">
            <SEO title="Paramètres Profil — L'Excellence Green Mood" description="Gérez vos informations personnelles et préférences de bien-être." />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,120,0.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,255,120,0.05),transparent_40%)] bg-zinc-950/80 p-5 md:p-8 backdrop-blur-2xl">
                    <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6 lg:gap-8">
                        <aside className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-[20px] p-5 md:p-6 h-fit xl:sticky xl:top-24">
                            <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-400 hover:text-green-neon text-xs font-semibold uppercase tracking-[0.18em] transition-colors mb-5">
                                <ArrowLeft className="w-4 h-4" />
                                Retour au Hub
                            </Link>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-3">Navigation profil</p>
                            <div className="space-y-2 text-sm">
                                {['Mon Profil', 'Commandes', 'Adresses', 'Fidélité', 'Sécurité', 'Notifications'].map((item, idx) => (
                                    <button
                                        key={item}
                                        type="button"
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${idx === 0 ? 'border-green-neon/40 bg-green-neon/10 text-white shadow-[0_8px_24px_rgba(0,255,120,0.12)]' : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-green-neon/25 hover:text-zinc-200'}`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="space-y-6 md:space-y-8">
                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-[20px] p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1cff6b] hover:shadow-[0_10px_30px_rgba(0,255,120,0.08)]">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-300/25 to-green-neon/40 border border-green-neon/50 flex items-center justify-center text-2xl font-semibold">
                                            {userInitials}
                                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 shadow-[0_0_18px_rgba(28,255,107,0.9)] border-2 border-zinc-950" />
                                        </div>
                                        <div>
                                            <p className="text-3xl md:text-4xl font-semibold leading-tight">{profile?.full_name || 'Membre Green Mood'}</p>
                                            <p className="text-sm text-zinc-300 mt-1">Premium Member</p>
                                            <p className="text-sm text-green-neon mt-1">{loyaltyPoints} points fidélité</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link to="/compte/profil" className="px-5 h-12 inline-flex items-center justify-center rounded-xl border border-green-neon/40 bg-green-neon/10 hover:bg-green-neon/20 transition-all text-sm font-medium">
                                            Modifier profil
                                        </Link>
                                        <Link to="/compte/commandes" className="px-5 h-12 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] hover:border-green-neon/30 transition-all text-sm font-medium">
                                            Voir mes commandes
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="bg-white/[0.03] backdrop-blur-[20px] border border-white/10 rounded-3xl p-7 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1cff6b] hover:shadow-[0_10px_30px_rgba(0,255,120,0.08)]"
                                >
                                    <div className="flex items-center gap-3 mb-7">
                                        <div className="w-10 h-10 rounded-xl bg-green-neon/10 border border-green-neon/25 flex items-center justify-center">
                                            <User className="w-5 h-5 text-green-neon" />
                                        </div>
                                        <h2 className="text-lg font-semibold tracking-wide">Informations personnelles</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[13px] text-zinc-400 uppercase tracking-[0.1em]">Nom complet</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Votre nom..."
                                                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-[15px] text-white focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,120,0.15)] transition-all placeholder:text-zinc-600"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[13px] text-zinc-400 uppercase tracking-[0.1em]">Téléphone</label>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="06 XX XX XX XX"
                                                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-[15px] text-white focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,120,0.15)] transition-all placeholder:text-zinc-600"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2 opacity-70">
                                            <label className="text-[13px] text-zinc-400 uppercase tracking-[0.1em] flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> Adresse e-mail
                                            </label>
                                            <div className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-[15px] text-zinc-400 cursor-not-allowed flex items-center justify-between">
                                                {user?.email}
                                                <Shield className="w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 mt-1 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-5">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                <div>
                                                    <p className="text-[13px] uppercase tracking-[0.1em] text-zinc-400 flex items-center gap-2"><LockKeyhole className="w-4 h-4 text-green-neon" />Sécurité du compte</p>
                                                    <p className="text-sm text-zinc-500">Renseignez les trois champs pour modifier votre mot de passe.</p>
                                                </div>
                                                <span className="text-xs text-zinc-500">Minimum 8 caractères</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[13px] text-zinc-400">Ancien mot de passe</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showCurrentPassword ? 'text' : 'password'}
                                                            value={currentPassword}
                                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                                            placeholder="Votre mot de passe actuel"
                                                            autoComplete="current-password"
                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pr-11 text-[15px] text-white focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,120,0.15)] transition-all placeholder:text-zinc-600"
                                                        />
                                                        <button type="button" onClick={() => setShowCurrentPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-green-neon transition-colors" aria-label={showCurrentPassword ? 'Masquer le mot de passe actuel' : 'Afficher le mot de passe actuel'}>
                                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[13px] text-zinc-400">Nouveau mot de passe</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showNewPassword ? 'text' : 'password'}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            placeholder="Minimum 8 caractères"
                                                            autoComplete="new-password"
                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pr-11 text-[15px] text-white focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,120,0.15)] transition-all placeholder:text-zinc-600"
                                                        />
                                                        <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-green-neon transition-colors" aria-label={showNewPassword ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'}>
                                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[13px] text-zinc-400">Confirmation</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showConfirmNewPassword ? 'text' : 'password'}
                                                            value={confirmNewPassword}
                                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                            placeholder="Répétez le nouveau mot de passe"
                                                            autoComplete="new-password"
                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pr-11 text-[15px] text-white focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_2px_rgba(0,255,120,0.15)] transition-all placeholder:text-zinc-600"
                                                        />
                                                        <button type="button" onClick={() => setShowConfirmNewPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-green-neon transition-colors" aria-label={showConfirmNewPassword ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'}>
                                                            {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08, duration: 0.5, ease: 'easeOut' }}
                                    className="bg-white/[0.03] backdrop-blur-[20px] border border-white/10 rounded-3xl p-7 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1cff6b] hover:shadow-[0_10px_30px_rgba(0,255,120,0.08)]"
                                >
                                    <div className="flex items-center gap-3 mb-7">
                                        <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-300/25 flex items-center justify-center"><Coins className="w-5 h-5 text-amber-300" /></div>
                                        <h2 className="text-lg font-semibold">⭐ Programme Fidélité</h2>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                            <p className="text-[13px] text-zinc-400 uppercase tracking-[0.1em]">Points</p>
                                            <p className="text-4xl font-semibold text-white mt-2">{loyaltyPoints}</p>
                                            <p className="text-sm text-green-neon mt-1">Green Member 🌿</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
                                            <p className="text-[13px] text-zinc-400 uppercase tracking-[0.1em]">Progression vers le niveau suivant</p>
                                            <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPct}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    className="h-full bg-gradient-to-r from-[#00ff88] to-[#00c853]"
                                                />
                                            </div>
                                            <p className="text-sm text-zinc-300 mt-3">{progressPct}% • Récompense suivante : <span className="text-white font-medium">-10% sur votre prochaine commande</span></p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[13px] text-zinc-400 uppercase tracking-[0.1em]">Code de parrainage</p>
                                                <p className="text-xl font-semibold tracking-[0.12em] mt-2">{profile?.referral_code || '---'}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (profile?.referral_code) {
                                                        navigator.clipboard.writeText(profile.referral_code);
                                                        setMessage({ type: 'success', text: 'Code copié dans le presse-papier !' });
                                                        setTimeout(() => setMessage(null), 3000);
                                                    }
                                                }}
                                                className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 hover:border-green-neon/30 transition-all"
                                            >
                                                Copier
                                            </button>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                            <p className="text-[13px] text-zinc-400 uppercase tracking-[0.1em]">Historique rapide</p>
                                            <p className="text-sm text-zinc-300 mt-2">2 commandes ce mois-ci</p>
                                            <Link to="/compte" className="inline-flex mt-3 text-sm text-green-neon hover:text-emerald-300">Voir le détail</Link>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5, ease: 'easeOut' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowBudTender(!showBudTender)}
                                        className={`w-full group relative overflow-hidden rounded-3xl border transition-all duration-500 ${showBudTender ? 'bg-white/[0.03] border-green-neon/20 p-7 md:p-8' : 'bg-gradient-to-br from-green-neon/[0.05] via-white/[0.03] to-emerald-500/[0.04] border-white/10 hover:border-green-neon/30 p-7 md:p-8'}`}
                                    >
                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center"><SlidersHorizontal className="w-5 h-5 text-green-neon" /></div>
                                                <div className="text-left">
                                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">Préférences BudTender <Sparkles className="w-4 h-4 text-green-neon" /></h2>
                                                    <p className="text-[13px] text-zinc-400 mt-1">{showBudTender ? 'Cliquez pour réduire' : 'Personnalisez vos recommandations IA'}</p>
                                                </div>
                                            </div>
                                            <motion.div animate={{ rotate: showBudTender ? 180 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {showBudTender && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-white/[0.03] backdrop-blur-[20px] border border-white/10 border-t-0 rounded-b-3xl px-7 md:px-8 pb-7 md:pb-8 pt-2">
                                                    <p className="text-[13px] text-zinc-400 mb-6">Ces informations permettent à notre IA BudTender d'affiner vos recommandations.</p>
                                                    <div className="space-y-8">
                                                        {quizSteps.map((step, idx) => (
                                                            <motion.div key={step.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.3 }} className="space-y-3">
                                                                <label className="text-[13px] text-zinc-300 uppercase tracking-[0.1em] flex items-center gap-2">
                                                                    {step.id === 'goal' && <Target className="w-3.5 h-3.5 text-green-neon" />}
                                                                    {step.id === 'experience' && <Zap className="w-3.5 h-3.5 text-green-neon" />}
                                                                    {step.id === 'format' && <Waves className="w-3.5 h-3.5 text-green-neon" />}
                                                                    {step.id === 'budget' && <Coins className="w-3.5 h-3.5 text-green-neon" />}
                                                                    {step.id === 'age' && <Cake className="w-3.5 h-3.5 text-green-neon" />}
                                                                    {step.id === 'intensity' && <Flame className="w-3.5 h-3.5 text-green-neon" />}
                                                                    {step.id === 'terpenes' && <Leaf className="w-3.5 h-3.5 text-green-neon" />}
                                                                    {!['goal', 'experience', 'format', 'budget', 'age', 'intensity', 'terpenes'].includes(step.id) && <BrainCircuit className="w-3.5 h-3.5 text-green-neon" />}
                                                                    {step.question}
                                                                </label>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                                    {step.options.map((option) => (
                                                                        <button
                                                                            key={option.value}
                                                                            type="button"
                                                                            onClick={() => updatePref(step.id, option.value)}
                                                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${isPrefSelected(step.id, option.value) ? 'bg-green-neon/15 border-green-neon text-white shadow-[0_0_20px_rgba(34,255,148,0.1)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/[0.08] hover:border-white/20'}`}
                                                                        >
                                                                            <span className="text-lg">{option.emoji}</span>
                                                                            <span className="text-xs font-semibold uppercase tracking-wide leading-tight">{option.label}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.24, duration: 0.5, ease: 'easeOut' }}
                                    className="bg-white/[0.03] backdrop-blur-[20px] border border-white/10 rounded-3xl p-7 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1cff6b] hover:shadow-[0_10px_30px_rgba(0,255,120,0.08)]"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                        <div>
                                            <h2 className="text-lg font-semibold">Appareils connectés</h2>
                                            <p className="text-sm text-zinc-400 mt-1">Vue sécurité des sessions actives.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDisconnectOthers}
                                            disabled={isRevokingOthers || isSessionsLoading || sessions.length <= 1}
                                            className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl border border-red-400/30 text-red-300 hover:text-white hover:border-red-400/70 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {isRevokingOthers ? 'Déconnexion...' : 'Déconnecter les autres'}
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {isSessionsLoading ? (
                                            <p className="text-sm text-zinc-500">Chargement des appareils...</p>
                                        ) : sessions.length === 0 ? (
                                            <p className="text-sm text-zinc-500">Aucun appareil actif détecté.</p>
                                        ) : (
                                            sessions.map((session) => {
                                                const isCurrent = session.device_id === getDeviceId();
                                                const isMobile = /Android|iPhone|iPad|Mobile/i.test(session.user_agent || '');

                                                return (
                                                    <div key={session.id} className={`rounded-2xl border px-4 py-4 transition-all ${isCurrent ? 'border-green-neon/40 bg-green-neon/[0.07]' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-3 min-w-0">
                                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isCurrent ? 'bg-green-neon/20 text-green-neon' : 'bg-white/5 text-zinc-400'}`}>
                                                                    {isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-white truncate">{isCurrent ? '🟢 Cet appareil' : (session.device_name || 'Appareil inconnu')}</p>
                                                                    <p className="text-xs text-zinc-400 mt-1 truncate">{isMobile ? 'Mobile' : 'Desktop'} • Chrome</p>
                                                                    <p className="text-xs text-zinc-500 truncate">Paris, France</p>
                                                                    <p className="text-xs text-zinc-500 mt-1">Dernière activité : {isCurrent ? 'maintenant' : new Date(session.last_seen).toLocaleString('fr-FR')}</p>
                                                                </div>
                                                            </div>
                                                            <button type="button" className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 hover:border-red-400/40 hover:text-red-300 text-xs transition-all">
                                                                Déconnecter
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>

                                <div className="pt-3 space-y-5">
                                    {message && (
                                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`text-sm px-4 text-center ${message.type === 'success' ? 'text-green-neon' : 'text-red-400'}`}>
                                            {message.text}
                                        </motion.p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSaving || isPrefsLoading}
                                        className="group w-full h-14 flex items-center justify-center gap-3 text-black font-semibold uppercase tracking-[0.05em] rounded-[14px] bg-gradient-to-r from-[#00ff88] to-[#00c853] shadow-[0_8px_25px_rgba(0,255,120,0.25)] hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(0,255,120,0.35)] transition-all"
                                    >
                                        <AnimatePresence mode="wait">
                                            {isSaving ? (
                                                <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                                                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Mise à jour en cours...
                                                </motion.div>
                                            ) : (
                                                <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                                                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    Mettre à jour mon profil
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}