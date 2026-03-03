import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Leaf, Mic, RefreshCw, ShoppingCart, ChevronRight, Sparkles, RotateCcw, Clock, CheckCircle2, Share2, Copy, Gift, SendHorizontal, History, ArrowLeft, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { getQuizPrompt, getChatPrompt, QuizAnswers } from '../lib/budtenderPrompts';
import { getBudTenderSettings, BudTenderSettings, BUDTENDER_DEFAULTS, QuizStep, QuizOption } from '../lib/budtenderSettings';
import { getCachedProducts, getCachedSettings } from '../lib/budtenderCache';
import { useCartStore } from '../store/cartStore';
import { useBudTenderMemory, SavedPrefs } from '../hooks/useBudTenderMemory';
import { CATEGORY_SLUGS } from '../lib/constants';
import { BudTenderWidget, BudTenderMessage, BudTenderTypingIndicator, BudTenderFeedback } from './budtender-ui';
import VoiceAdvisor from './VoiceAdvisor';
import { generateEmbedding } from '../lib/embeddings';
import { useAuthStore } from '../store/authStore';

// ─── Shared types and logic imported ───

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
        if (cat === CATEGORY_SLUGS.OILS && (product.cbd_percentage ?? 0) >= 15) score += 3;
        if (cat === CATEGORY_SLUGS.INFUSIONS) score += 2;
    }
    if (answers.goal === 'stress') {
        if (desc.includes('détente') || desc.includes('stress') || desc.includes('relaxat')) score += 5;
        if (cat === CATEGORY_SLUGS.INFUSIONS) score += 3;
        if (cat === CATEGORY_SLUGS.OILS) score += 2;
    }
    if (answers.goal === 'pain') {
        if ((product.cbd_percentage ?? 0) >= 20) score += 5;
        if (cat === CATEGORY_SLUGS.OILS) score += 3;
        if (desc.includes('douleur') || desc.includes('récupér')) score += 4;
    }
    if (answers.goal === 'wellness') {
        if (product.is_featured) score += 3;
        score += 1;
    }

    if (answers.experience === 'beginner') {
        if ((product.cbd_percentage ?? 0) <= 10) score += 3;
        if (cat === CATEGORY_SLUGS.INFUSIONS) score += 2;
        if (product.is_bundle) score += 2;
    }
    if (answers.experience === 'expert') {
        if ((product.cbd_percentage ?? 0) >= 20) score += 3;
    }

    if (answers.format === 'oil' && cat === CATEGORY_SLUGS.OILS) score += 4;
    if (answers.format === 'flower' && (cat === CATEGORY_SLUGS.FLOWERS || cat === CATEGORY_SLUGS.RESINS)) score += 4;
    if (answers.format === 'infusion' && cat === CATEGORY_SLUGS.INFUSIONS) score += 4;
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

