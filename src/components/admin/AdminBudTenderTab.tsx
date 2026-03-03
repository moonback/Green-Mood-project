import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Leaf, Save, CheckCircle, ToggleLeft, ToggleRight, Sliders,
    Clock, Brain, MessageSquare, Zap, Info, Plus, Trash2, X,
    TrendingUp, ThumbsUp, ThumbsDown, Target
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    PieChart, Pie
} from 'recharts';
import { supabase } from '../../lib/supabase';

import { BudTenderSettings, BUDTENDER_DEFAULTS, BUDTENDER_LS_KEY } from '../../lib/budtenderSettings';

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
    const [settings, setSettings] = useState<BudTenderSettings>(BUDTENDER_DEFAULTS);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'memory' | 'quiz' | 'stats'>('general');
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [stats, setStats] = useState({
        interactionTypes: [] as { name: string; value: number }[],
        topQuestions: [] as { question: string; count: number }[],
        satisfaction: { positive: 0, negative: 0, score: 0 },
        conversion: { rate: 0, buyersCount: 0, quizCount: 0 }
    });

    // Load settings from Supabase (and fallback to localStorage) on mount
    useEffect(() => {
        const load = async () => {
            try {
                // 1. Try Supabase
                const { data } = await supabase
                    .from('store_settings')
                    .select('value')
                    .eq('key', 'budtender_config')
                    .maybeSingle();

                if (data?.value) {
                    setSettings({ ...BUDTENDER_DEFAULTS, ...data.value });
                } else {
                    // 2. Fallback to localStorage
                    const raw = localStorage.getItem(BUDTENDER_LS_KEY);
                    if (raw) setSettings({ ...BUDTENDER_DEFAULTS, ...JSON.parse(raw) });
                }
            } catch (err) {
                console.error('[AdminBudTenderTab] load error:', err);
            }
        };
        load();
    }, []);

    // Load stats when switching to stats tab
    useEffect(() => {
        if (activeTab === 'stats') {
            loadStats();
        }
    }, [activeTab]);

    const loadStats = async () => {
        setIsLoadingStats(true);
        try {
            const since = new Date();
            since.setDate(since.getDate() - 30); // Last 30 days
            const sinceISO = since.toISOString();

            const [
                { data: interactions },
                { data: paidOrders }
            ] = await Promise.all([
                supabase
                    .from('budtender_interactions')
                    .select('*')
                    .gte('created_at', sinceISO),
                supabase
                    .from('orders')
                    .select('user_id')
                    .eq('payment_status', 'paid')
                    .gte('created_at', sinceISO)
            ]);

            if (!interactions) return;

            // 1. Interaction types distribution
            const typeMap = new Map<string, number>();
            const questionsMap = new Map<string, number>();
            let pos = 0;
            let neg = 0;
            let quizCount = 0;

            interactions.forEach(i => {
                const type = i.interaction_type || 'unknown';
                typeMap.set(type, (typeMap.get(type) ?? 0) + 1);

                if (type === 'question' && i.quiz_answers?.question) {
                    const q = (i.quiz_answers.question as string).trim();
                    if (q.length > 5) {
                        questionsMap.set(q, (questionsMap.get(q) ?? 0) + 1);
                    }
                }

                if (type === 'feedback') {
                    if (i.feedback === 'positive') pos++;
                    if (i.feedback === 'negative') neg++;
                }

                if (type === 'chat_session' || type === 'recommendation') {
                    quizCount++;
                }
            });

            // 2. Conversion calculation
            const usersWithQuiz = new Set(interactions
                .filter(i => i.interaction_type === 'chat_session' || i.interaction_type === 'recommendation')
                .map(i => i.user_id)
            );
            const usersWithOrder = new Set(paidOrders?.map(o => o.user_id));
            const buyersCount = Array.from(usersWithQuiz).filter(uid => usersWithOrder.has(uid)).length;

            setStats({
                interactionTypes: Array.from(typeMap.entries()).map(([name, value]) => ({ name, value })),
                topQuestions: Array.from(questionsMap.entries())
                    .map(([question, count]) => ({ question, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5),
                satisfaction: {
                    positive: pos,
                    negative: neg,
                    score: pos + neg > 0 ? Math.round((pos / (pos + neg)) * 100) : 0
                },
                conversion: {
                    rate: quizCount > 0 ? Math.round((buyersCount / quizCount) * 100) : 0,
                    buyersCount,
                    quizCount
                }
            });
        } catch (err) {
            console.error('[AdminBudTenderTab] loadStats error:', err);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const update = (patch: Partial<BudTenderSettings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Keep localStorage as local cache
            localStorage.setItem(BUDTENDER_LS_KEY, JSON.stringify(settings));

            // Sync the entire configuration to Supabase
            // We use two keys: one for quick check (enabled) and one for full config
            await Promise.all([
                supabase.from('store_settings').upsert(
                    [{ key: 'budtender_enabled', value: settings.enabled, updated_at: new Date().toISOString() }],
                    { onConflict: 'key' }
                ),
                supabase.from('store_settings').upsert(
                    [{ key: 'budtender_config', value: settings, updated_at: new Date().toISOString() }],
                    { onConflict: 'key' }
                )
            ]);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('[AdminBudTenderTab] save error:', err);
            alert("Erreur lors de la sauvegarde en base de données.");
        } finally {
            setIsSaving(false);
        }
    };

    const subTabs = [
        { key: 'general', label: 'Général', icon: Leaf },
        { key: 'ai', label: 'IA & OpenRouter', icon: Brain },
        { key: 'memory', label: 'Mémoire', icon: Clock },
        { key: 'quiz', label: 'Quiz & UX', icon: MessageSquare },
        { key: 'stats', label: 'Analytique', icon: Zap },
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

                    {/* ── IA & OPENROUTER ── */}
                    {activeTab === 'ai' && (
                        <>
                            <Section icon={Brain} title="Moteur IA (OpenRouter)" description="Paramètres du modèle de génération de conseils">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-white">Activer OpenRouter IA</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            Si désactivé, les conseils utilisent le moteur de règles local (sans API).
                                        </p>
                                    </div>
                                    <Toggle enabled={settings.ai_enabled} onChange={(v) => update({ ai_enabled: v })} />
                                </div>

                                <div className={!settings.ai_enabled ? 'opacity-40 pointer-events-none space-y-4' : 'space-y-4'}>
                                    <div className="space-y-2">
                                        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">
                                            Modèle OpenRouter
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.ai_model}
                                            onChange={(e) => update({ ai_model: e.target.value })}
                                            className={INPUT}
                                            placeholder="Ex: google/gemini-2.0-flash-lite-preview-02-05:free"
                                        />
                                        <p className="text-[10px] text-zinc-600 italic">
                                            Identifiant du modèle (ex: google/gemini-2.5-flash:free, anthropic/claude-3.5-sonnet, etc.)
                                        </p>
                                    </div>

                                    <SliderField
                                        label="Créativité (Temperature)"
                                        value={settings.ai_temperature}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        unit=""
                                        onChange={(v) => update({ ai_temperature: v })}
                                        hint="0 = réponses très factuelles et stables. 1 = réponses créatives et variées."
                                    />

                                    <SliderField
                                        label="Longueur maximale de la réponse"
                                        value={settings.ai_max_tokens}
                                        min={100}
                                        max={2000}
                                        step={50}
                                        unit="tokens"
                                        onChange={(v) => update({ ai_max_tokens: v })}
                                        hint="~300 tokens ≈ 2-3 phrases. Augmenter pour des conseils plus détaillés."
                                    />
                                </div>

                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-zinc-400 space-y-1">
                                        <p>La clé API OpenRouter est configurée via la variable <code className="text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">VITE_OPENROUTER_API_KEY</code> dans le fichier <code className="text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">.env</code>.</p>
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

                            <Section icon={Sliders} title="Configuration du Quiz" description="Modifiez les questions et options du diagnostic">
                                <div className="space-y-6">
                                    {settings.quiz_steps.map((step, sIdx) => (
                                        <div key={step.id} className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5 space-y-4 relative group">
                                            {/* Action Delete Question */}
                                            <button
                                                onClick={() => {
                                                    const newSteps = settings.quiz_steps.filter((_, i) => i !== sIdx);
                                                    update({ quiz_steps: newSteps });
                                                }}
                                                className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div className="flex items-center gap-3 pr-8">
                                                <span className="w-6 h-6 rounded-full bg-green-neon/20 text-green-neon text-[10px] font-black flex items-center justify-center">
                                                    {sIdx + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={step.question}
                                                        onChange={(e) => {
                                                            const newSteps = [...settings.quiz_steps];
                                                            newSteps[sIdx].question = e.target.value;
                                                            update({ quiz_steps: newSteps });
                                                        }}
                                                        className="w-full bg-transparent border-none text-white font-bold text-sm p-0 focus:ring-0 placeholder-zinc-600 focus:placeholder-zinc-500"
                                                        placeholder="Saisissez votre question ici..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {step.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex gap-2 items-center bg-zinc-900/50 rounded-lg p-2 border border-zinc-800 group/opt">
                                                        <input
                                                            type="text"
                                                            value={opt.emoji}
                                                            onChange={(e) => {
                                                                const newSteps = [...settings.quiz_steps];
                                                                newSteps[sIdx].options[oIdx].emoji = e.target.value;
                                                                update({ quiz_steps: newSteps });
                                                            }}
                                                            className="w-9 bg-zinc-800 border-zinc-700 rounded text-center text-sm p-1 placeholder-zinc-600"
                                                            placeholder="💬"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt.label}
                                                            onChange={(e) => {
                                                                const newSteps = [...settings.quiz_steps];
                                                                newSteps[sIdx].options[oIdx].label = e.target.value;
                                                                update({ quiz_steps: newSteps });
                                                            }}
                                                            className="flex-1 bg-transparent border-none text-[11px] text-zinc-300 p-0 focus:ring-0 placeholder-zinc-600"
                                                            placeholder="Libellé de l'option..."
                                                        />
                                                        {/* Delete Option */}
                                                        {step.options.length > 2 && (
                                                            <button
                                                                onClick={() => {
                                                                    const newSteps = [...settings.quiz_steps];
                                                                    newSteps[sIdx].options = newSteps[sIdx].options.filter((_, i) => i !== oIdx);
                                                                    update({ quiz_steps: newSteps });
                                                                }}
                                                                className="p-1.5 text-zinc-700 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Add Option */}
                                                <button
                                                    onClick={() => {
                                                        const newSteps = [...settings.quiz_steps];
                                                        newSteps[sIdx].options.push({ label: '', value: `opt_${Date.now()}`, emoji: '❓' });
                                                        update({ quiz_steps: newSteps });
                                                    }}
                                                    className="flex items-center justify-center gap-2 border border-dashed border-zinc-800 rounded-lg p-2 text-zinc-600 hover:text-green-neon hover:border-green-neon/30 transition-all text-xs font-bold"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Ajouter une option
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Question Button */}
                                    <button
                                        onClick={() => {
                                            const newSteps = [...settings.quiz_steps];
                                            const newId = `q_${Date.now()}`;
                                            newSteps.push({
                                                id: newId,
                                                question: 'Nouvelle question ?',
                                                options: [
                                                    { label: 'Option 1', value: 'opt1', emoji: '✨' },
                                                    { label: 'Option 2', value: 'opt2', emoji: '🌟' }
                                                ]
                                            });
                                            update({ quiz_steps: newSteps });
                                        }}
                                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-zinc-800 hover:border-green-neon/30 hover:bg-green-neon/5 rounded-2xl p-6 text-zinc-500 hover:text-green-neon transition-all font-black uppercase tracking-widest text-xs"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Ajouter une question
                                    </button>
                                </div>
                                <p className="text-[10px] text-zinc-600 italic flex items-center gap-1.5 mt-4">
                                    <Info className="w-3 h-3" />
                                    Toutes les réponses (même les nouvelles questions) seront transmises à l'IA OpenRouter pour une analyse ultra-précise.
                                </p>
                            </Section>
                        </>
                    )}

                    {/* ── ANALYTIQUE ── */}
                    {activeTab === 'stats' && (
                        <div className="space-y-6">
                            {/* KPI Rows */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-green-neon/10 text-green-neon">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Taux de Conversion</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black text-white">{stats.conversion.rate}%</span>
                                        <span className="text-xs text-zinc-600 mb-1.5">ventes post-conseil</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Conseils</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black text-white">{stats.conversion.quizCount}</span>
                                        <span className="text-xs text-zinc-600 mb-1.5">sessions générées</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                            <ThumbsUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Satisfaction</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black text-white">{stats.satisfaction.score}%</span>
                                        <span className="text-xs text-zinc-600 mb-1.5">feedback positif</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Section icon={MessageSquare} title="Top Questions Clients" description="Les interrogations les plus fréquentes posées au BudTender">
                                    {isLoadingStats ? (
                                        <div className="h-48 flex items-center justify-center"><Clock className="w-6 h-6 animate-spin text-zinc-700" /></div>
                                    ) : stats.topQuestions.length > 0 ? (
                                        <div className="space-y-3">
                                            {stats.topQuestions.map((q, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/30">
                                                    <span className="text-sm text-zinc-200 line-clamp-1 italic">"{q.question}"</span>
                                                    <span className="text-xs font-black text-green-neon bg-green-neon/10 px-2 py-1 rounded-lg">{q.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-48 flex flex-col items-center justify-center text-zinc-600 italic text-sm">
                                            Aucune question enregistrée sur les 30 derniers jours.
                                        </div>
                                    )}
                                </Section>

                                <Section icon={Brain} title="Distribution des Interactions" description="Breakdown des usages (quiz vs questions directes)">
                                    {isLoadingStats ? (
                                        <div className="h-48 flex items-center justify-center"><Clock className="w-6 h-6 animate-spin text-zinc-700" /></div>
                                    ) : (
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.interactionTypes}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                                                        itemStyle={{ color: '#39ff14', fontSize: '12px', fontWeight: 'bold' }}
                                                    />
                                                    <Bar dataKey="value" fill="#39ff14" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </Section>
                            </div>

                            {/* Satisfaction Detail */}
                            <Section icon={ThumbsUp} title="Feedback de Recommandation" description="Comment les clients perçoivent les conseils générés">
                                <div className="flex items-center gap-10">
                                    <div className="h-40 w-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Positif', value: stats.satisfaction.positive },
                                                        { name: 'Négatif', value: stats.satisfaction.negative }
                                                    ]}
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#39ff14" />
                                                    <Cell fill="#ef4444" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-green-neon/5 border border-green-neon/10 rounded-2xl">
                                            <div className="flex items-center gap-2 text-green-neon mb-1">
                                                <ThumbsUp className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase">Positif</span>
                                            </div>
                                            <div className="text-2xl font-black text-white">{stats.satisfaction.positive}</div>
                                        </div>
                                        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                            <div className="flex items-center gap-2 text-red-500 mb-1">
                                                <ThumbsDown className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase">Négatif</span>
                                            </div>
                                            <div className="text-2xl font-black text-white">{stats.satisfaction.negative}</div>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex gap-3">
                                <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                                    Les données sont synchronisées en temps réel depuis la base Supabase. Les calculs de conversion sont basés sur les utilisateurs ayant complété un quiz ou reçu une recommandation IA et ayant effectué un achat validé dans les 30 jours suivants.
                                </p>
                            </div>
                        </div>
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
