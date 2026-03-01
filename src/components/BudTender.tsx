import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Leaf, RefreshCw, ShoppingCart, ChevronRight, Sparkles, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useBudTenderMemory, SavedPrefs } from '../hooks/useBudTenderMemory';

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

// ─── Terpene / Aroma step ─────────────────────────────────────────────────────

interface TerpeneChip {
    label: string;
    emoji: string;
    group: 'arome' | 'effet';
}

const TERPENE_CHIPS: TerpeneChip[] = [
    // Arômes
    { label: 'Citronné', emoji: '🍋', group: 'arome' },
    { label: 'Terreux', emoji: '🌍', group: 'arome' },
    { label: 'Fruité', emoji: '🍓', group: 'arome' },
    { label: 'Floral', emoji: '🌸', group: 'arome' },
    { label: 'Épicé', emoji: '🌶️', group: 'arome' },
    { label: 'Boisé', emoji: '🪵', group: 'arome' },
    { label: 'Herbacé', emoji: '🌿', group: 'arome' },
    { label: 'Sucré', emoji: '🍬', group: 'arome' },
    // Effets terpéniques
    { label: 'Focus', emoji: '🎯', group: 'effet' },
    { label: 'Créativité', emoji: '🎨', group: 'effet' },
    { label: 'Détente', emoji: '🛁', group: 'effet' },
    { label: 'Énergie', emoji: '⚡', group: 'effet' },
    { label: 'Récupération', emoji: '💆', group: 'effet' },
    { label: 'Anti-stress', emoji: '🧘', group: 'effet' },
];

// ─── Recommendation logic ───────────────────────────────────────────────────

type Answers = Record<string, string>;

function scoreProduct(product: Product, answers: Answers): number {
    let score = 0;
    const cat = product.category?.slug ?? '';
    const name = product.name.toLowerCase();
    const desc = (product.description ?? '').toLowerCase();

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
        score += 1;
    }

    if (answers.experience === 'beginner') {
        if ((product.cbd_percentage ?? 0) <= 10) score += 3;
        if (cat === 'infusions') score += 2;
        if (product.is_bundle) score += 2;
    }
    if (answers.experience === 'expert') {
        if ((product.cbd_percentage ?? 0) >= 20) score += 3;
    }

    if (answers.format === 'oil' && cat === 'huiles') score += 4;
    if (answers.format === 'flower' && (cat === 'fleurs' || cat === 'resines')) score += 4;
    if (answers.format === 'infusion' && cat === 'infusions') score += 4;
    if (answers.format === 'bundle' && product.is_bundle) score += 6;

    const price = product.price;
    if (answers.budget === 'low' && price < 20) score += 3;
    if (answers.budget === 'mid' && price >= 20 && price <= 50) score += 3;
    if (answers.budget === 'high' && price > 50) score += 3;

    if (product.stock_quantity > 10) score += 1;
    if (product.is_featured) score += 1;

    return score;
}

// Bonus score from terpene/aroma multi-selection
function scoreTerpenes(product: Product, selected: string[]): number {
    if (selected.length === 0) return 0;
    const productAromas: string[] = (product.attributes?.aromas ?? []).map((a: string) => a.toLowerCase());
    const productDesc = (product.description ?? '').toLowerCase();
    let bonus = 0;
    for (const chip of selected) {
        const chipLow = chip.toLowerCase();
        if (productAromas.some(a => a.includes(chipLow) || chipLow.includes(a))) bonus += 4;
        if (productDesc.includes(chipLow)) bonus += 2;
    }
    return bonus;
}

function generateAdvice(answers: Answers, terpenes: string[] = []): string {
    const lines: string[] = [];
    if (answers.goal === 'sleep') lines.push('Pour favoriser un sommeil de qualité, je recommande les huiles à fort dosage le soir au coucher.');
    if (answers.goal === 'stress') lines.push("Contre le stress quotidien, les infusions ou une huile à dosage modéré sont d'excellentes alliées.");
    if (answers.goal === 'pain') lines.push('Pour les douleurs, une huile haute concentration (20%+) appliquée régulièrement donne les meilleurs résultats.');
    if (answers.goal === 'wellness') lines.push('Pour un bien-être global, démarrez doucement avec une huile classique ou une infusion.');
    if (answers.experience === 'beginner') lines.push("En tant que débutant, commencez à faible dose et augmentez progressivement selon vos ressentis.");
    if (answers.format === 'bundle') lines.push("Les packs découverte sont idéaux pour tester plusieurs formes de CBD à prix réduit.");
    if (terpenes.length > 0) lines.push(`Votre profil terpénique (${terpenes.join(', ')}) guidera notre sélection vers des arômes et effets précis.`);
    return lines.join(' ');
}

