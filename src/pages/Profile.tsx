import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, ArrowLeft, Save, Sparkles, Phone, BrainCircuit, Target, Zap, Waves, Coins, Cake, Flame, Leaf, ChevronDown, SlidersHorizontal } from 'lucide-react';
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
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showBudTender, setShowBudTender] = useState(false);

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setMessage(null);

        try {
            // 1. Update Profile (Name & Phone)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    phone: phone
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update AI Preferences
            if (import.meta.env.DEV) console.log('[Profile] Saving prefs:', prefs);
            await savePrefs(prefs as any);

            // Update local store
            setProfile({ ...profile!, full_name: fullName, phone: phone });

            setMessage({ type: 'success', text: 'Votre profil et vos préférences ont été mis à jour.' });
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'Une erreur est survenue lors de la mise à jour.' });
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

    const isPrefSelected = (key: string, value: any) => {
        const val = prefs[key as keyof SavedPrefs];
        if (key === 'terpenes') {
            return Array.isArray(val) && val.includes(value);
        }
        return val === value;
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
            <SEO title="Paramètres Profil — L'Excellence Green Mood" description="Gérez vos informations personnelles et préférences de bien-être." />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-black uppercase tracking-widest transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Retour au Hub
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-none uppercase">
                            VOTRE <br /><span className="text-green-neon italic">IDENTITÉ.</span>
                        </h1>
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600 md:text-right">
                        PARAMÈTRES CONFIDENTIELS
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Section 1: Informations Personnelles */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-green-neon/5 blur-[60px] -z-10 group-hover:bg-green-neon/8 transition-colors duration-700" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/3 blur-[40px] -z-10" />

                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-2xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-green-neon" />
                            </div>
                            <h2 className="text-xl font-serif italic uppercase tracking-wider">Informations Personnelles</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] px-4 flex items-center gap-2">
                                    Nom Complet
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Votre nom..."
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-base font-serif italic text-white focus:outline-none focus:border-green-neon focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(57,255,20,0.05)] transition-all placeholder:text-zinc-800"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] px-4 flex items-center gap-2">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="06 XX XX XX XX"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-base font-mono text-white focus:outline-none focus:border-green-neon focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(57,255,20,0.05)] transition-all placeholder:text-zinc-800"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2 opacity-60">
                                <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] px-4 flex items-center gap-3">
                                    <Mail className="w-3 h-3" />
                                    Adresse e-mail (Identifiant Unique)
                                </label>
                                <div className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-base font-mono text-zinc-500 cursor-not-allowed flex items-center justify-between">
                                    {user?.email}
                                    <Shield className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Section: Récompenses & Fidélité */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                        className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 left-0 w-40 h-40 bg-amber-400/5 blur-[60px] -z-10 group-hover:bg-amber-400/8 transition-colors duration-700" />

                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                                <Coins className="w-5 h-5 text-amber-400" />
                            </div>
                            <h2 className="text-xl font-serif italic uppercase tracking-wider">Récompenses & Fidélité</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:border-amber-400/20 transition-all duration-300">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Points accumulés</p>
                                    <p className="text-3xl font-black text-amber-400">{profile?.loyalty_points || 0}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:border-white/10 transition-all duration-300">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Code de Parrainage</p>
                                    <p className="text-xl font-mono font-black text-white tracking-widest">{profile?.referral_code || '---'}</p>
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
                                    className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center border border-white/5"
                                >
                                    <Save className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Section 2: Préférences BudTender — Collapsible */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                    >
                        {/* Toggle button — always visible */}
                        <button
                            type="button"
                            onClick={() => setShowBudTender(!showBudTender)}
                            className={`w-full group relative overflow-hidden rounded-[3rem] border transition-all duration-500 ${showBudTender
                                    ? 'bg-white/[0.02] border-green-neon/20 p-8 md:p-12'
                                    : 'bg-gradient-to-br from-green-neon/[0.04] via-white/[0.02] to-emerald-500/[0.03] border-white/5 hover:border-green-neon/30 p-8 md:p-10'
                                }`}
                        >
                            {/* Glow background */}
                            <div className={`absolute inset-0 transition-opacity duration-700 ${showBudTender ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}>
                                <div className="absolute top-0 right-1/4 w-48 h-48 bg-green-neon/5 blur-[80px]" />
                                <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-emerald-400/5 blur-[60px]" />
                            </div>

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${showBudTender
                                            ? 'bg-green-neon/15 border border-green-neon/30 shadow-[0_0_20px_rgba(57,255,20,0.1)]'
                                            : 'bg-green-neon/10 border border-green-neon/20 group-hover:shadow-[0_0_25px_rgba(57,255,20,0.15)] group-hover:border-green-neon/40'
                                        }`}>
                                        <SlidersHorizontal className={`w-5 h-5 text-green-neon transition-transform duration-500 ${showBudTender ? 'rotate-90' : 'group-hover:rotate-12'
                                            }`} />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-xl font-serif italic uppercase tracking-wider text-white flex items-center gap-3">
                                            Préférences BudTender
                                            <Sparkles className={`w-4 h-4 text-green-neon transition-all duration-300 ${showBudTender ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'
                                                }`} />
                                        </h2>
                                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mt-1">
                                            {showBudTender ? 'Cliquez pour réduire' : 'Personnalisez vos recommandations IA'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!showBudTender && (
                                        <span className="hidden md:inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-neon/60 group-hover:text-green-neon transition-colors">
                                            <BrainCircuit className="w-3.5 h-3.5" />
                                            Configurer
                                        </span>
                                    )}
                                    <motion.div
                                        animate={{ rotate: showBudTender ? 180 : 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-green-neon/30 transition-colors"
                                    >
                                        <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-green-neon transition-colors" />
                                    </motion.div>
                                </div>
                            </div>
                        </button>

                        {/* Expandable content */}
                        <AnimatePresence>
                            {showBudTender && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 border-t-0 rounded-b-[3rem] px-8 md:px-12 pb-8 md:pb-12 pt-2 relative">
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-neon/5 blur-[50px] -z-10" />

                                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-8 leading-relaxed">
                                            Ces informations permettent à notre IA BudTender de personnaliser vos recommandations et d'adapter son expertise à vos besoins réels.
                                        </p>

                                        <div className="space-y-10">
                                            {quizSteps.map((step, idx) => (
                                                <motion.div
                                                    key={step.id}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.06, duration: 0.4 }}
                                                    className="space-y-4"
                                                >
                                                    <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] px-4 flex items-center gap-4">
                                                        {step.id === 'goal' && <Target className="w-3 h-3 text-green-neon" />}
                                                        {step.id === 'experience' && <Zap className="w-3 h-3 text-green-neon" />}
                                                        {step.id === 'format' && <Waves className="w-3 h-3 text-green-neon" />}
                                                        {step.id === 'budget' && <Coins className="w-3 h-3 text-green-neon" />}
                                                        {step.id === 'age' && <Cake className="w-3 h-3 text-green-neon" />}
                                                        {step.id === 'intensity' && <Flame className="w-3 h-3 text-green-neon" />}
                                                        {step.id === 'terpenes' && <Leaf className="w-3 h-3 text-green-neon" />}
                                                        {!['goal', 'experience', 'format', 'budget', 'age', 'intensity', 'terpenes'].includes(step.id) && <BrainCircuit className="w-3 h-3 text-green-neon" />}
                                                        {step.question}
                                                    </label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                        {step.options.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => updatePref(step.id, option.value)}
                                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${isPrefSelected(step.id, option.value)
                                                                    ? 'bg-green-neon/10 border-green-neon text-white shadow-[0_0_20px_rgba(34,255,148,0.1)]'
                                                                    : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/[0.08] hover:border-white/10'
                                                                    }`}
                                                            >
                                                                <span className="text-lg">{option.emoji}</span>
                                                                <span className="text-[11px] font-black uppercase tracking-tighter leading-tight">
                                                                    {option.label}
                                                                </span>
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

                    {/* Submit Button */}
                    <div className="pt-8 space-y-6">
                        {message && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`text-xs font-black uppercase tracking-widest px-4 text-center ${message.type === 'success' ? 'text-green-neon' : 'text-red-400'}`}
                            >
                                {message.text}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving || isPrefsLoading}
                            className="group w-full flex items-center justify-center gap-4 bg-white text-black font-black uppercase tracking-[0.3em] py-6 rounded-[2rem] hover:bg-green-neon transition-all shadow-2xl relative overflow-hidden"
                        >
                            <AnimatePresence mode="wait">
                                {isSaving ? (
                                    <motion.div
                                        key="saving"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Synchronisation...
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="save"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Mettre à jour mon profil
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </form>

                <div className="mt-16 text-center space-y-4">
                    <div className="w-px h-16 bg-gradient-to-b from-green-neon/50 to-transparent mx-auto" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-zinc-700 leading-loose">VOS DONNÉES SONT PROTÉGÉES PAR NOS STANDARDS DE SÉCURITÉ.<br />L'EXCELLENCE EST NOTRE ENGAGEMENT.</p>
                </div>

            </div>
        </div>
    );
}
