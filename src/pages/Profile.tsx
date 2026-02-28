import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, ArrowLeft, Save, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import SEO from '../components/SEO';

export default function Profile() {
    const { user, profile, setProfile } = useAuthStore();
    const [fullName, setFullName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
        }
    }, [profile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setMessage(null);

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', user.id);

        if (error) {
            setMessage({ type: 'error', text: 'Une erreur est survenue lors de la mise à jour.' });
        } else {
            setProfile({ ...profile!, full_name: fullName });
            setMessage({ type: 'success', text: 'Votre profil a été mis à jour avec succès.' });
            setTimeout(() => setMessage(null), 3000);
        }
        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
            <SEO title="Paramètres Profil — L'Excellence Green Mood" description="Gérez vos informations personnelles." />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-black uppercase tracking-widest transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Retour au Hub
                        </Link>
                        <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight leading-none uppercase">
                            VOTRE <br /><span className="text-green-neon italic">IDENTITÉ.</span>
                        </h1>
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600 md:text-right">
                        PARAMÈTRES CONFIDENTIELS
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 md:p-16 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-neon/5 blur-[100px] -z-10" />

                    <form onSubmit={handleSave} className="space-y-12 relative z-10">

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] px-4 flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Nom Complet
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Votre nom d'exception..."
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-8 py-6 text-lg font-serif italic text-white focus:outline-none focus:border-green-neon focus:bg-white/[0.08] transition-all placeholder:text-zinc-800"
                                    required
                                />
                            </div>

                            <div className="space-y-2 opacity-60">
                                <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] px-4 flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    Adresse de Correspondance
                                </label>
                                <div className="w-full bg-white/5 border border-white/5 rounded-2xl px-8 py-6 text-lg font-serif italic text-zinc-500 cursor-not-allowed flex items-center justify-between">
                                    {user?.email}
                                    <Shield className="w-4 h-4" />
                                </div>
                                <p className="text-[9px] font-mono text-zinc-700 px-4 mt-2">L'ADRESSE E-MAIL EST LIÉE À VOTRE IDENTIFIANT UNIQUE ET NE PEUT ÊTRE MODIFIÉE DIRECTEMENT.</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-6">
                            {message && (
                                <motion.p
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`text-xs font-black uppercase tracking-widest px-4 ${message.type === 'success' ? 'text-green-neon' : 'text-red-400'}`}
                                >
                                    {message.text}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={isSaving}
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
                                            Mise à jour en cours...
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
                                            Enregistrer les Changements.
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </form>
                </motion.div>

                <div className="mt-16 text-center space-y-4">
                    <div className="w-px h-16 bg-gradient-to-b from-green-neon/50 to-transparent mx-auto" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-zinc-700">VOS DONNÉES SONT PROTÉGÉES PAR NOS STANDARDS DE SÉCURITÉ LES PLUS STRICTS.</p>
                </div>

            </div>
        </div>
    );
}