async function callAI(
    answers: Answers,
    products: Product[],
    settings: BudTenderSettings,
    history: { role: string; content: string }[] = [],
    context?: string
): Promise<string | null> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey || !settings.ai_enabled) return null;

    // RAG: Select the most relevant products to send to the AI
    // For the quiz, we send the top scored locally + some featured ones
    const topScored = [...products]
        .map(p => ({ p, s: scoreProduct(p, answers) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 15);

    const catalog = topScored
        .map(({ p }) => {
            const aromas = (p.attributes?.aromas ?? []).join(', ');
            const benefits = (p.attributes?.benefits ?? []).join(', ');
            return `- ${p.name} (${p.category?.slug}, CBD ${p.cbd_percentage ?? '?'}%, ${p.price}€). ${p.description ?? ''} ${aromas ? 'Arômes: ' + aromas : ''} ${benefits ? 'Effets: ' + benefits : ''}`;
        })
        .join('\n');

    const systemPromptMessage = {
        role: 'system',
        content: getQuizPrompt(answers, settings.quiz_steps, catalog, context)
    };

    const messages = [
        systemPromptMessage,
        ...history
    ];

    // Ensure the last message is from the user if we're asking for final advice
    if (messages[messages.length - 1].role !== 'user') {
        messages.push({ role: 'user', content: "Basé sur mes réponses et notre échange, donne-moi tes conseils finaux." });
    }

    const modelToUse = settings.ai_model || 'google/gemini-2.0-flash-lite-preview-02-05:free';

    console.log('[BudTender callAI] Model:', modelToUse);

    try {
        const res = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Title': 'Green Moon BudTender',
                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
                },
                body: JSON.stringify({
                    model: modelToUse,
                    messages,
                    temperature: settings.ai_temperature,
                    max_tokens: settings.ai_max_tokens,
                }),
            }
        );

        const json = await res.json();

        if (!res.ok) {
            console.error('[BudTender callAI] API Error:', json);
            return null;
        }

        return json?.choices?.[0]?.message?.content ?? null;
    } catch (err) {
        console.error('[BudTender callAI] Fetch Error:', err);
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

// ─── Header components ───────────────────────────────────────────────────────

function HeaderAction({ icon, title, onClick, isActive, label }: { icon: React.ReactNode; title: string; onClick: () => void; isActive?: boolean; label: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`
                flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all group
                ${isActive ? 'bg-green-neon text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'}
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
    const navigate = useNavigate();
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
    // Ambassador state
    const [hasShared, setHasShared] = useState(false);
    const [showPromoTooltip, setShowPromoTooltip] = useState(false);
    // Free chat input
    const [chatInput, setChatInput] = useState('');
    const [settings, setSettings] = useState<BudTenderSettings>(BUDTENDER_DEFAULTS);
    // Voice advisor overlay
    const [isVoiceOpen, setIsVoiceOpen] = useState(false);
    // Shrink state for "viewing product"
    const [isShrink, setIsShrink] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const addItem = useCartStore((s) => s.addItem);
    const openSidebar = useCartStore((s) => s.openSidebar);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasTriedLoad = useRef(false);

    const memory = useBudTenderMemory();
    const { logQuestion } = memory;

    // Load admin settings from DB when opening (cached)
    useEffect(() => {
        if (isOpen) {
            getCachedSettings().then(setSettings);
        }
    }, [isOpen]);

    // Initial product load (cached)
    useEffect(() => {
        getCachedProducts().then(setProducts);

        // Use delay from settings
        const currentSettings = getBudTenderSettings();
        if (currentSettings.pulse_delay > 0) {
            const t = setTimeout(() => setPulse(true), currentSettings.pulse_delay * 1000);
            return () => clearTimeout(t);
        }
    }, []);

    // Auto-scroll AND Save chat history to local memory
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        // Save current messages to persistent storage
        if (messages.length > 0) {
            memory.saveChatHistory(messages as any);
        }
    }, [messages, isTyping]);

    // Load persisted chat history on mount (only once)
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

        // Use speed from settings
        let baseDelay = 1000;
        if (settings.typing_speed === 'fast') baseDelay = 400;
        if (settings.typing_speed === 'slow') baseDelay = 2000;

        const ms = delay ?? (baseDelay + Math.random() * (baseDelay / 2));
        setTimeout(() => {
            setMessages((prev) => [...prev, {
                id: Math.random().toString(36).substring(7),
                sender: 'bot',
                ...msg
            }]);
            setIsTyping(false);
        }, ms);
    }, [settings.typing_speed]);

    const addUserMessage = useCallback((text: string) => {
        setMessages((prev) => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'user',
            text,
        }]);
    }, []);

    // ── Welcome flow ─────────────────────────────────────────────────────────

    const buildWelcomeMessages = () => {
        const { isLoggedIn, userName, pastProducts, restockCandidates, savedPrefs } = memory;
        const cartItems = useCartStore.getState().items;
        const currentPath = window.location.pathname;

        // 1) Greeting
        let greeting: string;
        if (!isLoggedIn) {
            greeting = settings.welcome_message;
        } else if (pastProducts.length > 0) {
            const last = pastProducts[0];
            greeting = `Content de te revoir${userName ? `, ${userName}` : ''} ! 👋 La dernière fois tu avais commandé **${last.product_name}** — tu l'as apprécié ? Je suis là pour te trouver quelque chose d'encore mieux.`;
        } else {
            greeting = `Bienvenue${userName ? `, ${userName}` : ''} ! 🌿 Je suis BudTender, votre conseiller CBD de confiance chez Green Moon. Prêt à découvrir votre sélection idéale ?`;
        }

        // Push greeting first
        addBotMessage({ text: greeting }, 600);

        // 2) Proactive Recommendations (Task 15)
        setTimeout(() => {
            if (cartItems.length === 0 && currentPath.includes('/catalogue')) {
                addBotMessage({
                    text: "Je vois que votre panier est encore vide ! 🛒 Souhaitez-vous que je vous guide vers nos best-sellers du moment ?",
                    isOptions: true,
                    stepId: 'proactive',
                    options: [{ label: "Oui, conseiller moi ✨", value: "start_quiz", emoji: "✨" }, { label: "Plus tard", value: "later", emoji: "⏳" }]
                }, 400);
            } else if (currentPath.includes('/catalogue/') && cartItems.length > 0) {
                addBotMessage({
                    text: "Excellent choix ! 🌿 Saviez-vous que ce produit se marie parfaitement avec l'une de nos huiles sublinguales pour un effet renforcé ?",
                    isOptions: true,
                    stepId: 'proactive',
                    options: [{ label: "En savoir plus", value: "upsell_info", emoji: "💡" }, { label: "Non merci", value: "later", emoji: "✖️" }]
                }, 400);
            }
        }, 1200);

        // 3) Restock reminders (delayed, one per candidate)
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

        // 4) Skip-quiz option if saved prefs exist
        if (savedPrefs) {
            const delay = 2000 + restockCandidates.length * 600 + 400;
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
        setIsShrink(false);
        if (messages.length === 0) {
            buildWelcomeMessages();
        }
    };

    // ── Quiz flow ────────────────────────────────────────────────────────────

    const startQuiz = () => {
        setStepIndex(0);
        const firstStep = settings.quiz_steps[0];
        if (firstStep) {
            addBotMessage({
                text: firstStep.question,
                isOptions: true,
                options: firstStep.options,
                stepId: firstStep.id,
            });
        }
    };

    const skipQuizAndRecommend = async () => {
        if (!memory.savedPrefs) return;
        addBotMessage({ text: "✨ **Recherche en cours...** Je me base sur vos préférences habituelles pour vous proposer le meilleur du catalogue." }, 200);
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

        // ── Proactive Actions (Task 15) ──
        if (option.value === 'start_quiz') {
            startQuiz();
            return;
        }
        if (option.value === 'upsell_info') {
            // Context-aware recommendation
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

        if (nextIndex < settings.quiz_steps.length) {
            setStepIndex(nextIndex);
            const nextStep = settings.quiz_steps[nextIndex];
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
        const nextStep = settings.quiz_steps[stepIndex];
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
            .slice(0, settings.recommendations_count)
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

        const history = messages
            .filter(m => m.text && !m.isResult)
            .map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant' as any,
                content: m.text || ''
            }));

        const aiText = await callAI(finalAnswers, products, settings, history, geminiContext);
        const adviceText = aiText ?? generateAdvice(finalAnswers, terpeneSelection);

        setMessages((prev) => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: adviceText,
            isResult: true,
            recommended: scored,
        }]);

        // Log recommendation to DB
        const { user } = useAuthStore.getState();
        if (user && scored.length > 0) {
            try {
                const { error } = await supabase.from('budtender_interactions').insert({
                    user_id: user.id,
                    interaction_type: 'recommendation',
                    recommended_products: scored.map(p => p.id),
                    quiz_answers: finalAnswers,
                    created_at: new Date().toISOString()
                });
                if (error) console.error('[BudTender] Recommendation log error:', error);
            } catch (err) {
                console.error('[BudTender] Recommendation log exception:', err);
            }
        }

        setIsTyping(false);
    };

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
            title: 'Green Moon CBD — Mon diagnostic BudTender',
            text: 'Je viens de faire mon diagnostic CBD avec BudTender IA Chez Green Moon ! Découvrez vos produits idéaux ici :',
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

    const handleSendMessage = async (e?: React.FormEvent) => {
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

        // ─── RAG: Vector Search First ──────────────────────────────────────────────
        let relevantProducts: Product[] = [];
        try {
            console.log('[BudTender RAG] Semantic search for:', text);
            const embedding = await generateEmbedding(text);
            const { data, error: rpcError } = await supabase.rpc('match_products', {
                query_embedding: embedding,
                match_threshold: 0.1,
                match_count: 10
            });

            if (rpcError) throw rpcError;
            if (data && data.length > 0) {
                relevantProducts = data;
                console.log(`[BudTender RAG] Found ${data.length} semantic matches.`);
            }
        } catch (err) {
            console.warn('[BudTender RAG] Vector search failed, falling back to keywords:', err);
            // Fallback: Basic keyword matching
            const keywords = text.toLowerCase().split(' ').filter(k => k.length > 3);
            relevantProducts = products
                .map(p => {
                    let s = 0;
                    const pName = p.name.toLowerCase();
                    const pDesc = (p.description || '').toLowerCase();
                    const pCat = (p.category?.name || '').toLowerCase();
                    keywords.forEach(k => {
                        if (pName.includes(k)) s += 5;
                        if (pDesc.includes(k)) s += 2;
                        if (pCat.includes(k)) s += 3;
                    });
                    return { p, s };
                })
                .sort((a, b) => b.s - a.s)
                .filter(x => x.s > 0)
                .slice(0, 10)
                .map(x => x.p);
        }

        // If still empty, add some featured ones for context
        if (relevantProducts.length === 0) {
            relevantProducts = products.filter(p => p.is_featured).slice(0, 5);
        }

        const catalog = relevantProducts
            .map((p) => {
                const aromas = (p.attributes?.aromas ?? []).join(', ');
                const benefits = (p.attributes?.benefits ?? []).join(', ');
                return `- ${p.name} (${p.category?.slug}, ${p.price}€). ${p.description ?? ''} ${aromas ? 'Arômes: ' + aromas : ''} ${benefits ? 'Effets: ' + benefits : ''}`;
            })
            .join('\n');

        // Build user context from memory
        const { savedPrefs, userName, pastProducts } = memory;
        let userContext = '';
        if (userName) userContext += `Nom du client: ${userName}\n`;
        if (pastProducts.length > 0) {
            userContext += `Historique d'achats: ${pastProducts.slice(0, 3).map(p => p.product_name).join(', ')}\n`;
        }
        if (savedPrefs) {
            const { goal, experience, format, budget, age, intensity, terpenes, ...others } = savedPrefs;
            const entries = [
                `Objectif: ${goal}`,
                `Expérience: ${experience}`,
                `Format: ${format}`,
                `Budget: ${budget}`,
                `Âge: ${age || 'Non précisé'}`,
                `Intensité: ${intensity || 'Non précisé'}`,
                `Terpènes: ${Array.isArray(terpenes) ? terpenes.join(', ') : 'Aucun'}`
            ];
            Object.entries(others).forEach(([k, v]) => { if (v) entries.push(`${k}: ${v}`); });
            userContext += `Préférences: ${entries.join(' | ')}`;
        }

        const systemPrompt = getChatPrompt(text, catalog, userContext);

        // Build history for OpenRouter (OpenAI format)
        // IMPORTANT: Roles must alternate and not be empty
        const history: { role: 'user' | 'assistant'; content: string }[] = [];
        messages
            .filter(m => m.text && !m.isResult)
            .forEach(m => {
                const role = m.sender === 'user' ? 'user' : 'assistant';
                // Avoid consecutive roles if possible (not strictly required but safer)
                if (history.length > 0 && history[history.length - 1].role === role) {
                    history[history.length - 1].content += "\n" + m.text;
                } else {
                    history.push({ role, content: m.text || '' });
                }
            });

        const messagesForAI = [
            { role: 'system', content: systemPrompt },
            ...history
        ];

        // Ensure the last developer-injected message is the current user text if not already there
        if (messagesForAI[messagesForAI.length - 1].role !== 'user') {
            messagesForAI.push({ role: 'user', content: text });
        }

        const modelToUse = settings.ai_model || 'google/gemini-2.0-flash-lite-preview-02-05:free';

        console.log('[BudTender Chat] Sending messages to:', modelToUse);

        try {
            const res = await fetch(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'X-Title': 'Green Moon BudTender',
                        // OpenRouter suggests including the referrer
                        'HTTP-Referer': window.location.origin,
                    },
                    body: JSON.stringify({
                        model: modelToUse,
                        messages: messagesForAI,
                        temperature: settings.ai_temperature,
                        max_tokens: settings.ai_max_tokens,
                    }),
                }
            );

            if (res.status === 429) {
                addBotMessage({ text: "Désolé, je reçois trop de messages en ce moment (limite OpenRouter). Pourriez-vous patienter une minute ? 🙏" });
                return;
            }

            const json = await res.json();

            if (!res.ok) {
                const errDetail = json.error?.message || json.error?.code || 'Inconnue';
                console.error('OpenRouter Detailed Error:', json);
                addBotMessage({ text: `Erreur OpenRouter (${res.status}) : ${errDetail}` });
                return;
            }

            const responseText = json?.choices?.[0]?.message?.content;

            if (!responseText) {
                console.error("OpenRouter empty response:", json);
                addBotMessage({ text: "Je n'ai pas pu analyser votre message correctement. Pouvez-vous reformuler ?" });
                return;
            }

            setMessages((prev) => [...prev, {
                id: Math.random().toString(36).substring(7),
                sender: 'bot',
                text: responseText,
            }]);
        } catch (err) {
            console.error('OpenRouter handleSendMessage error:', err);
            addBotMessage({ text: "Oups, j'ai eu une petite déconnexion. Pouvez-vous réessayer ?" });
        } finally {
            setIsTyping(false);
        }
    };

    // ─── Render helpers ─────────────────────────────────────────────────────

    // Determines if the welcome CTA (start quiz button) should be visible
    const showStartButton = stepIndex === -1 && !isTyping
        && messages.length > 0
        && !messages.some(m => m.type === 'skip-quiz' || m.type === 'restock' || m.isOptions || settings.quiz_steps.some(s => s.question === m.text));

    const showSkipQuizActions = messages.some(m => m.type === 'skip-quiz')
        && stepIndex === -1
        && !isTyping
        && !messages.some(m => m.isOptions || m.isResult);

    return (
        <>
            {/* ── Floating button / Expand button ── */}
            <AnimatePresence>
                {isOpen && !isShrink ? null : settings.enabled && (
                    <BudTenderWidget
                        onClick={() => {
                            if (isShrink) {
                                setIsShrink(false);
                            } else {
                                setIsOpen(true);
                            }
                        }}
                        onVoiceClick={() => {
                            if (isVoiceOpen) {
                                setIsVoiceOpen(false);
                            } else {
                                setIsVoiceOpen(true);
                                // Start in background
                            }
                        }}
                        isVoiceActive={isVoiceOpen}
                        pulse={pulse}
                        mode={isShrink ? 'expand' : 'default'}
                    />
                )}
            </AnimatePresence>

            {/* ── Chat panel ── */}
            <VoiceAdvisor
                products={products}
                pastProducts={memory.pastProducts}
                savedPrefs={memory.savedPrefs}
                userName={memory.userName}
                isOpen={isVoiceOpen}
                onClose={() => {
                    setIsVoiceOpen(false);
                    setIsShrink(false);
                }}
                onHangup={() => setIsShrink(true)}
                onAddItem={(product, quantity) => {
                    addItem(product, quantity);
                    openSidebar();
                    setIsShrink(true);
                }}
                onViewProduct={(product) => {
                    navigate(`/catalogue/${product.slug}`);
                    setIsShrink(true);
                }}
                onNavigate={(path) => {
                    navigate(path);
                    setIsShrink(false); // Reset shrink when changing page
                }}
                showUI={isOpen}
            />

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={isShrink ? {
                                opacity: 0,
                                scale: 0.8,
                                y: 100,
                                pointerEvents: 'none'
                            } : {
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                pointerEvents: 'auto'
                            }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="fixed inset-0 z-[9999] bg-zinc-950/98 backdrop-blur-3xl flex flex-col overflow-hidden origin-bottom-right"
                        >
                            {/* Header */}
                            <div className="relative z-40 px-6 py-6 sm:py-8 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl">
                                <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-6">

                                    {/* Left: Branding & Status */}
                                    <div className="flex items-center gap-5">
                                        <div className="relative group">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center transition-all group-hover:border-green-neon/40 shadow-2xl overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-green-neon/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <Leaf className="w-6 h-6 sm:w-7 sm:h-7 text-green-neon transition-transform group-hover:scale-110" />
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

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="h-10 w-[1px] bg-white/5 mx-2 hidden sm:block" />

                                        <HeaderAction
                                            icon={<Mic className="w-5 h-5" />}
                                            title="Conseiller vocal (Gemini Live)"
                                            onClick={() => setIsVoiceOpen(true)}
                                            label="Voix"
                                        />

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



                            {/* ── History Panel (Overlay) ── */}
                            <AnimatePresence mode="wait">
                                {isHistoryOpen && (
                                    <motion.div
                                        initial={{ x: '100%', opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: '100%', opacity: 0 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                        className="absolute inset-0 z-30 bg-zinc-950 flex flex-col"
                                    >
                                        <div className="flex items-center gap-4 px-6 py-6 border-b border-white/5 bg-zinc-900/50">
                                            <button
                                                onClick={() => setIsHistoryOpen(false)}
                                                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <h3 className="text-xl font-black text-white tracking-tight">HISTORIQUE DES CHATS</h3>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-zinc-950 to-zinc-900">
                                            {!memory.isLoggedIn ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                                                        <History className="w-8 h-8 text-zinc-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-lg">Connectez-vous</p>
                                                        <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-1">L'historique des conversations est réservé aux membres de Green Moon.</p>
                                                    </div>
                                                </div>
                                            ) : memory.isHistoryLoading ? (
                                                <div className="space-y-4">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse border border-white/5" />
                                                    ))}
                                                </div>
                                            ) : memory.allChatSessions.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                                                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                        <History className="w-8 h-8 text-zinc-800" />
                                                    </div>
                                                    <p className="text-zinc-400 font-medium">Aucune conversation trouvée.</p>
                                                </div>
                                            ) : (
                                                memory.allChatSessions.map((session) => (
                                                    <motion.button
                                                        key={session.id}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        onClick={() => {
                                                            setMessages(session.messages as any);
                                                            setIsHistoryOpen(false);
                                                        }}
                                                        className="w-full text-left bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 hover:border-green-neon/30 p-5 rounded-2xl transition-all group shadow-lg"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Calendar className="w-3 h-3 text-green-neon" />
                                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-zinc-400">
                                                                        {new Date(session.created_at).toLocaleDateString('fr-FR', {
                                                                            day: 'numeric',
                                                                            month: 'long',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-bold text-white line-clamp-2 group-hover:text-green-neon transition-colors leading-relaxed">
                                                                    {session.title || "Conseil Wellness personnalisé"}
                                                                </p>
                                                                <div className="mt-3 flex items-center gap-4 text-[11px] text-zinc-500 font-medium">
                                                                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                                                        <Leaf className="w-3 h-3 text-green-neon" />
                                                                        {session.messages.length} messages
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="w-10 h-10 rounded-xl bg-green-neon/5 border border-green-neon/10 flex items-center justify-center group-hover:bg-green-neon group-hover:text-black transition-all flex-shrink-0">
                                                                <ChevronRight className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Messages area */}
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
                                                                if (p) {
                                                                    addItem(p);
                                                                    openSidebar();
                                                                    setIsShrink(true);
                                                                }
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 bg-green-neon hover:bg-green-400 text-black font-black text-xs py-2.5 rounded-xl transition-all"
                                                        >
                                                            <ShoppingCart className="w-3.5 h-3.5" />
                                                            Réapprovisionner
                                                        </motion.button>
                                                        <Link
                                                            to={`/catalogue/${msg.restockProduct.slug}`}
                                                            onClick={() => setIsShrink(true)}
                                                            className="px-3 py-2.5 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center"
                                                        >
                                                            Voir
                                                        </Link>
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
                                                                disabled={stepIndex !== settings.quiz_steps.findIndex(s => s.id === msg.stepId)}
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
                                                                <Link
                                                                    to={`/catalogue/${product.slug}`}
                                                                    onClick={() => setIsShrink(true)}
                                                                    className="text-sm font-bold text-white hover:text-green-neon line-clamp-1"
                                                                >
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
                                                                onClick={async () => {
                                                                    addItem(product);
                                                                    openSidebar();
                                                                    setIsShrink(true);
                                                                    const { user } = useAuthStore.getState();
                                                                    if (user) {
                                                                        try {
                                                                            const { error } = await supabase.from('budtender_interactions').insert({
                                                                                user_id: user.id,
                                                                                interaction_type: 'click',
                                                                                clicked_product: product.id,
                                                                                created_at: new Date().toISOString()
                                                                            });
                                                                            if (error) console.error('[BudTender] Click log error:', error);
                                                                        } catch (err) {
                                                                            console.error('[BudTender] Click log exception:', err);
                                                                        }
                                                                    }
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-green-neon hover:bg-green-400 text-black flex items-center justify-center transition-all shadow-lg hover:shadow-green-neon/20"
                                                            >
                                                                <ShoppingCart className="w-4 h-4" />
                                                            </motion.button>
                                                        </motion.div>
                                                    ))}

                                                    {/* ── Feedback on recommendations ── */}
                                                    <BudTenderFeedback
                                                        onFeedback={async (type) => {
                                                            const { user } = useAuthStore.getState();
                                                            if (user) {
                                                                try {
                                                                    const { error } = await supabase.from('budtender_interactions').insert({
                                                                        user_id: user.id,
                                                                        interaction_type: 'feedback',
                                                                        feedback: type,
                                                                        created_at: new Date().toISOString()
                                                                    });
                                                                    if (error) console.error('[BudTender] Feedback log error:', error);
                                                                } catch (err) {
                                                                    console.error('[BudTender] Feedback log exception:', err);
                                                                }
                                                            }
                                                        }}
                                                    />

                                                    {/* ── Ambassador / Share section ── */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.8 }}
                                                        className="mt-6 bg-gradient-to-br from-green-neon/10 to-transparent border border-green-neon/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                                            <Gift className="w-12 h-12 text-green-neon" />
                                                        </div>

                                                        {!hasShared ? (
                                                            <div className="space-y-3 relative z-10">
                                                                <div className="flex items-center gap-2">
                                                                    <Sparkles className="w-4 h-4 text-green-neon" />
                                                                    <p className="text-xs font-black uppercase tracking-wider text-white">Cadeau Ambassadeur 🏆</p>
                                                                </div>
                                                                <p className="text-xs text-zinc-400 leading-relaxed">
                                                                    Partagez vos résultats ou invitez un ami à faire le test pour débloquer un code promo de <span className="text-green-neon font-bold">-10%</span> sur votre commande !
                                                                </p>
                                                                <button
                                                                    onClick={handleShare}
                                                                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs border border-zinc-700"
                                                                >
                                                                    <Share2 className="w-3.5 h-3.5" />
                                                                    Partager & Débloquer
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4 relative z-10">
                                                                <div className="flex items-center gap-2 text-green-neon">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    <p className="text-xs font-black uppercase tracking-wider">Lien Partagé !</p>
                                                                </div>
                                                                <div className="bg-zinc-950/50 border border-green-neon/30 rounded-xl p-3 flex items-center justify-between group">
                                                                    <div>
                                                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Votre code :</p>
                                                                        <p className="text-lg font-black text-green-neon tracking-tighter">BUDTENDER10</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => copyPromoCode('BUDTENDER10')}
                                                                        className="relative p-2 bg-green-neon/10 hover:bg-green-neon text-green-neon hover:text-black rounded-lg transition-all"
                                                                    >
                                                                        <Copy className="w-4 h-4" />
                                                                        {showPromoTooltip && (
                                                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap shadow-xl">
                                                                                Copié !
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                <p className="text-[10px] text-zinc-500 text-center italic">Valable sur tout le catalogue Green Moon.</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                </div>
                                            )}
                                        </BudTenderMessage>
                                    ))}

                                    {/* Typing indicator */}
                                    {isTyping && <BudTenderTypingIndicator />}

                                    {/* ── Welcome CTA ── */}
                                    {showStartButton && (
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

                                    {/* ── Skip quiz actions ── */}
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

                                    {/* ── After restock cards but no saved prefs: show start quiz ── */}
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

                            {/* ── Chat Input Bar ── */}
                            <div className="p-6 sm:p-10 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-3xl shrink-0">
                                <div className="max-w-7xl mx-auto w-full space-y-4">
                                    <form
                                        onSubmit={handleSendMessage}
                                        className="flex items-center gap-3 bg-zinc-900 border-2 border-zinc-700 rounded-[2rem] p-2 focus-within:border-green-neon transition-all shadow-2xl"
                                    >
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Posez votre question à l'IA ou décrivez vos besoins..."
                                            className="flex-1 bg-transparent border-none text-base text-white px-5 py-3 focus:outline-none placeholder:text-zinc-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!chatInput.trim() || isTyping}
                                            className="w-12 h-12 flex items-center justify-center rounded-full bg-green-neon text-black disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-neon/40"
                                        >
                                            <SendHorizontal className="w-6 h-6" />
                                        </button>
                                    </form>
                                    <div className="flex justify-center items-center px-1">
                                        <p className="text-[10px] text-green-neon font-black uppercase tracking-[0.4em] opacity-80">
                                            BudTender IA Expérience
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence >
        </>
    );
}
