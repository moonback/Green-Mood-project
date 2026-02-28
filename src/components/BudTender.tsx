import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Leaf, Send, RefreshCw, ShoppingCart, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';

// ─── Quiz steps ──────────────────────────────────────────────────────────────

interface QuizOption {
    label: string;
    value: string;
    emoji: string;
}

interface QuizStep {
    id: string;
    question: string;
    options: QuizOption[];
}

const QUIZ_STEPS: QuizStep[] = [
    {
        id: 'goal',
        question: 'Quel est votre principal besoin ?',
        options: [
            { label: 'Sommeil & Relaxation', value: 'sleep', emoji: '🌙' },
            { label: 'Stress & Anxiété', value: 'stress', emoji: '🧘' },
            { label: 'Douleurs & Récupération', value: 'pain', emoji: '💪' },
            { label: 'Bien-être général', value: 'wellness', emoji: '🌿' },
        ],
    },
    {
        id: 'experience',
        question: 'Quelle est votre expérience avec le CBD ?',
        options: [
            { label: "Débutant — c'est ma première fois", value: 'beginner', emoji: '👋' },
            { label: "Intermédiaire — j'ai déjà essayé", value: 'intermediate', emoji: '🙂' },
            { label: "Expert — je connais bien", value: 'expert', emoji: '🌟' },
        ],
    },
    {
        id: 'format',
        question: 'Quel format vous attire le plus ?',
        options: [
            { label: 'Huile sublinguale (rapide & précis)', value: 'oil', emoji: '💧' },
            { label: 'Fleur ou résine (tradition)', value: 'flower', emoji: '🌸' },
            { label: 'Infusion (doux & relaxant)', value: 'infusion', emoji: '☕' },
            { label: 'Pack découverte (tout essayer)', value: 'bundle', emoji: '📦' },
        ],
    },
    {
        id: 'budget',
        question: 'Quel est votre budget approximatif ?',
        options: [
            { label: 'Moins de 20 €', value: 'low', emoji: '💶' },
            { label: '20 € – 50 €', value: 'mid', emoji: '💶💶' },
            { label: 'Plus de 50 €', value: 'high', emoji: '💎' },
        ],
    },
];

// ─── Recommendation logic (local fallback) ───────────────────────────────────

type Answers = Record<string, string>;

function scoreProduct(product: Product, answers: Answers): number {
    let score = 0;
    const cat = product.category?.slug ?? '';
    const name = product.name.toLowerCase();
    const desc = (product.description ?? '').toLowerCase();

    // Goal matching
    if (answers.goal === 'sleep') {
        if (name.includes('sommeil') || desc.includes('sommeil') || desc.includes('nuit')) score += 5;
        if (cat === 'huiles' && (product.cbd_percentage ?? 0) >= 15) score += 3;
        if (cat === 'infusions') score += 2;
    }
    if (answers.goal === 'stress') {
        if (desc.includes('détente') || desc.includes('stress') || desc.includes('relaxat')) score += 5;
        if (cat === 'infusions') score += 3;
        if (cat === 'huiles') score += 2;
    }
    if (answers.goal === 'pain') {
        if ((product.cbd_percentage ?? 0) >= 20) score += 5;
        if (cat === 'huiles') score += 3;
        if (desc.includes('douleur') || desc.includes('récupér')) score += 4;
    }
    if (answers.goal === 'wellness') {
        if (product.is_featured) score += 3;
        score += 1; // all products valid
    }

    // Experience matching
    if (answers.experience === 'beginner') {
        if ((product.cbd_percentage ?? 0) <= 10) score += 3;
        if (cat === 'infusions') score += 2;
        if (product.is_bundle) score += 2;
    }
    if (answers.experience === 'expert') {
        if ((product.cbd_percentage ?? 0) >= 20) score += 3;
    }

    // Format matching
    if (answers.format === 'oil' && cat === 'huiles') score += 4;
    if (answers.format === 'flower' && (cat === 'fleurs' || cat === 'resines')) score += 4;
    if (answers.format === 'infusion' && cat === 'infusions') score += 4;
    if (answers.format === 'bundle' && product.is_bundle) score += 6;

    // Budget matching
    const price = product.price;
    if (answers.budget === 'low' && price < 20) score += 3;
    if (answers.budget === 'mid' && price >= 20 && price <= 50) score += 3;
    if (answers.budget === 'high' && price > 50) score += 3;

    // Stock/availability bonus
    if (product.stock_quantity > 10) score += 1;
    if (product.is_featured) score += 1;

    return score;
}

