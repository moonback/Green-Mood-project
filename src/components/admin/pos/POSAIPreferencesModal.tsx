import { motion } from 'motion/react';
import { X, Brain, Target, Zap, Waves, Wallet, Clock, User as UserIcon, Phone, MapPin, Package, ExternalLink } from 'lucide-react';
import { UserAIPreferences, Profile, Address } from '../../../lib/types';

interface POSAIPreferencesModalProps {
    preferences: UserAIPreferences;
    customer: Profile;
    defaultAddress?: Address | null;
    orderCount?: number;
    onViewOrders?: () => void;
    onClose: () => void;
    isLightTheme?: boolean;
}

const PREF_LABELS: Record<string, string> = {
    // Goals
    'sleep': 'Sommeil & Relaxation',
    'stress': 'Stress & Anxiété',
    'pain': 'Douleurs & Récupération',
    'wellness': 'Bien-être général',
    // Experience
    'beginner': 'Débutant',
    'intermediate': 'Intermédiaire',
    'expert': 'Expert',
    // Intensity
    'low': 'Légère',
    'mid': 'Modérée',
    'high': 'Puissante',
    // Budget
    'budget_low': 'Moins de 20 €', // Support both prefixed and raw
    'budget_mid': '20 € – 50 €',
    'budget_high': 'Plus de 50 €',
    // Format
    'oil': 'Huile sublinguale',
    'flower': 'Fleur ou résine',
    'infusion': 'Infusion',
    'bundle': 'Pack découverte',
    // Age
    'adult': '18 – 65 ans',
    'senior': 'Plus de 65 ans',
    // Terpenes
    'limonene': 'Citronné (Limonène)',
    'myrcene': 'Terreux (Myrcène)',
    'linalool': 'Floral (Linalol)',
    'pinene': 'Boisé/Pin (Pinène)',
    'caryophyllene': 'Poivré (Caryophyllène)',
};

// Fallback for budget if simple key is used
PREF_LABELS['low'] = 'Légère / Petit Budget'; // Ambiguous without context factor
PREF_LABELS['mid'] = 'Modérée / Moyen Budget';
PREF_LABELS['high'] = 'Puissante / Budget Premium';

const t = (value: string | null | undefined, context?: string) => {
    if (!value) return 'Non défini';

    // Handle budget specifically if needed
    if (context === 'budget' && PREF_LABELS[`budget_${value}`]) {
        return PREF_LABELS[`budget_${value}`];
    }

    return PREF_LABELS[value] || value;
};

export default function POSAIPreferencesModal({
    preferences,
    customer,
    defaultAddress,
    orderCount = 0,
    onViewOrders,
    onClose,
    isLightTheme,
}: POSAIPreferencesModalProps) {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`w-full max-w-xl border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border-zinc-800'
                    }`}
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isLightTheme ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 'bg-green-500/10 text-green-500 shadow-green-500/10'
                                }`}>
                                <Brain className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className={`text-xl font-black uppercase tracking-tight ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                    {customer.full_name || 'Client Anonyme'}
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>
                                        Profil AI & Habitudes
                                    </p>
                                    {customer.phone && (
                                        <>
                                            <span className={`text-[8px] ${isLightTheme ? 'text-emerald-200' : 'text-zinc-700'}`}>•</span>
                                            <div className="flex items-center gap-1 group">
                                                <Phone className={`w-2.5 h-2.5 ${isLightTheme ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                                <span className={`text-[10px] font-mono ${isLightTheme ? 'text-emerald-700/80' : 'text-zinc-400'}`}>{customer.phone}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {defaultAddress && (
                                    <div className="flex items-center gap-1.5 mt-1.5 opacity-80 group">
                                        <MapPin className={`w-2.5 h-2.5 ${isLightTheme ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                        <p className={`text-[10px] font-medium tracking-tight ${isLightTheme ? 'text-emerald-800' : 'text-zinc-400'}`}>
                                            {defaultAddress.street}, {defaultAddress.postal_code} {defaultAddress.city}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-3 rounded-2xl transition-all ${isLightTheme ? 'bg-emerald-50 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                                }`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Goal */}
                        <PreferenceCard
                            icon={Target}
                            label="Objectif"
                            value={t(preferences.goal)}
                            isLightTheme={isLightTheme}
                        />
                        {/* Experience */}
                        <PreferenceCard
                            icon={Zap}
                            label="Expérience"
                            value={t(preferences.experience_level)}
                            isLightTheme={isLightTheme}
                        />
                        {/* Intensity */}
                        <PreferenceCard
                            icon={Waves}
                            label="Intensité"
                            value={t(preferences.intensity_preference)}
                            isLightTheme={isLightTheme}
                        />
                        {/* Budget */}
                        <PreferenceCard
                            icon={Wallet}
                            label="Budget"
                            value={t(preferences.budget_range, 'budget')}
                            isLightTheme={isLightTheme}
                        />
                        {/* Format */}
                        <PreferenceCard
                            icon={Clock}
                            label="Format"
                            value={t(preferences.preferred_format)}
                            isLightTheme={isLightTheme}
                        />
                        {/* Age range */}
                        <PreferenceCard
                            icon={UserIcon}
                            label="Tranche d'âge"
                            value={t(preferences.age_range)}
                            isLightTheme={isLightTheme}
                        />
                    </div>

                    {/* Terpenes & Order History */}
                    <div className="mt-6 flex flex-col gap-4">
                        {/* Terpenes */}
                        {(preferences.terpene_preferences?.length || 0) > 0 && (
                            <div className={`p-5 rounded-3xl border ${isLightTheme ? 'bg-emerald-50/30 border-emerald-100' : 'bg-zinc-950 border-zinc-800'
                                }`}>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>
                                    Terpènes Préférés
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {preferences.terpene_preferences?.map((terpene) => (
                                        <span
                                            key={terpene}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${isLightTheme ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-800 text-green-400'
                                                }`}
                                        >
                                            {t(terpene)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Order History Summary */}
                        <div className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${isLightTheme ? 'bg-emerald-50/50 border-emerald-100' : 'bg-zinc-950 border-zinc-800'
                            }`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isLightTheme ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>
                                        Commandes passées
                                    </p>
                                    <p className={`text-lg font-black ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                        {orderCount} {orderCount > 1 ? 'commandes' : 'commande'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onViewOrders}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${isLightTheme
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                                    : 'bg-green-500 text-black hover:bg-green-400 shadow-green-500/10'
                                    }`}
                            >
                                Historique
                                <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Updated At */}
                    <p className={`mt-8 text-center text-[9px] font-black uppercase tracking-[0.2em] ${isLightTheme ? 'text-emerald-200' : 'text-zinc-600'}`}>
                        Mise à jour le : {preferences.updated_at ? new Date(preferences.updated_at).toLocaleDateString('fr-FR') : 'Inconnue'}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

function PreferenceCard({ icon: Icon, label, value, isLightTheme }: { icon: any, label: string, value: string, isLightTheme?: boolean }) {
    return (
        <div className={`p-4 rounded-3xl border transition-all ${isLightTheme ? 'bg-white border-emerald-100 shadow-sm' : 'bg-zinc-800/30 border-zinc-800'
            }`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-3.5 h-3.5 ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>
                    {label}
                </span>
            </div>
            <p className={`text-xs font-bold truncate ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                {value}
            </p>
        </div>
    );
}
