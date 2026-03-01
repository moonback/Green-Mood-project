import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    Leaf,
    RefreshCw,
    ShoppingCart,
    ChevronRight,
    Sparkles,
    RotateCcw,
    Clock,
    CheckCircle2,
    Share2,
    Copy,
    Gift,
    SendHorizontal,
    Plus,
    ArrowRight,
    MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { getQuizPrompt, getChatPrompt, QuizAnswers } from '../lib/budtenderPrompts';
import { getBudTenderSettings, fetchBudTenderSettings, BudTenderSettings, BUDTENDER_DEFAULTS, QuizStep, QuizOption } from '../lib/budtenderSettings';
import { useCartStore } from '../store/cartStore';
import { useBudTenderMemory, SavedPrefs } from '../hooks/useBudTenderMemory';

// ─── Terpene / Aroma step data ───────────────────────────────────────────────

interface TerpeneChip {
    label: string;
    emoji: string;
    group: 'arome' | 'effet';
}

const TERPENE_CHIPS: TerpeneChip[] = [
    { label: 'Citronné', emoji: '🍋', group: 'arome' },
    { label: 'Terreux', emoji: '🌍', group: 'arome' },
    { label: 'Fruité', emoji: '🍓', group: 'arome' },
    { label: 'Floral', emoji: '🌸', group: 'arome' },
    { label: 'Épicé', emoji: '🌶️', group: 'arome' },
    { label: 'Boisé', emoji: '🪵', group: 'arome' },
    { label: 'Herbacé', emoji: '🌿', group: 'arome' },
    { label: 'Sucré', emoji: '🍬', group: 'arome' },
    { label: 'Focus', emoji: '🎯', group: 'effet' },
    { label: 'Créativité', emoji: '🎨', group: 'effet' },
    { label: 'Détente', emoji: '🛁', group: 'effet' },
    { label: 'Énergie', emoji: '⚡', group: 'effet' },
    { label: 'Récupération', emoji: '💆', group: 'effet' },
    { label: 'Anti-stress', emoji: '🧘', group: 'effet' },
];

// ─── Local Scoring Logic ─────────────────────────────────────────────────────

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
    }
    if (answers.experience === 'expert') {
        if ((product.cbd_percentage ?? 0) >= 20) score += 3;
    }

    if (answers.format === 'oil' && cat === 'huiles') score += 4;
    if (answers.format === 'flower' && (cat === 'fleurs' || cat === 'resines')) score += 4;
    if (answers.format === 'bundle' && product.is_bundle) score += 6;

    const price = product.price;
    if (answers.budget === 'low' && price < 25) score += 3;
    if (answers.budget === 'mid' && price >= 25 && price <= 60) score += 3;
    if (answers.budget === 'high' && price > 60) score += 3;

    if (product.stock_quantity > 0) score += 1;
    if (product.is_featured) score += 2;

    return score;
}

function scoreTerpenes(product: Product, selected: string[]): number {
    if (selected.length === 0) return 0;
    const productAromas: string[] = (product.attributes?.aromas ?? []).map((a: string) => a.toLowerCase());
    const productDesc = (product.description ?? '').toLowerCase();
    let bonus = 0;
    for (const chip of selected) {
        const chipLow = chip.toLowerCase();
        if (productAromas.some(a => a.includes(chipLow))) bonus += 4;
        if (productDesc.includes(chipLow)) bonus += 2;
    }
    return bonus;
}

// ─── AI Integration ──────────────────────────────────────────────────────────

async function callAI(
    answers: Answers,
    products: Product[],
    settings: BudTenderSettings,
    history: { role: string; content: string }[] = [],
    context?: string
): Promise<string | null> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey || !settings.ai_enabled) return null;

    const catalog = products
        .slice(0, 15)
        .map((p) => `- ${p.name} (${p.category?.slug}, CBD ${p.cbd_percentage ?? '?'}%, ${p.price}€)`)
        .join('\n');

    const modelToUse = settings.ai_model || 'google/gemini-2.0-flash-lite-preview-02-05:free';

    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'X-Title': 'Green Mood BudTender',
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    { role: 'system', content: getQuizPrompt(answers, settings.quiz_steps, catalog, context) },
                    ...history,
                    { role: 'user', content: "Basé sur mon profil, donne-moi tes dernières recommandations expertes." }
                ],
                temperature: 0.7,
            }),
        });

        const json = await res.json();
        return json?.choices?.[0]?.message?.content ?? null;
    } catch (err) {
        console.error('[BudTender AI] Error:', err);
        return null;
    }
}

