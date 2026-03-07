/**
 * BudTender.tsx
 *
 * AI-powered product advisor chat panel. Orchestrates the quiz flow,
 * free-form chat, and voice advisor. All AI logic is delegated to
 * aiService; UI sub-sections are composed from focused components.
 */

import { useState, useEffect, useRef, useCallback, type ReactNode, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, RefreshCw, ChevronRight, Sparkles, RotateCcw, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../lib/types';
import { getQuizPrompt as _getQuizPrompt } from '../lib/budtenderPrompts';
import { getBudTenderSettings, BudTenderSettings, BUDTENDER_DEFAULTS, QuizOption } from '../lib/budtenderSettings';
import { getCachedProducts, getCachedSettings } from '../lib/budtenderCache';
import { useCartStore } from '../store/cartStore';
import { useBudTenderMemory, SavedPrefs } from '../hooks/useBudTenderMemory';
import { BudTenderWidget, BudTenderMessage, BudTenderTypingIndicator } from './budtender-ui';
import VoiceAdvisor from './VoiceAdvisor';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import {
    TERPENE_CHIPS,
    Answers,
    scoreProduct,
    scoreTerpenes,
    generateAdvice,
    callQuizAI,
    callChatAI,
    findRelevantProducts,
    findProductByName,
    logBudTenderInteraction,
    ChatAIToolDefinition,
} from '../services/aiService';
import RestockCard from './ai/RestockCard';
import TerpeneSelector from './ai/TerpeneSelector';
import QuizOptions from './ai/QuizOptions';
import RecommendationResult from './ai/RecommendationResult';
import BudTenderHistoryPanel from './ai/BudTenderHistoryPanel';
import ChatInputBar from './ai/ChatInputBar';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Header action button ─────────────────────────────────────────────────────

function HeaderAction({ icon, title, onClick, isActive, label }: {
    icon: ReactNode;
    title: string;
    onClick: () => void;
    isActive?: boolean;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`
                flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all group
                ${isActive
                    ? 'bg-green-neon text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'}
            `}
        >
            <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-zinc-400 font-bold'}`}>
                {label}
            </span>
        </button>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BudTender() {
    const globalSettings = useSettingsStore((s) => s.settings);
    const navigate = useNavigate();

    // Panel state
    const [isOpen, setIsOpen] = useState(false);
    const [isVoiceOpen, setIsVoiceOpen] = useState(false);
    const [isShrink, setIsShrink] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [pulse, setPulse] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [chatInput, setChatInput] = useState('');

    // Quiz state
    const [stepIndex, setStepIndex] = useState(-1);
    const [answers, setAnswers] = useState<Answers>({});
    const [terpeneSelection, setTerpeneSelection] = useState<string[]>([]);
    const [awaitingTerpene, setAwaitingTerpene] = useState(false);

    // UI state
    const [hasShared, setHasShared] = useState(false);
    const [showPromoTooltip, setShowPromoTooltip] = useState(false);

    // Data
    const [products, setProducts] = useState<Product[]>([]);
    const [settings, setSettings] = useState<BudTenderSettings>(BUDTENDER_DEFAULTS);

    const addItem = useCartStore((s) => s.addItem);
    const cartItems = useCartStore((s) => s.items);
    const openSidebar = useCartStore((s) => s.openSidebar);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasTriedLoad = useRef(false);

    const memory = useBudTenderMemory();
    const { logQuestion } = memory;

    // Load admin settings when chat opens (cached)
    useEffect(() => {
        if (isOpen) {
            getCachedSettings().then(setSettings);
        }
    }, [isOpen]);

    // Load product catalog on mount (cached)
    useEffect(() => {
        getCachedProducts().then(setProducts);
    }, []);

    // Pulse attention-grabber after configured delay
    useEffect(() => {
        const currentSettings = getBudTenderSettings();
        if (currentSettings.pulse_delay > 0) {
            const t = setTimeout(() => setPulse(true), currentSettings.pulse_delay * 1000);
            return () => clearTimeout(t);
        }
    }, []);

    // Auto-scroll and persist chat history on message change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        if (messages.length > 0) {
            memory.saveChatHistory(messages as any);
        }
    }, [messages, isTyping]);

    // Restore persisted chat history on mount (once)
    useEffect(() => {
        if (!hasTriedLoad.current && memory.chatHistory.length > 0 && messages.length === 0) {
            setMessages(memory.chatHistory as any);
            hasTriedLoad.current = true;
        } else if (memory.chatHistory.length === 0) {
            hasTriedLoad.current = true;
        }
    }, [memory.chatHistory, messages.length]);

    // ── Message helpers ──────────────────────────────────────────────────────

    const addBotMessage = useCallback((msg: Partial<Message>, delay?: number) => {
        setIsTyping(true);
        let baseDelay = 1000;
        if (settings.typing_speed === 'fast') baseDelay = 400;
        if (settings.typing_speed === 'slow') baseDelay = 2000;
        const ms = delay ?? (baseDelay + Math.random() * (baseDelay / 2));
        setTimeout(() => {
            setMessages((prev) => [...prev, { id: Math.random().toString(36).substring(7), sender: 'bot', ...msg }]);
            setIsTyping(false);
        }, ms);
    }, [settings.typing_speed]);

    const addUserMessage = useCallback((text: string) => {
        setMessages((prev) => [...prev, { id: Math.random().toString(36).substring(7), sender: 'user', text }]);
    }, []);

    // ── Welcome flow ─────────────────────────────────────────────────────────

    const buildWelcomeMessages = () => {
        const { isLoggedIn, userName, pastProducts, restockCandidates, savedPrefs } = memory;
        const currentCartItems = useCartStore.getState().items;
        const currentPath = window.location.pathname;

        // 1) Greeting
        let greeting: string;
        if (!isLoggedIn) {
            greeting = settings.welcome_message;
        } else if (pastProducts.length > 0) {
            const last = pastProducts[0];
            greeting = `Content de te revoir${userName ? `, ${userName}` : ''} ! 👋 La dernière fois tu avais commandé **${last.product_name}** — tu l'as apprécié ? Je suis là pour te trouver quelque chose d'encore mieux.`;
        } else {
            greeting = `Bienvenue${userName ? `, ${userName}` : ''} ! 🌿 Je suis BudTender, votre conseiller CBD de confiance chez Green Mood. Prêt à découvrir votre sélection idéale ?`;
        }
        addBotMessage({ text: greeting }, 600);

        // 2) Proactive context-aware recommendations
        setTimeout(() => {
            if (currentCartItems.length === 0 && currentPath.includes('/catalogue')) {
                addBotMessage({
                    text: "Je vois que votre panier est encore vide ! 🛒 Souhaitez-vous que je vous guide vers nos best-sellers du moment ?",
                    isOptions: true,
                    stepId: 'proactive',
                    options: [
                        { label: "Oui, conseiller moi ✨", value: "start_quiz", emoji: "✨" },
                        { label: "Plus tard", value: "later", emoji: "⏳" },
                    ],
                }, 400);
            } else if (currentPath.includes('/catalogue/') && currentCartItems.length > 0) {
                addBotMessage({
                    text: "Excellent choix ! 🌿 Saviez-vous que ce produit se marie parfaitement avec l'une de nos huiles sublinguales pour un effet renforcé ?",
                    isOptions: true,
                    stepId: 'proactive',
                    options: [
                        { label: "En savoir plus", value: "upsell_info", emoji: "💡" },
                        { label: "Non merci", value: "later", emoji: "✖️" },
                    ],
                }, 400);
            }
        }, 1200);

        // 3) Restock reminders
        restockCandidates.forEach((candidate, i) => {
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    id: Math.random().toString(36).substring(7),
                    sender: 'bot',
                    type: 'restock',
                    text: `Il y a ${candidate.daysSince} jours que tu as commandé ce produit — il est peut-être temps de renouveler ? 🔄`,
                    restockProduct: candidate,
                }]);
            }, 2000 + i * 600);
        });

        // 4) Skip-quiz shortcut if saved prefs exist
        if (savedPrefs) {
            const delay = 2000 + restockCandidates.length * 600 + 400;
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    id: Math.random().toString(36).substring(7),
                    sender: 'bot',
                    type: 'skip-quiz',
                    text: "Je me souviens de tes préférences ! Veux-tu que je te génère de nouvelles recommandations directement, ou préfères-tu refaire le quiz ?",
                }]);
            }, delay);
        }
    };

    const handleOpen = () => {
        setPulse(false);
        setIsOpen(true);
        setIsShrink(false);
        if (messages.length === 0) buildWelcomeMessages();
    };

    // ── Quiz flow ────────────────────────────────────────────────────────────

    const startQuiz = () => {
        setStepIndex(0);
        const firstStep = settings.quiz_steps[0];
        if (firstStep) {
            addBotMessage({ text: firstStep.question, isOptions: true, options: firstStep.options, stepId: firstStep.id });
        }
    };

    const skipQuizAndRecommend = async () => {
        if (!memory.savedPrefs) return;
        addBotMessage({ text: "✨ **Recherche en cours...** Je me base sur vos préférences habituelles pour vous proposer le meilleur du catalogue." }, 200);
        const prefs = memory.savedPrefs;
        const answersFromPrefs: Answers = { goal: prefs.goal, experience: prefs.experience, format: prefs.format, budget: prefs.budget };
        setAnswers(answersFromPrefs);
        await generateRecommendations(answersFromPrefs);
    };

    const handleAnswer = async (option: QuizOption, stepId: string) => {
        addUserMessage(option.label);

        if (option.value === 'start_quiz') { startQuiz(); return; }
        if (option.value === 'upsell_info') {
            addBotMessage({ text: "Excellent réflexe ! Mixer fleurs et huiles permet de bénéficier de l'effet d'entourage complet. Voici mes meilleures recommandations d'huiles pour compléter votre panier :" }, 400);
            await generateRecommendations({ ...answers, format: 'oil' });
            return;
        }
        if (option.value === 'later') {
            addBotMessage({ text: "Pas de souci ! N'hésitez pas à me solliciter si vous avez besoin d'un conseil plus tard. 😊" }, 400);
            return;
        }

        const newAnswers = { ...answers, [stepId]: option.value };
        setAnswers(newAnswers);
        const nextIndex = stepIndex + 1;

        // Inject terpene step for expert users
        if (stepId === 'experience' && option.value === 'expert') {
            setStepIndex(nextIndex);
            setAwaitingTerpene(true);
            setTerpeneSelection([]);
            addBotMessage({ type: 'terpene', text: '🧪 En tant que connaisseur, affinez votre profil ! Sélectionnez vos arômes et effets préférés (optionnel) :' });
            return;
        }

        if (nextIndex < settings.quiz_steps.length) {
            setStepIndex(nextIndex);
            const nextStep = settings.quiz_steps[nextIndex];
            addBotMessage({ text: nextStep.question, isOptions: true, options: nextStep.options, stepId: nextStep.id });
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
        const nextStep = settings.quiz_steps[stepIndex];
        if (nextStep) {
            addBotMessage({ text: nextStep.question, isOptions: true, options: nextStep.options, stepId: nextStep.id });
        } else {
            generateRecommendations(answers);
        }
    };

    const generateRecommendations = async (finalAnswers: Answers) => {
        setIsTyping(true);
        memory.savePrefs(finalAnswers as unknown as SavedPrefs);

        const scored = [...products]
            .map((p) => ({ product: p, score: scoreProduct(p, finalAnswers) + scoreTerpenes(p, terpeneSelection) }))
            .sort((a, b) => b.score - a.score)
            .filter((x) => x.score > 0)
            .slice(0, settings.recommendations_count)
            .map((x) => x.product);

        const ctxParts: string[] = [];
        if (memory.pastProducts.length > 0) ctxParts.push(`Derniers achats : ${memory.pastProducts.slice(0, 3).map(p => p.product_name).join(', ')}.`);
        if (terpeneSelection.length > 0) ctxParts.push(`Arômes & effets préférés : ${terpeneSelection.join(', ')}.`);
        const geminiContext = ctxParts.join(' ') || undefined;

        const history = messages
            .filter(m => m.text && !m.isResult)
            .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant' as any, content: m.text || '' }));

        const aiText = await callQuizAI(finalAnswers, products, settings, history, geminiContext);
        const adviceText = aiText ?? generateAdvice(finalAnswers, terpeneSelection);

        setMessages((prev) => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: adviceText,
            isResult: true,
            recommended: scored,
        }]);

        const { user } = useAuthStore.getState();
        if (user && scored.length > 0) {
            await logBudTenderInteraction(user.id, {
                interaction_type: 'recommendation',
                recommended_products: scored.map(p => p.id),
                quiz_answers: finalAnswers,
            });
        }

        setIsTyping(false);
    };

    // ── Utility handlers ─────────────────────────────────────────────────────

    const reset = () => {
        memory.clearChatHistory();
        setMessages([]);
        setStepIndex(-1);
        setAnswers({});
        setTerpeneSelection([]);
        setAwaitingTerpene(false);
        setHasShared(false);
        setTimeout(() => buildWelcomeMessages(), 100);
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Green Mood CBD — Mon diagnostic BudTender',
            text: 'Je viens de faire mon diagnostic CBD avec BudTender IA Chez Green Mood ! Découvrez vos produits idéaux ici :',
            url: window.location.origin,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                setHasShared(true);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                setHasShared(true);
                alert("Lien copié dans le presse-papier ! Partagez-le pour débloquer votre code.");
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const copyPromoCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setShowPromoTooltip(true);
        setTimeout(() => setShowPromoTooltip(false), 2000);
    };

    // ── Free chat handler ────────────────────────────────────────────────────

    const handleSendMessage = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        const text = chatInput.trim();
        if (!text || isTyping) return;

        setChatInput('');
        addUserMessage(text);
        logQuestion(text);
        setIsTyping(true);

        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey || !settings.ai_enabled) {
            addBotMessage({ text: "Désolé, ma connexion à l'IA n'est pas configurée pour le moment." });
            setIsTyping(false);
            return;
        }

        // RAG: find semantically relevant products for context
        const relevantProducts = await findRelevantProducts(text, products);

        // Build conversation history (alternating roles)
        const history: { role: 'user' | 'assistant'; content: string }[] = [];
        messages
            .filter(m => m.text && !m.isResult)
            .forEach(m => {
                const role = m.sender === 'user' ? 'user' : 'assistant';
                if (history.length > 0 && history[history.length - 1].role === role) {
                    history[history.length - 1].content += '\n' + m.text;
                } else {
                    history.push({ role, content: m.text || '' });
                }
            });

        const tools: ChatAIToolDefinition[] = [{
            type: 'function',
            function: {
                name: 'add_to_cart',
                description: "Ajouter un ou plusieurs produits au panier. Précisez soit la quantité d'unités (ex: 4 fois), soit le poids total en grammes (ex: 10 grammes).",
                parameters: {
                    type: 'object',
                    properties: {
                        product_name: { type: 'string', description: 'Le nom du produit à ajouter.' },
                        quantity: { type: 'number', description: "Nombre d'unités (ex: 4)." },
                        weight_grams: { type: 'number', description: 'Poids total en grammes (ex: 10).' },
                    },
                    required: ['product_name'],
                },
            },
        }];

        try {
            const result = await callChatAI(
                text,
                relevantProducts,
                settings,
                { savedPrefs: memory.savedPrefs as any, userName: memory.userName, pastProducts: memory.pastProducts },
                history,
                tools
            );

            if (!result || result.status >= 400) {
                const errMsg = result?.status === 429
                    ? "Désolé, je reçois trop de messages en ce moment (limite OpenRouter). Pourriez-vous patienter une minute ? 🙏"
                    : `Erreur OpenRouter (${result?.status}) : ${(result?.rawJson as any)?.error?.message || 'Inconnue'}`;
                console.error('OpenRouter Error:', result?.rawJson);
                addBotMessage({ text: errMsg });
                return;
            }

            // Handle tool calls (e.g. add_to_cart)
            if (result.toolCalls && result.toolCalls.length > 0) {
                for (const toolCall of result.toolCalls) {
                    if (toolCall.function.name === 'add_to_cart') {
                        const args = JSON.parse(toolCall.function.arguments);
                        const prodName = (args.product_name || '').trim();
                        const weightGrams = Number(args.weight_grams) || 0;
                        let qty = Number(args.quantity) || 0;

                        const p = await findProductByName(prodName, [...relevantProducts, ...products]);
                        if (p) {
                            if (weightGrams > 0) {
                                const unitWeight = p.weight_grams || 1;
                                qty = Math.max(1, Math.round(weightGrams / unitWeight));
                            } else if (qty <= 0) {
                                qty = 1;
                            }
                            addItem(p, qty);
                            openSidebar();
                            addBotMessage({
                                text: weightGrams > 0
                                    ? `🛒 J'ai ajouté **${weightGrams}g** de **${p.name}** (équivalent à x${qty}) à votre panier.`
                                    : `🛒 J'ai ajouté **${qty}x ${p.name}** à votre panier.`,
                            }, 400);
                        } else {
                            addBotMessage({ text: `Désolé, je n'ai pas trouvé le produit "${prodName}" dans notre catalogue.` }, 400);
                        }
                    }
                }
            }

            if (result.text) {
                setMessages((prev) => [...prev, { id: Math.random().toString(36).substring(7), sender: 'bot', text: result.text! }]);
            } else if (!result.toolCalls) {
                console.error('OpenRouter empty response:', result.rawJson);
                addBotMessage({ text: "Je n'ai pas pu analyser votre message correctement. Pouvez-vous reformuler ?" });
            }
        } catch (err) {
            console.error('handleSendMessage error:', err);
            addBotMessage({ text: "Oups, j'ai eu une petite déconnexion. Pouvez-vous réessayer ?" });
        } finally {
            setIsTyping(false);
        }
    };

    // ── Derived UI state ─────────────────────────────────────────────────────

    const showStartButton = stepIndex === -1 && !isTyping
        && messages.length > 0
        && !messages.some(m => m.type === 'skip-quiz' || m.type === 'restock' || m.isOptions || settings.quiz_steps.some(s => s.question === m.text));

    const showSkipQuizActions = messages.some(m => m.type === 'skip-quiz')
        && stepIndex === -1
        && !isTyping
        && !messages.some(m => m.isOptions || m.isResult);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            {/* Floating widget / expand button */}
            <AnimatePresence>
                {isOpen && !isShrink ? null : ((globalSettings?.budtender_chat_enabled ?? true) || (globalSettings?.budtender_voice_enabled ?? true)) && (
                    <BudTenderWidget
                        onClick={() => {
                            if (isShrink) {
                                setIsShrink(false);
                            } else if (globalSettings?.budtender_chat_enabled !== false) {
                                setIsOpen(true);
                            } else if (globalSettings?.budtender_voice_enabled !== false) {
                                setIsVoiceOpen(true);
                            }
                        }}
                        isChatEnabled={globalSettings?.budtender_chat_enabled ?? true}
                        onVoiceClick={(globalSettings?.budtender_voice_enabled ?? true) ? () => {
                            setIsVoiceOpen(!isVoiceOpen);
                        } : undefined}
                        isVoiceActive={isVoiceOpen}
                        pulse={pulse}
                        mode={isShrink ? 'expand' : 'default'}
                    />
                )}
            </AnimatePresence>

            {/* Voice advisor overlay */}
            <VoiceAdvisor
                products={products}
                pastProducts={memory.pastProducts}
                savedPrefs={memory.savedPrefs}
                userName={memory.userName}
                isOpen={isVoiceOpen}
                cartItems={cartItems}
                onClose={() => { setIsVoiceOpen(false); setIsShrink(false); }}
                onHangup={() => setIsShrink(true)}
                onAddItem={(product, quantity) => { addItem(product, quantity); openSidebar(); setIsShrink(true); }}
                onViewProduct={(product) => { navigate(`/catalogue/${product.slug}`); setIsShrink(true); }}
                onNavigate={(path) => { navigate(path); setIsShrink(false); }}
                showUI={isOpen || isVoiceOpen}
            />

            {/* Chat panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={isShrink
                                ? { opacity: 0, scale: 0.8, y: 100, pointerEvents: 'none' }
                                : { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto' }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="fixed inset-0 z-[9999] bg-zinc-950/98 backdrop-blur-3xl flex flex-col overflow-hidden origin-bottom-right"
                        >
                            {/* ── Panel header ── */}
                            <div className="relative z-40 px-6 py-6 sm:py-8 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl">
                                <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-6">
                                    {/* Branding */}
                                    <div className="flex items-center gap-5">
                                        <div className="relative group">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center transition-all group-hover:border-green-neon/40 shadow-2xl overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-green-neon/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <span className="text-green-neon text-2xl">🌿</span>
                                            </div>
                                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-neon rounded-full border-[3px] border-zinc-950 shadow-[0_0_10px_rgba(57,255,20,0.4)]" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase italic">
                                                    BudTender <span className="text-green-neon not-italic">AI</span>
                                                </h3>
                                                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-neon/5 border border-green-neon/10">
                                                    <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-pulse shadow-[0_0_5px_rgba(57,255,20,0.8)]" />
                                                    <span className="text-[10px] font-black text-green-neon tracking-widest uppercase">Live Expert</span>
                                                </div>
                                            </div>
                                            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
                                                {memory.isLoggedIn && memory.userName
                                                    ? `Session active · Bonjour, ${memory.userName}`
                                                    : 'Conseiller spécialisé en cannabinoïdes'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Header actions */}
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="h-10 w-[1px] bg-white/5 mx-2 hidden sm:block" />
                                        {(globalSettings?.budtender_voice_enabled ?? true) && (
                                            <HeaderAction
                                                icon={<Mic className="w-5 h-5" />}
                                                title="Conseiller vocal (Gemini Live)"
                                                onClick={() => setIsVoiceOpen(true)}
                                                label="Voix"
                                            />
                                        )}
                                        <HeaderAction
                                            icon={<History className="w-5 h-5" />}
                                            title="Historique des discussions"
                                            onClick={() => {
                                                setIsHistoryOpen(!isHistoryOpen);
                                                if (!isHistoryOpen) memory.fetchAllSessions();
                                            }}
                                            isActive={isHistoryOpen}
                                            label="Historique"
                                        />
                                        <HeaderAction
                                            icon={<RefreshCw className="w-5 h-5" />}
                                            title="Nouvelle session"
                                            onClick={reset}
                                            label="Nouvelle"
                                        />
                                        <div className="h-10 w-[1px] bg-white/5 mx-2" />
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                                            title="Fermer"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── History panel (overlay) ── */}
                            <BudTenderHistoryPanel
                                isOpen={isHistoryOpen}
                                onClose={() => setIsHistoryOpen(false)}
                                isLoggedIn={memory.isLoggedIn}
                                isLoading={memory.isHistoryLoading}
                                sessions={memory.allChatSessions as any}
                                onLoadSession={(sessionMessages) => setMessages(sessionMessages as any)}
                            />

                            {/* ── Messages area ── */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent via-zinc-900/10 to-green-neon/[0.01]">
                                <div className="max-w-7xl mx-auto w-full p-5 sm:p-10 space-y-8">
                                    {messages.map((msg) => (
                                        <BudTenderMessage
                                            key={msg.id}
                                            sender={msg.sender}
                                            text={msg.text}
                                            type={msg.type}
                                            isTyping={isTyping}
                                        >
                                            {/* Restock card */}
                                            {msg.type === 'restock' && msg.restockProduct && (
                                                <RestockCard
                                                    restockProduct={msg.restockProduct}
                                                    allProducts={products}
                                                    onAddToCart={(product) => { addItem(product); openSidebar(); setIsShrink(true); }}
                                                    onViewProduct={() => setIsShrink(true)}
                                                />
                                            )}

                                            {/* Terpene selector */}
                                            {msg.type === 'terpene' && awaitingTerpene && (
                                                <TerpeneSelector
                                                    chips={TERPENE_CHIPS}
                                                    selected={terpeneSelection}
                                                    onToggle={(label) => setTerpeneSelection(prev =>
                                                        prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
                                                    )}
                                                    onConfirm={confirmTerpeneSelection}
                                                />
                                            )}

                                            {/* Quiz options */}
                                            {msg.isOptions && msg.options && (
                                                <QuizOptions
                                                    options={msg.options}
                                                    stepId={msg.stepId!}
                                                    answers={answers}
                                                    messages={messages}
                                                    stepIndex={stepIndex}
                                                    quizSteps={settings.quiz_steps}
                                                    onAnswer={handleAnswer}
                                                />
                                            )}

                                            {/* Recommendation results */}
                                            {msg.isResult && msg.recommended && (
                                                <RecommendationResult
                                                    products={msg.recommended}
                                                    hasShared={hasShared}
                                                    showPromoTooltip={showPromoTooltip}
                                                    onAddToCart={async (product) => {
                                                        addItem(product);
                                                        openSidebar();
                                                        setIsShrink(true);
                                                        const { user } = useAuthStore.getState();
                                                        if (user) {
                                                            await logBudTenderInteraction(user.id, {
                                                                interaction_type: 'click',
                                                                clicked_product: product.id,
                                                            });
                                                        }
                                                    }}
                                                    onFeedback={async (type) => {
                                                        const { user } = useAuthStore.getState();
                                                        if (user) {
                                                            await logBudTenderInteraction(user.id, { interaction_type: 'feedback', feedback: type });
                                                        }
                                                    }}
                                                    onShare={handleShare}
                                                    onCopyPromoCode={copyPromoCode}
                                                    onViewProduct={() => setIsShrink(true)}
                                                />
                                            )}
                                        </BudTenderMessage>
                                    ))}

                                    {isTyping && <BudTenderTypingIndicator />}

                                    {/* Welcome CTA */}
                                    {showStartButton && (globalSettings?.budtender_chat_enabled ?? true) && (
                                        <div className="flex justify-center py-10">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={startQuiz}
                                                className="bg-green-neon hover:bg-green-400 text-black font-black px-12 py-5 rounded-2xl text-base transition-all flex items-center gap-3 group shadow-2xl shadow-green-neon/20"
                                            >
                                                <Sparkles className="w-5 h-5" />
                                                Lancer mon diagnostic personnalisé
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                            </motion.button>
                                        </div>
                                    )}

                                    {/* Skip quiz / redo quiz actions */}
                                    {showSkipQuizActions && (
                                        <div className="flex justify-center gap-4 flex-wrap py-6">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={skipQuizAndRecommend}
                                                className="bg-green-neon hover:bg-green-400 text-black font-black px-8 py-4 rounded-2xl text-sm transition-all flex items-center gap-2 shadow-xl"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Recommandations rapides
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { memory.clearPrefs(); startQuiz(); }}
                                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-8 py-4 rounded-2xl text-sm transition-all flex items-center gap-2 border border-zinc-700"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Refaire le quiz
                                            </motion.button>
                                        </div>
                                    )}

                                    {/* Prompt to start quiz after restock cards (no saved prefs) */}
                                    {!isTyping
                                        && messages.some(m => m.type === 'restock')
                                        && !memory.savedPrefs
                                        && !messages.some(m => m.isOptions || m.isResult || m.type === 'skip-quiz')
                                        && (
                                            <div className="flex justify-center py-6">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={startQuiz}
                                                    className="bg-green-neon hover:bg-green-400 text-black font-black px-10 py-5 rounded-2xl text-base transition-all flex items-center gap-3 shadow-2xl shadow-green-neon/20"
                                                >
                                                    <Sparkles className="w-5 h-5" />
                                                    Découvrir mes nouvelles sélections
                                                </motion.button>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* ── Chat input bar ── */}
                            {(globalSettings?.budtender_chat_enabled ?? true) && (
                                <ChatInputBar
                                    value={chatInput}
                                    onChange={setChatInput}
                                    onSubmit={handleSendMessage}
                                    isTyping={isTyping}
                                />
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
