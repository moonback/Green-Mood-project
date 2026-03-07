import { motion } from 'motion/react';
import { X, Brain, Target, Zap, Waves, Wallet, Clock, User as UserIcon } from 'lucide-react';
import { UserAIPreferences } from '../../../lib/types';

interface POSAIPreferencesModalProps {
    preferences: UserAIPreferences;
    onClose: () => void;
    isLightTheme?: boolean;
}

export default function POSAIPreferencesModal({
    preferences,
    onClose,
    isLightTheme,
}: POSAIPreferencesModalProps) {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`w-full max-w-lg border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border-zinc-800'
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
                                    Profil AI Client
                                </h2>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>
                                    Préférences & Habitudes
                                </p>
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
                            value={preferences.goal || 'Non défini'}
                            isLightTheme={isLightTheme}
                        />
                        {/* Experience */}
                        <PreferenceCard
                            icon={Zap}
                            label="Expérience"
                            value={preferences.experience_level || 'Non défini'}
                            isLightTheme={isLightTheme}
                        />
                        {/* Intensity */}
                        <PreferenceCard
                            icon={Waves}
                            label="Intensité"
                            value={preferences.intensity_preference || 'Non définie'}
                            isLightTheme={isLightTheme}
                        />
                        {/* Budget */}
                        <PreferenceCard
                            icon={Wallet}
                            label="Budget"
                            value={preferences.budget_range || 'Non défini'}
                            isLightTheme={isLightTheme}
                        />
                        {/* Format */}
                        <PreferenceCard
                            icon={Clock}
                            label="Format"
                            value={preferences.preferred_format || 'Non défini'}
                            isLightTheme={isLightTheme}
                        />
                        {/* Age range */}
                        <PreferenceCard
                            icon={UserIcon}
                            label="Tranche d'âge"
                            value={preferences.age_range || 'Non définie'}
                            isLightTheme={isLightTheme}
                        />
                    </div>

                    {/* Terpenes */}
                    {(preferences.terpene_preferences?.length || 0) > 0 && (
                        <div className={`mt-6 p-5 rounded-3xl border ${isLightTheme ? 'bg-emerald-50/30 border-emerald-100' : 'bg-zinc-950 border-zinc-800'
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
                                        {terpene}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