// ─── Components Types ────────────────────────────────────────────────────────

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

export default function BudTender() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [stepIndex, setStepIndex] = useState(-1);
    const [answers, setAnswers] = useState<Answers>({});
    const [products, setProducts] = useState<Product[]>([]);
    const [pulse, setPulse] = useState(false);
    const [terpeneSelection, setTerpeneSelection] = useState<string[]>([]);
    const [awaitingTerpene, setAwaitingTerpene] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [settings, setSettings] = useState<BudTenderSettings>(BUDTENDER_DEFAULTS);

    const addItem = useCartStore((s) => s.addItem);
    const openSidebar = useCartStore((s) => s.openSidebar);
    const scrollRef = useRef<HTMLDivElement>(null);
    const memory = useBudTenderMemory();

    useEffect(() => {
        if (isOpen) fetchBudTenderSettings().then(setSettings);
    }, [isOpen]);

    useEffect(() => {
        supabase.from('products').select('*, category:categories(slug, name)').eq('is_active', true).eq('is_available', true)
            .then(({ data }) => { if (data) setProducts(data as Product[]); });

        const t = setTimeout(() => setPulse(true), 5000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        if (messages.length > 0) memory.saveChatHistory(messages as any);
    }, [messages, isTyping]);

    useEffect(() => {
        if (memory.chatHistory.length > 0 && messages.length === 0) setMessages(memory.chatHistory as any);
    }, []);

    // ── Actions ──────────────────────────────────────────────────────────────

    const addBotMessage = (msg: Partial<Message>, delay = 800) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Math.random().toString(36).substr(7), sender: 'bot', ...msg }]);
            setIsTyping(false);
        }, delay);
    };

    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Math.random().toString(36).substr(7), sender: 'user', text }]);
    };

    const handleOpen = () => {
        setPulse(false);
        setIsOpen(true);
        if (messages.length === 0) {
            addBotMessage({ text: settings.welcome_message });
            if (memory.restockCandidates.length > 0) {
                memory.restockCandidates.forEach(c => {
                    addBotMessage({
                        type: 'restock',
                        text: `Il semble que vous ayez besoin d'un réapprovisionnement pour ${c.product_name} ! 🔄`,
                        restockProduct: c
                    }, 1500);
                });
            }
        }
    };

    const startQuiz = () => {
        setStepIndex(0);
        const first = settings.quiz_steps[0];
        if (first) addBotMessage({ text: first.question, isOptions: true, options: first.options, stepId: first.id });
    };

    const handleAnswer = async (option: QuizOption, stepId: string) => {
        addUserMessage(option.label);
        const newAnswers = { ...answers, [stepId]: option.value };
        setAnswers(newAnswers);

        if (stepId === 'experience' && option.value === 'expert') {
            setAwaitingTerpene(true);
            addBotMessage({ type: 'terpene', text: '🧪 Définissez votre profil terpénique idéal :' });
            return;
        }

        const next = stepIndex + 1;
        if (next < settings.quiz_steps.length) {
            setStepIndex(next);
            const step = settings.quiz_steps[next];
            addBotMessage({ text: step.question, isOptions: true, options: step.options, stepId: step.id });
        } else {
            generateRecommendations(newAnswers);
        }
    };

    const generateRecommendations = async (finalAnswers: Answers) => {
        setIsTyping(true);
        const scored = [...products]
            .map(p => ({ product: p, score: scoreProduct(p, finalAnswers) + scoreTerpenes(p, terpeneSelection) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(x => x.product);

        const aiText = await callAI(finalAnswers, products, settings);

        addBotMessage({
            text: aiText || "Voici vos molécules idéales basées sur mon diagnostic experte.",
            isResult: true,
            recommended: scored
        }, 1200);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text) return;
        setChatInput('');
        addUserMessage(text);
        setIsTyping(true);
        // Simplified AI chat call logic
        const response = await callAI({}, products, settings, [{ role: 'user', content: text }]);
        addBotMessage({ text: response || "Je suis là pour vous conseiller. Voulez-vous un diagnostic complet ?" });
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && settings.enabled && (
                    <motion.button
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        onClick={handleOpen}
                        className={`fixed bottom-6 right-6 z-50 glass-premium flex items-center gap-3 p-4 rounded-3xl shadow-glow-sm hover:scale-105 active:scale-95 transition-all group ${pulse ? 'animate-pulse' : ''}`}
                    >
                        <div className="bg-green-neon/20 p-2.5 rounded-2xl group-hover:bg-green-neon/30 transition-colors">
                            <Leaf className="w-5 h-5 text-green-neon" />
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-black text-green-neon uppercase tracking-tighter">Diagnostic IA</p>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">BudTender v2</span>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 w-[min(420px,92vw)] h-[min(640px,85vh)] glass-premium flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/[0.05] bg-zinc-950/20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-green-neon" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">BUDTENDER IA</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Connecté • Expert</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><X className="w-5 h-5 text-zinc-500" /></button>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[85%] space-y-3">
                                        {msg.text && (
                                            <motion.div
                                                initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-4 rounded-2xl text-[13px] leading-relaxed ${msg.sender === 'user' ? 'bg-green-neon text-black font-bold' : 'bg-white/[0.03] border border-white/[0.05] text-white'}`}
                                            >
                                                {msg.text}
                                            </motion.div>
                                        )}

                                        {msg.isOptions && (
                                            <div className="grid grid-cols-1 gap-2 mt-4">
                                                {msg.options?.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => handleAnswer(opt, msg.stepId!)}
                                                        className="flex items-center justify-between p-4 bg-zinc-950/40 border border-white/[0.05] hover:border-green-neon/40 hover:bg-green-neon/5 rounded-[1.25rem] transition-all group"
                                                    >
                                                        <span className="text-xs font-bold text-zinc-300 group-hover:text-white">{opt.label}</span>
                                                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-green-neon group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {msg.type === 'terpene' && awaitingTerpene && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {TERPENE_CHIPS.map(chip => (
                                                    <button
                                                        key={chip.label}
                                                        onClick={() => setTerpeneSelection(prev => prev.includes(chip.label) ? prev.filter(l => l !== chip.label) : [...prev, chip.label])}
                                                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${terpeneSelection.includes(chip.label) ? 'bg-green-neon border-green-neon text-black' : 'bg-white/[0.03] border-white/10 text-zinc-400'}`}
                                                    >
                                                        {chip.emoji} {chip.label}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        setAwaitingTerpene(false);
                                                        handleAnswer({ label: 'Profil validé', value: 'done', emoji: '✅' }, 'terpene');
                                                    }}
                                                    className="w-full mt-2 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl"
                                                >
                                                    Confirmer ma sélection
                                                </button>
                                            </div>
                                        )}

                                        {msg.isResult && msg.recommended && (
                                            <div className="space-y-3 pt-4">
                                                {msg.recommended.map(prod => (
                                                    <div key={prod.id} className="p-3 bg-zinc-950/40 border border-white/[0.05] rounded-[1.5rem] flex items-center gap-4">
                                                        <img src={prod.image_url} className="w-16 h-16 rounded-xl object-cover" />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                                                            <p className="text-sm font-black text-green-neon">{prod.price.toFixed(2)}€</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                addItem(prod);
                                                                openSidebar();
                                                            }}
                                                            className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center hover:bg-green-neon hover:text-black transition-all"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex gap-1.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                        <div className="w-1.5 h-1.5 bg-green-neon/50 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-green-neon/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-green-neon/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-zinc-950/40 border-t border-white/[0.05]">
                            {stepIndex === -1 && !isTyping && messages.length > 0 && (
                                <button
                                    onClick={startQuiz}
                                    className="w-full mb-4 py-4 bg-green-neon text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-glow-sm flex items-center justify-center gap-3 animate-pulse"
                                >
                                    Démarrer le diagnostic <ArrowRight className="w-4 h-4" />
                                </button>
                            )}

                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Posez une question à l'expert..."
                                    className="w-full bg-zinc-900/50 border border-white/[0.08] rounded-2xl pl-5 pr-14 py-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-neon/50 transition-all"
                                />
                                <button type="submit" className="absolute right-2 top-2 p-2.5 bg-green-neon/10 text-green-neon rounded-xl hover:bg-green-neon hover:text-black transition-all">
                                    <SendHorizontal className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