function generateAdvice(answers: Answers): string {
    const lines: string[] = [];

    if (answers.goal === 'sleep')
        lines.push('Pour favoriser un sommeil de qualité, je recommande les huiles à fort dosage le soir au coucher.');
    if (answers.goal === 'stress')
        lines.push("Contre le stress quotidien, les infusions ou une huile à dosage modéré sont d'excellentes alliées.");
    if (answers.goal === 'pain')
        lines.push('Pour les douleurs, une huile haute concentration (20%+) appliquée régulièrement donne les meilleurs résultats.');
    if (answers.goal === 'wellness')
        lines.push('Pour un bien-être global, démarrez doucement avec une huile classique ou une infusion.');

    if (answers.experience === 'beginner')
        lines.push("En tant que débutant, commencez à faible dose et augmentez progressivement selon vos ressentis.");
    if (answers.format === 'bundle')
        lines.push("Les packs découverte sont idéaux pour tester plusieurs formes de CBD à prix réduit.");

    return lines.join(' ');
}

// ─── Gemini API call ─────────────────────────────────────────────────────────

async function callGemini(
    answers: Answers,
    products: Product[]
): Promise<string | null> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;

    const catalog = products
        .slice(0, 12)
        .map((p) => `- ${p.name} (${p.category?.slug}, CBD ${p.cbd_percentage ?? '?'}%, ${p.price}€): ${p.description ?? ''}`)
        .join('\n');

    const prompt = `Tu es BudTender, conseiller CBD expert et bienveillant de la boutique Green Mood CBD.
Un client a répondu au quiz suivant :
- Besoin principal : ${answers.goal}
- Expérience CBD : ${answers.experience}
- Format préféré : ${answers.format}
- Budget : ${answers.budget}

Voici le catalogue disponible :
${catalog}

Génère en 3-4 phrases maximum :
1. Un conseil personnalisé (ton chaleureux, professionnel) 
2. Mentionne 1-2 produits spécifiques du catalogue par leur nom exact
Réponds en français, sans mention d'avertissement légal.`;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
                }),
            }
        );
        const json = await res.json();
        return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
        return null;
    }
}

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = 'closed' | 'welcome' | 'quiz' | 'loading' | 'result';

