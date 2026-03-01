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

function generateAdvice(answers: Answers): string {
    const lines: string[] = [];
    if (answers.goal === 'sleep') lines.push('Pour favoriser un sommeil de qualité, je recommande les huiles à fort dosage le soir au coucher.');
    if (answers.goal === 'stress') lines.push("Contre le stress quotidien, les infusions ou une huile à dosage modéré sont d'excellentes alliées.");
    if (answers.goal === 'pain') lines.push('Pour les douleurs, une huile haute concentration (20%+) appliquée régulièrement donne les meilleurs résultats.');
    if (answers.goal === 'wellness') lines.push('Pour un bien-être global, démarrez doucement avec une huile classique ou une infusion.');
    if (answers.experience === 'beginner') lines.push("En tant que débutant, commencez à faible dose et augmentez progressivement selon vos ressentis.");
    if (answers.format === 'bundle') lines.push("Les packs découverte sont idéaux pour tester plusieurs formes de CBD à prix réduit.");
    return lines.join(' ');
}

async function callGemini(answers: Answers, products: Product[]): Promise<string | null> {
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

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text?: string;
    isResult?: boolean;
    isOptions?: boolean;
    options?: QuizOption[];
    stepId?: string;
    recommended?: Product[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BudTender() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [stepIndex, setStepIndex] = useState(-1); // -1 = welcome, 0+ = quiz steps
    const [answers, setAnswers] = useState<Answers>({});
    const [products, setProducts] = useState<Product[]>([]);
    const [pulse, setPulse] = useState(false);

    const addItem = useCartStore((s) => s.addItem);
    const openSidebar = useCartStore((s) => s.openSidebar);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial load of products
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

    const addBotMessage = (msg: Partial<Message>) => {
        setIsTyping(true);
        setTimeout(() => {
            const newMsg: Message = {
                id: Math.random().toString(36).substring(7),
                sender: 'bot',
                ...msg
            };
            setMessages((prev) => [...prev, newMsg]);
            setIsTyping(false);
        }, 800 + Math.random() * 700);
    };

    const addUserMessage = (text: string) => {
        const newMsg: Message = {
            id: Math.random().toString(36).substring(7),
            sender: 'user',
            text
        };
        setMessages((prev) => [...prev, newMsg]);
    };

    const startQuiz = () => {
        setStepIndex(0);
        const firstStep = QUIZ_STEPS[0];
        addBotMessage({
            text: firstStep.question,
            isOptions: true,
            options: firstStep.options,
            stepId: firstStep.id
        });
    };

    const handleOpen = () => {
        setPulse(false);
        setIsOpen(true);
        if (messages.length === 0) {
            // Welcome message
            addBotMessage({
                text: "Bonjour ! Je suis BudTender, votre conseiller CBD personnel. J'aimerais vous aider à trouver les produits idéaux. On commence ?",
            });
        }
    };

    const handleAnswer = async (option: QuizOption, stepId: string) => {
        addUserMessage(option.label);
        const newAnswers = { ...answers, [stepId]: option.value };
        setAnswers(newAnswers);

        const nextIndex = stepIndex + 1;
        if (nextIndex < QUIZ_STEPS.length) {
            setStepIndex(nextIndex);
            const nextStep = QUIZ_STEPS[nextIndex];
            addBotMessage({
                text: nextStep.question,
                isOptions: true,
                options: nextStep.options,
                stepId: nextStep.id
            });
        } else {
            // Processing results
            setIsTyping(true);

            // Score locally
            const scored = [...products]
                .map((p) => ({ product: p, score: scoreProduct(p, newAnswers) }))
                .sort((a, b) => b.score - a.score)
                .filter((x) => x.score > 0)
                .slice(0, 3)
                .map((x) => x.product);

            // Gemini call
            const geminiText = await callGemini(newAnswers, products);
            const adviceText = geminiText ?? generateAdvice(newAnswers);

            addBotMessage({
                text: adviceText,
                isResult: true,
                recommended: scored
            });
        }
    };

    const reset = () => {
        setMessages([]);
        setStepIndex(-1);
        setAnswers({});
        handleOpen();
    };

    return (
        <>
            {/* ── Floating button ── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={handleOpen}
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 border border-green-neon/40 text-white rounded-2xl px-4 py-3 shadow-2xl hover:border-green-neon/80 transition-all group ${pulse ? 'animate-pulse-slow' : ''}`}
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
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.95 }}
                            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[min(600px,80vh)] sm:h-[600px] bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                            style={{ boxShadow: '0 0 40px rgba(57,255,20,0.08), 0 24px 64px rgba(0,0,0,0.6)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-zinc-800 bg-zinc-950/60">
                                <div className="relative">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-green-neon/20 border border-green-neon/30 flex items-center justify-center">
                                        <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-green-neon" />
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 h-3 bg-green-neon rounded-full border-2 border-zinc-950" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-bold text-white">BudTender</p>
                                    <p className="text-[10px] sm:text-xs text-green-neon/80 flex items-center gap-1">
                                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-neon rounded-full" />
                                        Conseiller disponible
                                    </p>
                                </div>
                                <div className="ml-auto flex gap-1">
                                    <button onClick={reset} className="p-1.5 text-zinc-500 hover:text-white rounded-xl">
                                        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button onClick={() => setIsOpen(false)} className="p-1.5 text-zinc-500 hover:text-white rounded-xl">
                                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages area */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4 custom-scrollbar">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                        {msg.sender === 'bot' && (
                                            <div className="w-8 h-8 rounded-lg bg-green-neon/10 border border-green-neon/20 flex items-center justify-center mb-1 flex-shrink-0">
                                                <Leaf className="w-3.5 h-3.5 text-green-neon" />
                                            </div>
                                        )}
                                        <div className="max-w-[85%] space-y-2">
                                            {msg.text && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                                        ? 'bg-green-neon text-black font-medium'
                                                        : 'bg-zinc-800 text-zinc-200'
                                                        }`}
                                                >
                                                    {msg.text}
                                                </motion.div>
                                            )}

                                            {/* Options Rendering */}
                                            {msg.isOptions && msg.options && (
                                                <div className="grid grid-cols-1 gap-2 mt-2">
                                                    {msg.options.map((opt) => {
                                                        const isSelected = answers[msg.stepId!] === opt.value;
                                                        const hasAnsweredNext = messages.some(m => m.sender === 'user' && m.text === opt.label);

                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                disabled={stepIndex !== QUIZ_STEPS.findIndex(s => s.id === msg.stepId)}
                                                                onClick={() => handleAnswer(opt, msg.stepId!)}
                                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${isSelected || hasAnsweredNext
                                                                    ? 'bg-green-neon/10 border-green-neon text-green-neon'
                                                                    : 'bg-zinc-800/40 border-zinc-700 hover:border-zinc-500 text-zinc-400'
                                                                    }`}
                                                            >
                                                                <span className="text-xl">{opt.emoji}</span>
                                                                <span className="text-sm font-medium">{opt.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Results Rendering */}
                                            {msg.isResult && msg.recommended && (
                                                <div className="space-y-3 pt-2">
                                                    {msg.recommended.map((product, i) => (
                                                        <motion.div
                                                            key={product.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-3"
                                                        >
                                                            <img
                                                                src={product.image_url || ''}
                                                                className="w-12 h-12 rounded-lg object-cover bg-zinc-700"
                                                                alt={product.name}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <Link to={`/catalogue/${product.slug}`} className="text-xs font-bold text-white hover:text-green-neon line-clamp-1">
                                                                    {product.name}
                                                                </Link>
                                                                <p className="text-[10px] text-green-neon">{product.price}€</p>
                                                            </div>
                                                            <button
                                                                onClick={() => { addItem(product); openSidebar(); }}
                                                                className="w-8 h-8 rounded-lg bg-green-neon hover:bg-green-400 text-black flex items-center justify-center transition-colors"
                                                            >
                                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex justify-start items-end gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-green-neon/10 border border-green-neon/20 flex items-center justify-center mb-1">
                                            <Leaf className="w-3.5 h-3.5 text-green-neon" />
                                        </div>
                                        <div className="bg-zinc-800 px-4 py-3 rounded-2xl flex gap-1">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 h-1.5 bg-zinc-500 rounded-full"
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Welcome Action */}
                                {stepIndex === -1 && !isTyping && messages.length === 1 && (
                                    <div className="flex justify-start pl-10">
                                        <button
                                            onClick={startQuiz}
                                            className="bg-green-neon hover:bg-green-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 group"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Commencer l'analyse
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/40 text-[10px] text-zinc-600 text-center">
                                BudTender utilise l'IA pour vous conseiller. Produits &lt; 0.3% THC.
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
