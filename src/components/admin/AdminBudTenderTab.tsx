import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Leaf, Save, CheckCircle, ToggleLeft, ToggleRight, Sliders,
    Clock, Brain, MessageSquare, Zap, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BudTenderSettings {
    enabled: boolean;
    gemini_enabled: boolean;
    gemini_temperature: number;
    gemini_max_tokens: number;
    recommendations_count: number;
    typing_speed: 'slow' | 'normal' | 'fast';
    memory_enabled: boolean;
    restock_threshold_oils: number;
    restock_threshold_flowers: number;
    restock_threshold_other: number;
    welcome_message: string;
    pulse_delay: number;
}

const DEFAULTS: BudTenderSettings = {
    enabled: true,
    gemini_enabled: true,
    gemini_temperature: 0.7,
    gemini_max_tokens: 300,
    recommendations_count: 3,
    typing_speed: 'normal',
    memory_enabled: true,
    restock_threshold_oils: 30,
    restock_threshold_flowers: 14,
    restock_threshold_other: 21,
    welcome_message:
        "Bonjour ! Je suis BudTender, votre conseiller CBD personnel. J'aimerais vous aider à trouver les produits idéaux. On commence ?",
    pulse_delay: 8,
};

const LS_KEY = 'budtender_admin_settings_v1';

