import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Truck,
    Store,
    Instagram,
    Eye,
    X,
    Plus,
    Mic,
    Search,
    Leaf,
    RefreshCw,
    Save,
    Star,
    TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettingsStore } from '../../store/settingsStore';

const INPUT =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors';
const LABEL = 'block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wider';

export default function AdminSettingsTab() {
    const { settings, updateSettingsInStore } = useSettingsStore();
    const [localSettings, setLocalSettings] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const payload = Object.entries(localSettings).map(([key, value]) => ({
                key,
                value,
                updated_at: new Date().toISOString(),
            }));

            const { error } = await supabase.from('store_settings').upsert(payload, { onConflict: 'key' });

            if (error) throw error;

            updateSettingsInStore(localSettings);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Erreur lors de la sauvegarde des paramètres.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-12xl space-y-6 pb-20">
            {/* Delivery */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-5 h-5 text-green-neon" />
                    <h2 className="font-serif font-semibold text-lg">Livraison</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL}>Frais de livraison (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={localSettings.delivery_fee}
                            onChange={(e) =>
                                setLocalSettings({ ...localSettings, delivery_fee: parseFloat(e.target.value) || 0 })
                            }
                            className={INPUT}
                        />
                    </div>
                    <div>
                        <label className={LABEL}>Seuil livraison gratuite (€)</label>
                        <input
                            type="number"
                            step="1"
                            min="0"
                            value={localSettings.delivery_free_threshold}
                            onChange={(e) =>
                                setLocalSettings({
                                    ...localSettings,
                                    delivery_free_threshold: parseInt(e.target.value) || 0,
                                })
                            }
                            className={INPUT}
                        />
                    </div>
                </div>
                <p className="text-xs text-zinc-500">
                    Livraison offerte automatiquement dès {localSettings.delivery_free_threshold} € de commande.
                </p>
            </div>

            {/* Store info */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                    <Store className="w-5 h-5 text-green-neon" />
                    <h2 className="font-serif font-semibold text-lg">Informations boutique</h2>
                </div>
                <div>
                    <label className={LABEL}>Nom de la boutique</label>
                    <input
                        value={localSettings.store_name}
                        onChange={(e) => setLocalSettings({ ...localSettings, store_name: e.target.value })}
                        className={INPUT}
                    />
                </div>
                <div>
                    <label className={LABEL}>Adresse</label>
                    <input
                        value={localSettings.store_address}
                        onChange={(e) => setLocalSettings({ ...localSettings, store_address: e.target.value })}
                        className={INPUT}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL}>Téléphone</label>
                        <input
                            value={localSettings.store_phone}
                            onChange={(e) => setLocalSettings({ ...localSettings, store_phone: e.target.value })}
                            className={INPUT}
                        />
                    </div>
                    <div>
                        <label className={LABEL}>Horaires</label>
                        <input
                            value={localSettings.store_hours}
                            onChange={(e) => setLocalSettings({ ...localSettings, store_hours: e.target.value })}
                            className={INPUT}
                            placeholder="Lun–Sam 10h00–19h30"
                        />
                    </div>
                </div>
            </div>

            {/* Social Networks */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                    <Instagram className="w-5 h-5 text-green-neon" />
                    <h2 className="font-serif font-semibold text-lg">Réseaux Sociaux</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL}>Instagram (URL)</label>
                        <input
                            type="url"
                            value={localSettings.social_instagram}
                            onChange={(e) => setLocalSettings({ ...localSettings, social_instagram: e.target.value })}
                            className={INPUT}
                            placeholder="https://instagram.com/…"
                        />
                    </div>
                    <div>
                        <label className={LABEL}>Facebook (URL)</label>
                        <input
                            type="url"
                            value={localSettings.social_facebook}
                            onChange={(e) => setLocalSettings({ ...localSettings, social_facebook: e.target.value })}
                            className={INPUT}
                            placeholder="https://facebook.com/…"
                        />
                    </div>
                </div>
            </div>

            {/* Banner */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-green-neon" />
                        <h2 className="font-serif font-semibold text-lg">Bannière promotionnelle</h2>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localSettings.banner_enabled}
                            onChange={(e) => setLocalSettings({ ...localSettings, banner_enabled: e.target.checked })}
                            className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm text-zinc-300">Activée</span>
                    </label>
                </div>
                <div>
                    <label className={LABEL}>Texte de la bannière</label>
                    <input
                        value={localSettings.banner_text}
                        onChange={(e) => setLocalSettings({ ...localSettings, banner_text: e.target.value })}
                        className={INPUT}
                        placeholder="🌿 Offre de bienvenue…"
                    />
                </div>
                {localSettings.banner_enabled && (
                    <div className="bg-green-neon text-white px-4 py-3 rounded-xl text-sm text-center font-bold">
                        Aperçu : {localSettings.banner_text || '…'}
                    </div>
                )}

                <div className="pt-4 border-t border-zinc-800">
                    <label className={LABEL}>Messages additionnels du Ticker</label>
                    <div className="space-y-2 mb-3">
                        {(localSettings.ticker_messages || []).map((msg, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    value={msg}
                                    onChange={(e) => {
                                        const newMsgs = [...localSettings.ticker_messages];
                                        newMsgs[idx] = e.target.value;
                                        setLocalSettings({ ...localSettings, ticker_messages: newMsgs });
                                    }}
                                    className={INPUT}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newMsgs = localSettings.ticker_messages.filter((_, i) => i !== idx);
                                        setLocalSettings({ ...localSettings, ticker_messages: newMsgs });
                                    }}
                                    className="p-2.5 text-zinc-500 hover:text-red-400 bg-zinc-800 rounded-xl transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setLocalSettings({
                                ...localSettings,
                                ticker_messages: [...(localSettings.ticker_messages || []), "✦ Message ✦"]
                            });
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-green-neon hover:text-green-400 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Ajouter un message au ticker
                    </button>
                </div>
            </div>

            {/* Features toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Search className="w-5 h-5 text-green-neon" />
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.search_enabled}
                                    onChange={(e) => setLocalSettings({ ...localSettings, search_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                            </label>
                        </div>
                        <h3 className="font-serif font-bold text-white">Recherche IA</h3>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Fonctionnalité</p>
                    </div>
                    <p className="text-xs text-zinc-400 mt-4">Active la barre de recherche intelligente dans le header.</p>
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Leaf className="w-5 h-5 text-green-neon" />
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.budtender_chat_enabled}
                                    onChange={(e) => setLocalSettings({ ...localSettings, budtender_chat_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                            </label>
                        </div>
                        <h3 className="font-serif font-bold text-white">BudTender Chat</h3>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Conseiller</p>
                    </div>
                    <p className="text-xs text-zinc-400 mt-4">Affiche la bulle de chat flottante pour conseiller les clients par texte.</p>
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Mic className="w-5 h-5 text-green-neon" />
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.budtender_voice_enabled}
                                    onChange={(e) => setLocalSettings({ ...localSettings, budtender_voice_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                            </label>
                        </div>
                        <h3 className="font-serif font-bold text-white">BudTender Vocal</h3>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Conseiller</p>
                    </div>
                    <p className="text-xs text-zinc-400 mt-4">Active l'assistance vocale Gemini Live dans l'interface BudTender.</p>
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <RefreshCw className="w-5 h-5 text-green-neon" />
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.subscriptions_enabled}
                                    onChange={(e) => setLocalSettings({ ...localSettings, subscriptions_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                            </label>
                        </div>
                        <h3 className="font-serif font-bold text-white">Abonnements</h3>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Système</p>
                    </div>
                    <p className="text-xs text-zinc-400 mt-4">Permet aux clients de s'abonner aux produits pour recevoir des livraisons récurrentes.</p>
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Star className="w-5 h-5 text-green-neon" />
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.home_reviews_enabled}
                                    onChange={(e) => setLocalSettings({ ...localSettings, home_reviews_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                            </label>
                        </div>
                        <h3 className="font-serif font-bold text-white">Carrousel Avis</h3>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Page d'accueil</p>
                    </div>
                    <p className="text-xs text-zinc-400 mt-4">Affiche la section des avis clients avec produits sur la home page.</p>
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-5 h-5 text-green-neon" />
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.home_best_sellers_enabled}
                                    onChange={(e) => setLocalSettings({ ...localSettings, home_best_sellers_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                            </label>
                        </div>
                        <h3 className="font-serif font-bold text-white">Top Ventes</h3>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Page d'accueil</p>
                    </div>
                    <p className="text-xs text-zinc-400 mt-4">Affiche la section "Meilleures Ventes" sur la home page.</p>
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Plus className="w-5 h-5 text-green-neon" />
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.empty_cart_suggestions_enabled}
                                    onChange={(e) => setLocalSettings({ ...localSettings, empty_cart_suggestions_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                            </label>
                        </div>
                        <h3 className="font-serif font-bold text-white">Suggestions Panier</h3>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Panier Vide</p>
                    </div>
                    <p className="text-xs text-zinc-400 mt-4">Affiche des recommandations personnalisées quand le panier est vide.</p>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
                <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-lg shadow-green-neon/20 active:scale-95"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Enregistrement…' : 'Sauvegarder les paramètres'}
                </button>
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-green-400 font-bold bg-green-400/10 px-4 py-2 rounded-xl border border-green-400/20"
                    >
                        <span>Paramètres enregistrés !</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