export default function BudTender() {
    const [phase, setPhase] = useState<Phase>('closed');
    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [products, setProducts] = useState<Product[]>([]);
    const [recommended, setRecommended] = useState<Product[]>([]);
    const [advice, setAdvice] = useState('');
    const [pulse, setPulse] = useState(false);
    const addItem = useCartStore((s) => s.addItem);
    const openSidebar = useCartStore((s) => s.openSidebar);
    const containerRef = useRef<HTMLDivElement>(null);

    // Subtle pulse after 8s to attract attention
    useEffect(() => {
        const t = setTimeout(() => setPulse(true), 8000);
        return () => clearTimeout(t);
    }, []);

    // Load products once
    useEffect(() => {
        supabase
            .from('products')
            .select('*, category:categories(slug, name)')
            .eq('is_active', true)
            .eq('is_available', true)
            .then(({ data }) => {
                if (data) setProducts(data as Product[]);
            });
    }, []);

    const open = () => {
        setPulse(false);
        setPhase('welcome');
    };

    const close = () => {
        setPhase('closed');
        reset();
    };

    const reset = () => {
        setStepIndex(0);
        setAnswers({});
        setRecommended([]);
        setAdvice('');
    };

    const restart = () => {
        reset();
        setPhase('welcome');
    };

    const handleAnswer = async (stepId: string, value: string) => {
        const newAnswers = { ...answers, [stepId]: value };
        setAnswers(newAnswers);

        if (stepIndex < QUIZ_STEPS.length - 1) {
            setStepIndex((i) => i + 1);
        } else {
            // All answered → compute result
            setPhase('loading');

            // Score products locally
            const scored = [...products]
                .map((p) => ({ product: p, score: scoreProduct(p, newAnswers) }))
                .sort((a, b) => b.score - a.score)
                .filter((x) => x.score > 0)
                .slice(0, 3)
                .map((x) => x.product);
            setRecommended(scored);

            // Try Gemini first, fallback to local advice
            const geminiText = await callGemini(newAnswers, products);
            setAdvice(geminiText ?? generateAdvice(newAnswers));

            setPhase('result');
        }
    };

    const handleAddToCart = (product: Product) => {
        addItem(product);
        openSidebar();
    };

    const currentStep = QUIZ_STEPS[stepIndex];
    const progressPct = ((stepIndex) / QUIZ_STEPS.length) * 100;

    return (
        <>
            {/* ── Floating button ── */}
            <AnimatePresence>
                {phase === 'closed' && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={open}
                        aria-label="Ouvrir le conseiller BudTender"
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 border border-green-neon/40 text-white rounded-2xl px-4 py-3 shadow-2xl hover:border-green-neon/80 transition-all group ${pulse ? 'animate-pulse-slow' : ''
                            }`}
                        style={{ boxShadow: '0 0 20px rgba(57,255,20,0.15), 0 8px 32px rgba(0,0,0,0.5)' }}
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-xl bg-green-neon/20 flex items-center justify-center group-hover:bg-green-neon/30 transition-colors">
                                <Leaf className="w-4 h-4 text-green-neon" />
                            </div>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-neon rounded-full border-2 border-zinc-900 animate-pulse" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-green-neon leading-none">BudTender</p>
                            <p className="text-[10px] text-zinc-400 leading-none mt-0.5">Conseiller IA</p>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Chat panel ── */}
            <AnimatePresence>
                {phase !== 'closed' && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={close}
                            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        />

                        {/* Panel */}
                        <motion.div
                            ref={containerRef}
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                            className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-24px))] max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                            style={{ boxShadow: '0 0 40px rgba(57,255,20,0.08), 0 24px 64px rgba(0,0,0,0.6)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-2xl bg-green-neon/20 border border-green-neon/30 flex items-center justify-center">
                                        <Leaf className="w-5 h-5 text-green-neon" />
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-neon rounded-full border-2 border-zinc-950" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">BudTender</p>
                                    <p className="text-xs text-green-neon/80 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-neon rounded-full inline-block" />
                                        Conseiller CBD disponible
                                    </p>
                                </div>
                                <button
                                    onClick={close}
                                    className="ml-auto p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Welcome */}
                                {phase === 'welcome' && (
                                    <motion.div
                                        key="welcome"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-5 space-y-5"
                                    >
                                        <div className="bg-zinc-800/60 rounded-2xl p-4 space-y-2">
                                            <p className="text-sm text-white font-medium">
                                                👋 Bonjour ! Je suis <span className="text-green-neon font-bold">BudTender</span>,
                                                votre conseiller CBD personnel.
                                            </p>
                                            <p className="text-sm text-zinc-400 leading-relaxed">
                                                En 4 questions, je vais vous recommander les produits parfaitement adaptés à vos besoins — parmi notre sélection premium.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                                            {['🧘 Personnalisé', '⚡ Rapide (1 min)', '🌿 Expert CBD', '🎁 Sans engagement'].map((f) => (
                                                <div key={f} className="flex items-center gap-1.5 bg-zinc-800/50 rounded-xl px-3 py-2">
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setPhase('quiz')}
                                            className="w-full flex items-center justify-center gap-2 bg-green-neon hover:bg-green-400 text-black font-bold py-3.5 rounded-2xl transition-all text-sm"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Démarrer le quiz
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Quiz */}
                                {phase === 'quiz' && currentStep && (
                                    <motion.div
                                        key={`step-${stepIndex}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-5 space-y-5"
                                    >
                                        {/* Progress bar */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs text-zinc-500">
                                                <span>Question {stepIndex + 1} / {QUIZ_STEPS.length}</span>
                                                <span>{Math.round(progressPct)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-green-neon rounded-full"
                                                    animate={{ width: `${progressPct}%` }}
                                                    transition={{ duration: 0.4 }}
                                                />
                                            </div>
                                        </div>

                                        {/* Question */}
                                        <div className="bg-zinc-800/60 rounded-2xl px-4 py-3">
                                            <p className="text-sm font-semibold text-white">{currentStep.question}</p>
                                        </div>

                                        {/* Options */}
                                        <div className="space-y-2">
                                            {currentStep.options.map((opt) => (
                                                <motion.button
                                                    key={opt.value}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => handleAnswer(currentStep.id, opt.value)}
                                                    className="w-full flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-green-neon/40 text-left px-4 py-3 rounded-2xl transition-all group"
                                                >
                                                    <span className="text-xl flex-shrink-0">{opt.emoji}</span>
                                                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                                                        {opt.label}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-green-neon ml-auto flex-shrink-0 transition-colors" />
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Loading */}
                                {phase === 'loading' && (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-5 flex flex-col items-center justify-center gap-4 min-h-[200px]"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-green-neon/20 flex items-center justify-center">
                                            <Leaf className="w-6 h-6 text-green-neon animate-pulse" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-semibold text-white">Analyse en cours…</p>
                                            <p className="text-xs text-zinc-500">Je sélectionne vos produits idéaux</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 bg-green-neon rounded-full"
                                                    animate={{ y: [0, -6, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Result */}
                                {phase === 'result' && (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-5 space-y-5"
                                    >
                                        {/* Advice bubble */}
                                        <div className="bg-gradient-to-br from-green-neon/10 to-zinc-800/40 border border-green-neon/20 rounded-2xl p-4 space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Leaf className="w-4 h-4 text-green-neon flex-shrink-0" />
                                                <span className="text-xs font-bold text-green-neon uppercase tracking-wider">Mon conseil</span>
                                            </div>
                                            <p className="text-sm text-zinc-300 leading-relaxed">{advice}</p>
                                        </div>

                                        {/* Recommended products */}
                                        {recommended.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                                    <Send className="w-3.5 h-3.5" />
                                                    Sélection personnalisée
                                                </p>
                                                {recommended.map((product, i) => (
                                                    <motion.div
                                                        key={product.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/60 hover:border-green-neon/30 rounded-2xl p-3 transition-all group"
                                                    >
                                                        {/* Product image */}
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-xl bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                                                <Leaf className="w-5 h-5 text-zinc-500" />
                                                            </div>
                                                        )}
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <Link
                                                                to={`/catalogue/${product.slug}`}
                                                                onClick={close}
                                                                className="text-sm font-semibold text-white hover:text-green-neon transition-colors line-clamp-1"
                                                            >
                                                                {product.name}
                                                            </Link>
                                                            {product.cbd_percentage && (
                                                                <p className="text-xs text-zinc-500 mt-0.5">CBD {product.cbd_percentage}%</p>
                                                            )}
                                                            <p className="text-sm font-bold text-green-neon mt-0.5">
                                                                {Number(product.price).toFixed(2)} €
                                                            </p>
                                                        </div>
                                                        {/* Add to cart */}
                                                        <button
                                                            onClick={() => handleAddToCart(product)}
                                                            disabled={product.stock_quantity === 0}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-neon hover:bg-green-400 disabled:opacity-40 text-black transition-all hover:scale-105 flex-shrink-0"
                                                        >
                                                            <ShoppingCart className="w-4 h-4" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}

                                        {recommended.length === 0 && (
                                            <div className="text-center py-4 text-zinc-500 text-sm">
                                                Aucun produit ne correspond exactement. Explorez notre{' '}
                                                <Link to="/catalogue" onClick={close} className="text-green-neon hover:underline">
                                                    catalogue complet
                                                </Link>.
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={restart}
                                                className="flex-1 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 py-2.5 rounded-2xl transition-all"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                Recommencer
                                            </button>
                                            <Link
                                                to="/catalogue"
                                                onClick={close}
                                                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-2xl transition-all"
                                            >
                                                Tout le catalogue
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-950/40">
                                <p className="text-[10px] text-zinc-600 text-center">
                                    Produits contenant moins de 0,3% THC · Réservé aux +18 ans
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