const INPUT =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-neon/50 transition-colors';

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toggle({
    enabled,
    onChange,
}: {
    enabled: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${enabled
                ? 'bg-green-neon/10 text-green-neon border border-green-neon/30'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}
        >
            {enabled ? (
                <ToggleRight className="w-4 h-4" />
            ) : (
                <ToggleLeft className="w-4 h-4" />
            )}
            {enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
        </button>
    );
}

function Section({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-green-neon" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function SliderField({
    label,
    value,
    min,
    max,
    step,
    unit,
    onChange,
    hint,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (v: number) => void;
    hint?: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                    {label}
                </label>
                <span className="text-sm font-black text-green-neon">
                    {value}
                    <span className="text-xs text-zinc-500 font-normal ml-1">{unit}</span>
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-green-500"
            />
            {hint && <p className="text-[10px] text-zinc-600 italic">{hint}</p>}
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AdminBudTenderTab() {
    const [settings, setSettings] = useState<BudTenderSettings>(DEFAULTS);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'memory' | 'quiz'>('general');

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
        } catch {
            // ignore
        }
    }, []);

    const update = (patch: Partial<BudTenderSettings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(settings));

            // Also sync the `budtender_enabled` flag to store_settings in Supabase
            await supabase.from('store_settings').upsert(
                [{ key: 'budtender_enabled', value: settings.enabled, updated_at: new Date().toISOString() }],
                { onConflict: 'key' }
            );

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('[AdminBudTenderTab] save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const subTabs = [
        { key: 'general', label: 'Général', icon: Leaf },
        { key: 'ai', label: 'IA & Gemini', icon: Brain },
        { key: 'memory', label: 'Mémoire', icon: Clock },
        { key: 'quiz', label: 'Quiz & UX', icon: MessageSquare },
    ] as const;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="font-serif text-2xl font-bold flex items-center gap-3">
                        <Leaf className="w-6 h-6 text-green-neon" />
                        BudTender IA
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Configurez le comportement de votre conseiller CBD intelligent.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Toggle enabled={settings.enabled} onChange={(v) => update({ enabled: v })} />
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-green-neon hover:bg-green-400 text-black font-black text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                        {saved ? (
                            <>
                                <CheckCircle className="w-4 h-4" /> Sauvegardé !
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Sauvegarder
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Sub-tabs ── */}
            <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl w-fit">
                {subTabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === key
                            ? 'bg-zinc-700 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                >

                    {/* ── GÉNÉRAL ── */}
                    {activeTab === 'general' && (
                        <>
                            <Section icon={Leaf} title="Activation Globale" description="Contrôlez la visibilité de BudTender sur le site">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-white">Afficher le bouton BudTender</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Si désactivé, le widget est complètement masqué pour les clients.</p>
                                    </div>
                                    <Toggle enabled={settings.enabled} onChange={(v) => update({ enabled: v })} />
                                </div>

                                <div className="space-y-2">
                                    <SliderField
                                        label="Délai avant pulsation du bouton"
                                        value={settings.pulse_delay}
                                        min={0}
                                        max={60}
                                        step={1}
                                        unit="secondes"
                                        onChange={(v) => update({ pulse_delay: v })}
                                        hint="Délai avant que le bouton flottant commence à pulser pour attirer l'attention. 0 = jamais."
                                    />
                                </div>
                            </Section>

                            <Section icon={MessageSquare} title="Message d'accueil" description="Texte affiché lors de la première ouverture (utilisateur non connecté)">
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">
                                        Message de bienvenue par défaut
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={settings.welcome_message}
                                        onChange={(e) => update({ welcome_message: e.target.value })}
                                        className={INPUT + ' resize-none'}
                                        placeholder="Bonjour ! Je suis BudTender..."
                                    />
                                    <p className="text-[10px] text-zinc-600 italic flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        Pour les utilisateurs connectés, le message est personnalisé automatiquement.
                                    </p>
                                </div>
                            </Section>
                        </>
                    )}

                    {/* ── IA & GEMINI ── */}
                    {activeTab === 'ai' && (
                        <>
                            <Section icon={Brain} title="Moteur IA (Gemini)" description="Paramètres du modèle de génération de conseils">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-white">Activer Gemini IA</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            Si désactivé, les conseils utilisent le moteur de règles local (sans API).
                                        </p>
                                    </div>
                                    <Toggle enabled={settings.gemini_enabled} onChange={(v) => update({ gemini_enabled: v })} />
                                </div>

                                <div className={!settings.gemini_enabled ? 'opacity-40 pointer-events-none' : ''}>
                                    <SliderField
                                        label="Créativité (Temperature)"
                                        value={settings.gemini_temperature}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        unit=""
                                        onChange={(v) => update({ gemini_temperature: v })}
                                        hint="0 = réponses très factuelles et stables. 1 = réponses créatives et variées."
                                    />
                                </div>

                                <div className={!settings.gemini_enabled ? 'opacity-40 pointer-events-none' : ''}>
                                    <SliderField
                                        label="Longueur maximale de la réponse"
                                        value={settings.gemini_max_tokens}
                                        min={100}
                                        max={800}
                                        step={50}
                                        unit="tokens"
                                        onChange={(v) => update({ gemini_max_tokens: v })}
                                        hint="~300 tokens ≈ 2-3 phrases. Augmenter pour des conseils plus détaillés."
                                    />
                                </div>

                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-zinc-400 space-y-1">
                                        <p>La clé API Gemini est configurée via la variable d'environnement <code className="text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">VITE_GEMINI_API_KEY</code> dans le fichier <code className="text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">.env</code>.</p>
                                        <p>Elle ne peut pas être modifiée ici pour des raisons de sécurité.</p>
                                    </div>
                                </div>
                            </Section>

                            <Section icon={Sliders} title="Recommandations" description="Nombre et logique de sélection des produits suggérés">
                                <SliderField
                                    label="Nombre de produits recommandés"
                                    value={settings.recommendations_count}
                                    min={1}
                                    max={5}
                                    step={1}
                                    unit="produits"
                                    onChange={(v) => update({ recommendations_count: v })}
                                    hint="Les N meilleurs scores du catalogue selon les réponses du quiz."
                                />
                            </Section>
                        </>
                    )}

                    {/* ── MÉMOIRE ── */}
                    {activeTab === 'memory' && (
                        <>
                            <Section icon={Clock} title="Système de Mémoire Client" description="Personnalisation basée sur l'historique de commandes">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-white">Activer la mémoire client</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            Salutation personnalisée, rappels de restock et sauvegarde des préférences quiz.
                                        </p>
                                    </div>
                                    <Toggle enabled={settings.memory_enabled} onChange={(v) => update({ memory_enabled: v })} />
                                </div>
                            </Section>

                            <Section icon={Zap} title="Seuils de Réapprovisionnement" description="Nombre de jours avant de suggérer un rachat par catégorie">
                                <div className={!settings.memory_enabled ? 'opacity-40 pointer-events-none space-y-4' : 'space-y-4'}>
                                    <SliderField
                                        label="Huiles (CBD)"
                                        value={settings.restock_threshold_oils}
                                        min={7}
                                        max={90}
                                        step={1}
                                        unit="jours"
                                        onChange={(v) => update({ restock_threshold_oils: v })}
                                        hint="Durée estimée d'une huile 10ml. Recommandé : 25-35 jours."
                                    />
                                    <SliderField
                                        label="Fleurs & Résines"
                                        value={settings.restock_threshold_flowers}
                                        min={3}
                                        max={60}
                                        step={1}
                                        unit="jours"
                                        onChange={(v) => update({ restock_threshold_flowers: v })}
                                        hint="Durée estimée pour 1g-3g. Recommandé : 10-21 jours."
                                    />
                                    <SliderField
                                        label="Autres produits (Infusions, etc.)"
                                        value={settings.restock_threshold_other}
                                        min={7}
                                        max={90}
                                        step={1}
                                        unit="jours"
                                        onChange={(v) => update({ restock_threshold_other: v })}
                                        hint="Valeur par défaut pour les catégories sans seuil spécifique."
                                    />
                                </div>
                            </Section>
                        </>
                    )}

                    {/* ── QUIZ & UX ── */}
                    {activeTab === 'quiz' && (
                        <>
                            <Section icon={MessageSquare} title="Vitesse de réponse du bot" description="Délai entre l'envoi d'une réponse et l'apparition de la bulle suivante">
                                <div className="grid grid-cols-3 gap-3">
                                    {(['slow', 'normal', 'fast'] as const).map((speed) => (
                                        <button
                                            key={speed}
                                            onClick={() => update({ typing_speed: speed })}
                                            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center ${settings.typing_speed === speed
                                                ? 'bg-green-neon/10 border-green-neon/40 text-green-neon'
                                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                }`}
                                        >
                                            {speed === 'slow' && '🐢 Lent'}
                                            {speed === 'normal' && '⚖️ Normal'}
                                            {speed === 'fast' && '⚡ Rapide'}
                                            <br />
                                            <span className="font-normal text-[10px] mt-0.5 block opacity-60">
                                                {speed === 'slow' && '1.5 – 2.5s'}
                                                {speed === 'normal' && '0.8 – 1.5s'}
                                                {speed === 'fast' && '0.2 – 0.5s'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </Section>

                            <Section icon={Sliders} title="Aperçu des étapes du Quiz" description="Les 4 étapes du diagnostic affichées au client">
                                {[
                                    { step: 1, label: 'Besoin principal', desc: 'Sommeil, Stress, Douleurs, Bien-être' },
                                    { step: 2, label: 'Expérience CBD', desc: 'Débutant, Intermédiaire, Expert' },
                                    { step: 3, label: 'Format préféré', desc: 'Huile, Fleur, Infusion, Pack' },
                                    { step: 4, label: 'Budget', desc: '< 20€, 20–50€, > 50€' },
                                ].map(({ step, label, desc }) => (
                                    <div key={step} className="flex items-center gap-4 py-2 border-b border-zinc-800 last:border-0">
                                        <span className="w-7 h-7 rounded-full bg-green-neon/10 text-green-neon text-xs font-black flex items-center justify-center flex-shrink-0">
                                            {step}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">{label}</p>
                                            <p className="text-xs text-zinc-500">{desc}</p>
                                        </div>
                                        <span className="text-[10px] text-zinc-600 font-mono">READ-ONLY</span>
                                    </div>
                                ))}
                                <p className="text-[10px] text-zinc-600 italic flex items-center gap-1.5">
                                    <Info className="w-3 h-3" />
                                    Pour modifier les questions du quiz, éditez directement le fichier <code className="bg-zinc-800 px-1 rounded">BudTender.tsx</code>.
                                </p>
                            </Section>
                        </>
                    )}

                </motion.div>
            </AnimatePresence>

            {/* ── Save success toast ── */}
            <AnimatePresence>
                {saved && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-neon text-black font-black text-sm px-5 py-3 rounded-2xl shadow-xl"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Paramètres BudTender sauvegardés
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