async function callGemini(answers: Answers, products: Product[], context?: string): Promise<string | null> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;

    const catalog = products
        .slice(0, 12)
        .map((p) => `- ${p.name} (${p.category?.slug}, CBD ${p.cbd_percentage ?? '?'}%, ${p.price}€): ${p.description ?? ''}`)
        .join('\n');

    const contextBlock = context ? `\nContexte client : ${context}\n` : '';

    const prompt = `Tu es BudTender, conseiller CBD expert et bienveillant de la boutique Green Mood CBD.
Un client a répondu au quiz suivant :
- Besoin principal : ${answers.goal}
- Expérience CBD : ${answers.experience}
- Format préféré : ${answers.format}
- Budget : ${answers.budget}
${contextBlock}
Voici le catalogue disponible :
${catalog}

Génère en 3-4 phrases maximum :
1. Un conseil personnalisé (ton chaleureux, professionnel)
2. Mentionne 1-2 produits spécifiques du catalogue par leur nom exact
Réponds en français, sans mention d'avertissement légal. Rappelle-toi que tu es dans un tchat.`;

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

// ─── Chat Types ─────────────────────────────────────────────────────────────

type MessageType = 'standard' | 'restock' | 'skip-quiz' | 'terpene';

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text?: string;
    type?: MessageType;
    isResult?: boolean;
    isOptions?: boolean;
    options?: QuizOption[];
    stepId?: string;
    recommended?: Product[];
    restockProduct?: {
        product_id: string;
        product_name: string;
        slug: string | null;
        image_url: string | null;
        price: number;
        daysSince: number;
    };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BudTender() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [stepIndex, setStepIndex] = useState(-1);
    const [answers, setAnswers] = useState<Answers>({});
    const [products, setProducts] = useState<Product[]>([]);
    const [pulse, setPulse] = useState(false);
    // Terpene multi-select state
    const [terpeneSelection, setTerpeneSelection] = useState<string[]>([]);
    const [awaitingTerpene, setAwaitingTerpene] = useState(false);

    const addItem = useCartStore((s) => s.addItem);
    const openSidebar = useCartStore((s) => s.openSidebar);
    const scrollRef = useRef<HTMLDivElement>(null);

    const memory = useBudTenderMemory();

    // Initial product load
    useEffect(() => {
        supabase
            .from('products')
            .select('*, category:categories(slug, name)')
            .eq('is_active', true)
            .eq('is_available', true)
            .then(({ data }) => {
                if (data) setProducts(data as Product[]);
            });

        const t = setTimeout(() => setPulse(true), 8000);
        return () => clearTimeout(t);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // ── Message helpers ──────────────────────────────────────────────────────

    const addBotMessage = (msg: Partial<Message>, delay?: number) => {
        setIsTyping(true);
        const ms = delay ?? (800 + Math.random() * 700);
        setTimeout(() => {
            setMessages((prev) => [...prev, {
                id: Math.random().toString(36).substring(7),
                sender: 'bot',
                ...msg
            }]);
            setIsTyping(false);
        }, ms);
    };

    const addUserMessage = (text: string) => {
        setMessages((prev) => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'user',
            text,
        }]);
    };

    // ── Welcome flow ─────────────────────────────────────────────────────────

    const buildWelcomeMessages = () => {
        const { isLoggedIn, userName, pastProducts, restockCandidates, savedPrefs } = memory;

        // 1) Greeting
        let greeting: string;
        if (!isLoggedIn) {
            greeting = "Bonjour ! Je suis BudTender, votre conseiller CBD personnel. J'aimerais vous aider à trouver les produits idéaux. On commence ?";
        } else if (pastProducts.length > 0) {
            const last = pastProducts[0];
            greeting = `Content de te revoir${userName ? `, ${userName}` : ''} ! 👋 La dernière fois tu avais commandé **${last.product_name}** — tu l'as apprécié ? Je suis là pour te trouver quelque chose d'encore mieux.`;
        } else {
            greeting = `Bienvenue${userName ? `, ${userName}` : ''} ! 🌿 Je suis BudTender, votre conseiller CBD de confiance chez Green Moon. Prêt à découvrir votre sélection idéale ?`;
        }

        // Push greeting first
        addBotMessage({ text: greeting }, 600);

        // 2) Restock reminders (delayed, one per candidate)
        restockCandidates.forEach((candidate, i) => {
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    id: Math.random().toString(36).substring(7),
                    sender: 'bot',
                    type: 'restock',
                    text: `Il y a ${candidate.daysSince} jours que tu as commandé ce produit — il est peut-être temps de renouveler ? 🔄`,
                    restockProduct: candidate,
                }]);
            }, 1400 + i * 600);
        });

        // 3) Skip-quiz option if saved prefs exist
        if (savedPrefs) {
            const delay = 1400 + restockCandidates.length * 600 + 400;
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    id: Math.random().toString(36).substring(7),
                    sender: 'bot',
                    type: 'skip-quiz',
                    text: `Je me souviens de tes préférences ! Veux-tu que je te génère de nouvelles recommandations directement, ou préfères-tu refaire le quiz ?`,
                }]);
            }, delay);
        }
    };

    const handleOpen = () => {
        setPulse(false);
        setIsOpen(true);
        if (messages.length === 0) {
            buildWelcomeMessages();
        }
    };

    // ── Quiz flow ────────────────────────────────────────────────────────────

    const startQuiz = () => {
        setStepIndex(0);
        const firstStep = QUIZ_STEPS[0];
        addBotMessage({
            text: firstStep.question,
            isOptions: true,
            options: firstStep.options,
            stepId: firstStep.id,
        });
    };

    const skipQuizAndRecommend = async () => {
        if (!memory.savedPrefs) return;
        addUserMessage("Utilise mes préférences enregistrées ✨");
        const prefs = memory.savedPrefs;
        const answersFromPrefs: Answers = {
            goal: prefs.goal,
            experience: prefs.experience,
            format: prefs.format,
            budget: prefs.budget,
        };
        setAnswers(answersFromPrefs);
        await generateRecommendations(answersFromPrefs);
    };

    const handleAnswer = async (option: QuizOption, stepId: string) => {
        addUserMessage(option.label);
        const newAnswers = { ...answers, [stepId]: option.value };
        setAnswers(newAnswers);

        const nextIndex = stepIndex + 1;

        // ── Inject terpene step for experts, after experience ──
        if (stepId === 'experience' && option.value === 'expert') {
            setStepIndex(nextIndex); // move to next (format) — will resume after terpene
            setAwaitingTerpene(true);
            setTerpeneSelection([]);
            addBotMessage({
                type: 'terpene',
                text: '🧪 En tant que connaisseur, affinez votre profil ! Sélectionnez vos arômes et effets préférés (optionnel) :',
            });
            return;
        }

        if (nextIndex < QUIZ_STEPS.length) {
            setStepIndex(nextIndex);
            const nextStep = QUIZ_STEPS[nextIndex];
            addBotMessage({
                text: nextStep.question,
                isOptions: true,
                options: nextStep.options,
                stepId: nextStep.id,
            });
        } else {
            await generateRecommendations(newAnswers);
        }
    };

    const confirmTerpeneSelection = () => {
        setAwaitingTerpene(false);
        if (terpeneSelection.length > 0) {
            addUserMessage(`Arômes & effets : ${terpeneSelection.join(', ')} ✨`);
        } else {
            addUserMessage('Je passe cette étape →');
        }
        // Resume quiz from current stepIndex
        const nextStep = QUIZ_STEPS[stepIndex];
        if (nextStep) {
            addBotMessage({
                text: nextStep.question,
                isOptions: true,
                options: nextStep.options,
                stepId: nextStep.id,
            });
        } else {
            generateRecommendations(answers);
        }
    };

    const generateRecommendations = async (finalAnswers: Answers) => {
        setIsTyping(true);

        // Persist prefs
        memory.savePrefs(finalAnswers as unknown as SavedPrefs);

        // Score locally — with terpene bonus
        const scored = [...products]
            .map((p) => ({ product: p, score: scoreProduct(p, finalAnswers) + scoreTerpenes(p, terpeneSelection) }))
            .sort((a, b) => b.score - a.score)
            .filter((x) => x.score > 0)
            .slice(0, 3)
            .map((x) => x.product);

        // Build context for Gemini
        const ctxParts: string[] = [];
        if (memory.pastProducts.length > 0) {
            ctxParts.push(`Derniers achats : ${memory.pastProducts.slice(0, 3).map(p => p.product_name).join(', ')}.`);
        }
        if (terpeneSelection.length > 0) {
            ctxParts.push(`Arômes & effets préférés : ${terpeneSelection.join(', ')}.`);
        }
        const geminiContext = ctxParts.join(' ') || undefined;

        const geminiText = await callGemini(finalAnswers, products, geminiContext);
        const adviceText = geminiText ?? generateAdvice(finalAnswers, terpeneSelection);

        setMessages((prev) => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: adviceText,
            isResult: true,
            recommended: scored,
        }]);
        setIsTyping(false);
    };

    const reset = () => {
        setMessages([]);
        setStepIndex(-1);
        setAnswers({});
        setTerpeneSelection([]);
        setAwaitingTerpene(false);
        setTimeout(() => buildWelcomeMessages(), 100);
    };

    // ─── Render helpers ─────────────────────────────────────────────────────

    // Determines if the welcome CTA (start quiz button) should be visible
    const showStartButton = stepIndex === -1 && !isTyping
        && messages.length > 0
        && !messages.some(m => m.type === 'skip-quiz' || m.type === 'restock' || m.isOptions);

    const showSkipQuizActions = messages.some(m => m.type === 'skip-quiz')
        && stepIndex === -1
        && !isTyping
        && !messages.some(m => m.isOptions || m.isResult);

    return (
        <>
            {/* ── Floating button ── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpen}
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900/80 backdrop-blur-xl border border-green-neon/30 text-white rounded-2xl px-5 py-4 shadow-[0_0_30px_rgba(57,255,20,0.1)] hover:border-green-neon/60 hover:shadow-[0_0_40px_rgba(57,255,20,0.2)] transition-all group ${pulse ? 'animate-pulse-slow' : ''}`}
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-green-neon/20 flex items-center justify-center group-hover:bg-green-neon/30 transition-colors">
                                <Leaf className="w-5 h-5 text-green-neon group-hover:rotate-12 transition-transform duration-300" />
                            </div>
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-neon rounded-full border-2 border-zinc-900 animate-pulse" />
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-bold text-green-neon leading-none tracking-tight">BudTender IA</p>
                            <p className="text-[11px] text-zinc-400 leading-none mt-1 group-hover:text-zinc-200 transition-colors">Votre expert CBD</p>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Chat panel ── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95, rotate: 1 }}
                            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, y: 40, scale: 0.95, rotate: -1 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[min(650px,85vh)] bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800/50 rounded-2xl sm:rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(57,255,20,0.05)] flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4 px-5 py-5 sm:px-6 sm:py-6 border-b border-zinc-800/50 bg-gradient-to-r from-zinc-950/80 to-zinc-900/80">
                                <div className="relative">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center shadow-inner">
                                        <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-green-neon" />
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-neon rounded-full border-[3px] border-zinc-900" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                                        BUDTENDER <span className="text-[10px] bg-green-neon/10 text-green-neon px-2 py-0.5 rounded-full border border-green-neon/20">V2.0</span>
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-pulse" />
                                        <p className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                                            {memory.isLoggedIn && memory.userName
                                                ? `Bonjour, ${memory.userName} 👋`
                                                : 'Expert en cannabinoïdes actif'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={reset}
                                        title="Recommencer"
                                        className="p-2 text-zinc-500 hover:text-green-neon hover:bg-green-neon/5 rounded-xl transition-all"
                                    >
                                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages area */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar bg-gradient-to-b from-transparent via-zinc-900/20 to-green-neon/[0.02]">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}>
                                        {msg.sender === 'bot' && (
                                            <div className="w-8 h-8 rounded-lg bg-green-neon/10 border border-green-neon/20 flex items-center justify-center mb-1 flex-shrink-0 shadow-sm">
                                                <Leaf className="w-3.5 h-3.5 text-green-neon" />
                                            </div>
                                        )}
                                        <div className="max-w-[85%] space-y-3">

                                            {/* ── Standard text bubble ── */}
                                            {msg.text && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                                        ? 'bg-green-neon text-black font-bold'
                                                        : 'bg-zinc-800/80 border border-zinc-700/30 text-zinc-100 backdrop-blur-md'
                                                        }`}
                                                >
                                                    {msg.text}
                                                </motion.div>
                                            )}

                                            {/* ── Restock card ── */}
                                            {msg.type === 'restock' && msg.restockProduct && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 space-y-3"
                                                >
                                                    <div className="flex items-center gap-2 text-amber-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black tracking-widest uppercase">Rappel de Stock</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {msg.restockProduct.image_url && (
                                                            <img
                                                                src={msg.restockProduct.image_url}
                                                                alt={msg.restockProduct.product_name}
                                                                className="w-14 h-14 rounded-xl object-cover bg-zinc-900 flex-shrink-0"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-white line-clamp-1">{msg.restockProduct.product_name}</p>
                                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                                Commandé il y a <span className="text-amber-400 font-bold">{msg.restockProduct.daysSince}j</span>
                                                            </p>
                                                            <p className="text-base font-black text-green-neon mt-1">{msg.restockProduct.price.toFixed(2)} €</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                // Find in loaded products and add to cart
                                                                const p = products.find(pr => pr.id === msg.restockProduct!.product_id);
                                                                if (p) { addItem(p); openSidebar(); }
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 bg-green-neon hover:bg-green-400 text-black font-black text-xs py-2.5 rounded-xl transition-all"
                                                        >
                                                            <ShoppingCart className="w-3.5 h-3.5" />
                                                            Réapprovisionner
                                                        </motion.button>
                                                        {msg.restockProduct.slug && (
                                                            <Link
                                                                to={`/catalogue/${msg.restockProduct.slug}`}
                                                                className="px-3 py-2.5 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center"
                                                            >
                                                                Voir
                                                            </Link>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* ── Terpene Selection UI ── */}
                                            {msg.type === 'terpene' && awaitingTerpene && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-4 pt-2"
                                                >
                                                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                                                        {TERPENE_CHIPS.map((chip) => {
                                                            const isSelected = terpeneSelection.includes(chip.label);
                                                            return (
                                                                <button
                                                                    key={chip.label}
                                                                    onClick={() => {
                                                                        setTerpeneSelection(prev =>
                                                                            isSelected ? prev.filter(t => t !== chip.label) : [...prev, chip.label]
                                                                        );
                                                                    }}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${isSelected
                                                                        ? 'bg-green-neon border-green-neon text-black'
                                                                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                                        }`}
                                                                >
                                                                    <span>{chip.emoji}</span>
                                                                    <span className="truncate">{chip.label}</span>
                                                                    {isSelected && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={confirmTerpeneSelection}
                                                        className="w-full bg-zinc-100 hover:bg-white text-black font-black py-3 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        {terpeneSelection.length > 0 ? (
                                                            <>Confirmer la sélection ({terpeneSelection.length}) <ChevronRight className="w-4 h-4" /></>
                                                        ) : (
                                                            <>Passer cette étape <ChevronRight className="w-4 h-4" /></>
                                                        )}
                                                    </motion.button>
                                                </motion.div>
                                            )}

                                            {/* ── Quiz Options ── */}
                                            {msg.isOptions && msg.options && (
                                                <div className="grid grid-cols-1 gap-2.5 mt-3">
                                                    {msg.options.map((opt) => {
                                                        const isSelected = answers[msg.stepId!] === opt.value;
                                                        const hasAnsweredNext = messages.some(m => m.sender === 'user' && m.text === opt.label);

                                                        return (
                                                            <motion.button
                                                                key={opt.value}
                                                                whileHover={{ x: 4, backgroundColor: 'rgba(57,255,20,0.05)' }}
                                                                disabled={stepIndex !== QUIZ_STEPS.findIndex(s => s.id === msg.stepId)}
                                                                onClick={() => handleAnswer(opt, msg.stepId!)}
                                                                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${isSelected || hasAnsweredNext
                                                                    ? 'bg-green-neon/10 border-green-neon/50 text-green-neon shadow-[0_0_20px_rgba(57,255,20,0.05)]'
                                                                    : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-600 text-zinc-400 group'
                                                                    }`}
                                                            >
                                                                <span className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{opt.emoji}</span>
                                                                <span className="text-sm font-bold tracking-tight">{opt.label}</span>
                                                                <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isSelected || hasAnsweredNext ? 'text-green-neon rotate-90' : 'text-zinc-600'}`} />
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* ── Results ── */}
                                            {msg.isResult && msg.recommended && (
                                                <div className="space-y-4 pt-3">
                                                    <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase px-1">Sélection sur-mesure</p>
                                                    {msg.recommended.map((product, i) => (
                                                        <motion.div
                                                            key={product.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: i * 0.15 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            className="flex items-center gap-4 bg-zinc-800/40 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-green-neon/30 p-4 rounded-[1.5rem] transition-all group"
                                                        >
                                                            <div className="relative flex-shrink-0">
                                                                <img
                                                                    src={product.image_url || ''}
                                                                    className="w-16 h-16 rounded-2xl object-cover bg-zinc-900 shadow-md transition-transform group-hover:scale-105"
                                                                    alt={product.name}
                                                                />
                                                                {product.cbd_percentage && (
                                                                    <span className="absolute -top-1 -left-1 bg-green-neon text-black text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                                                                        {product.cbd_percentage}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <Link to={`/catalogue/${product.slug}`} className="text-sm font-bold text-white hover:text-green-neon line-clamp-1">
                                                                    {product.name}
                                                                </Link>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <p className="text-base font-black text-green-neon">{product.price}€</p>
                                                                    {product.original_value && (
                                                                        <p className="text-[10px] text-zinc-500 line-through">{product.original_value}€</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <motion.button
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => { addItem(product); openSidebar(); }}
                                                                className="w-10 h-10 rounded-xl bg-green-neon hover:bg-green-400 text-black flex items-center justify-center transition-all shadow-lg hover:shadow-green-neon/20"
                                                            >
                                                                <ShoppingCart className="w-4 h-4" />
                                                            </motion.button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex justify-start items-end gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-neon/10 border border-green-neon/20 flex items-center justify-center mb-1 shadow-sm">
                                            <Leaf className="w-3.5 h-3.5 text-green-neon" />
                                        </div>
                                        <div className="bg-zinc-800/80 backdrop-blur-md px-5 py-4 rounded-2xl flex gap-1.5">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 bg-green-neon/40 rounded-full"
                                                    animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── Welcome CTA: simple start quiz (no history, no saved prefs) ── */}
                                {showStartButton && (
                                    <div className="flex justify-start pl-11">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={startQuiz}
                                            className="bg-green-neon hover:bg-green-400 text-black font-black px-8 py-3.5 rounded-2xl text-sm transition-all flex items-center gap-3 group shadow-xl hover:shadow-green-neon/20"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Lancer le diagnostic
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                        </motion.button>
                                    </div>
                                )}

                                {/* ── Skip quiz actions (returning user with saved prefs) ── */}
                                {showSkipQuizActions && (
                                    <div className="flex justify-start pl-11 gap-2 flex-wrap">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={skipQuizAndRecommend}
                                            className="bg-green-neon hover:bg-green-400 text-black font-black px-5 py-3 rounded-2xl text-sm transition-all flex items-center gap-2 shadow-xl hover:shadow-green-neon/20"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Recommandations rapides
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => { memory.clearPrefs(); startQuiz(); }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-2xl text-sm transition-all flex items-center gap-2 border border-zinc-700"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Refaire le quiz
                                        </motion.button>
                                    </div>
                                )}

                                {/* ── After restock cards but no saved prefs: show start quiz ── */}
                                {!isTyping
                                    && messages.some(m => m.type === 'restock')
                                    && !memory.savedPrefs
                                    && !messages.some(m => m.isOptions || m.isResult || m.type === 'skip-quiz')
                                    && (
                                        <div className="flex justify-start pl-11">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={startQuiz}
                                                className="bg-green-neon hover:bg-green-400 text-black font-black px-6 py-3 rounded-2xl text-sm transition-all flex items-center gap-2 shadow-xl hover:shadow-green-neon/20"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Découvrir mes nouvelles sélections
                                            </motion.button>
                                        </div>
                                    )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-zinc-800/50 bg-zinc-950/40 text-[10px] sm:text-[11px] text-zinc-500 text-center font-medium">
                                BUDTENDER AI · <span className="text-zinc-600 italic">Expertise Moléculaire Certifiée</span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
