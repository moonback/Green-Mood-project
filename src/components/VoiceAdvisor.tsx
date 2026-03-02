import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Mic, MicOff, PhoneOff, Volume2, X, MessageSquare, Radio, Headphones,
    RefreshCw, ShoppingCart, CheckCircle2, Clock,
} from 'lucide-react';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from '../hooks/useBudTenderMemory';
import { useGeminiLiveVoice, VoiceState, VoiceUtterance } from '../hooks/useGeminiLiveVoice';
import { useVoiceProductDetection } from '../hooks/useVoiceProductDetection';
import { useVoiceSummary, VoiceSessionSummary } from '../hooks/useVoiceSummary';
import { useVoiceEmotionDetection, EmotionState, EmotionIndicator } from '../hooks/useVoiceEmotionDetection';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
    products: Product[];
    pastProducts: PastProduct[];
    savedPrefs: SavedPrefs | null;
    userName: string | null;
    isOpen: boolean;
    onClose: () => void;
    onContinueInChat?: (context: VoiceUtterance[]) => void;
}

// ─── Status labels ───────────────────────────────────────────────────────────

const STATUS: Record<VoiceState, string> = {
    idle: 'Appuyez pour démarrer',
    connecting: 'Connexion en cours…',
    listening: 'Je vous écoute…',
    speaking: 'BudTender répond…',
    reconnecting: 'Reconnexion en cours…',
    error: 'Erreur de connexion',
};

const STATUS_SUB: Record<VoiceState, string> = {
    idle: 'Votre conseiller vocal IA est prêt',
    connecting: 'Établissement de la connexion sécurisée',
    listening: 'Parlez naturellement, je vous comprends',
    speaking: 'Analyse et réponse en cours…',
    reconnecting: 'Ne quittez pas, reconnexion automatique',
    error: 'Vérifiez votre connexion et réessayez',
};

// ─── Feature 1: Session Timer ─────────────────────────────────────────────────

function SessionTimer({ startTime }: { startTime: number }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] font-mono text-zinc-500 tabular-nums tracking-wider"
        >
            {minutes}:{seconds}
        </motion.span>
    );
}

// ─── Feature 2: Ambiance Background ──────────────────────────────────────────

function AmbianceBackground({ amplitude, isActive }: { amplitude: number; isActive: boolean }) {
    if (!isActive) return null;

    const intensity = 0.02 + amplitude * 0.08;
    const size = 400 + amplitude * 200;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
                className="absolute top-1/2 left-1/2 rounded-full"
                animate={{
                    width: size,
                    height: size,
                    opacity: intensity,
                    x: '-50%',
                    y: '-50%',
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ backgroundColor: '#39ff14', filter: `blur(${120 + amplitude * 60}px)` }}
            />
        </div>
    );
}

// ─── Feature 2: VU Meter ─────────────────────────────────────────────────────

function VUMeter({ amplitude, isListening }: { amplitude: number; isListening: boolean }) {
    if (!isListening) return null;

    const bars = 5;
    return (
        <div className="flex items-end gap-[3px] h-4">
            {Array.from({ length: bars }).map((_, i) => {
                const threshold = (i + 1) / bars;
                const active = amplitude >= threshold * 0.8;
                return (
                    <motion.div
                        key={i}
                        className="w-[3px] rounded-full"
                        animate={{
                            height: active ? `${8 + i * 3}px` : '3px',
                            backgroundColor: active ? '#39ff14' : 'rgba(255,255,255,0.1)',
                        }}
                        transition={{ duration: 0.08 }}
                    />
                );
            })}
        </div>
    );
}

// ─── Animated ring component ─────────────────────────────────────────────────

function PulseRing({ delay = 0, scale = 1.5 }: { delay?: number; scale?: number }) {
    return (
        <motion.div
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay }}
            className="absolute inset-0 rounded-full border border-green-neon/30"
        />
    );
}

// ─── Waveform bars (premium) ─────────────────────────────────────────────────

function WaveformBars() {
    const bars = [
        { delay: 0, maxH: 20 },
        { delay: 0.08, maxH: 32 },
        { delay: 0.15, maxH: 40 },
        { delay: 0.08, maxH: 32 },
        { delay: 0, maxH: 20 },
    ];

    return (
        <div className="flex items-center gap-[5px]">
            {bars.map(({ delay, maxH }, i) => (
                <motion.div
                    key={i}
                    className="w-[3px] bg-gradient-to-t from-green-neon/60 to-green-neon rounded-full"
                    animate={{ height: ['6px', `${maxH}px`, '6px'] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

// ─── Orbiting dots ───────────────────────────────────────────────────────────

function OrbitingDots() {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-[-8px]"
        >
            {[0, 120, 240].map((deg) => (
                <div
                    key={deg}
                    className="absolute w-1.5 h-1.5 bg-green-neon rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${deg}deg) translateY(-68px) translate(-50%, -50%)`,
                    }}
                />
            ))}
        </motion.div>
    );
}

// ─── Feature 3: Voice Product Card ───────────────────────────────────────────

function VoiceProductCard({ product, onDismiss }: { product: Product; onDismiss: () => void }) {
    const addItem = useCartStore(s => s.addItem);
    const addToast = useToastStore(s => s.addToast);

    const handleAddToCart = () => {
        addItem(product);
        addToast({ message: `${product.name} ajouté au panier`, type: 'success' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-zinc-900/95 backdrop-blur-md border border-green-neon/20 rounded-2xl p-3 w-56 shadow-[0_0_30px_rgba(57,255,20,0.05)]"
        >
            <div className="flex items-start gap-3">
                {product.image_url && (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-zinc-800 flex-shrink-0"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight">{product.name}</p>
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="p-0.5 text-zinc-600 hover:text-zinc-400 -mt-0.5 -mr-0.5 flex-shrink-0"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-green-neon">{product.price.toFixed(2)}€</span>
                        {product.cbd_percentage && (
                            <span className="text-[8px] bg-green-neon/10 text-green-neon/80 px-1.5 py-0.5 rounded-full font-bold">
                                CBD {product.cbd_percentage}%
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="mt-2.5 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-neon/10 border border-green-neon/30 text-green-neon text-[10px] font-bold hover:bg-green-neon/20 transition-all"
            >
                <ShoppingCart className="w-3 h-3" />
                Ajouter au panier
            </motion.button>
        </motion.div>
    );
}

// ─── Feature 4: Session Summary Panel ────────────────────────────────────────

function SessionSummaryPanel({
    summary,
    onContinueInChat,
    onDismiss,
}: {
    summary: VoiceSessionSummary;
    onContinueInChat?: () => void;
    onDismiss: () => void;
}) {
    const addToast = useToastStore(s => s.addToast);
    const addItem = useCartStore(s => s.addItem);

    const mins = Math.floor(summary.durationSeconds / 60);
    const secs = summary.durationSeconds % 60;

    const handleAddProduct = (p: Product) => {
        addItem(p);
        addToast({ message: `${p.name} ajouté au panier`, type: 'success' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative flex-1 overflow-y-auto px-5 py-6 space-y-5"
        >
            {/* Session stats header */}
            <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-neon" />
                </div>
                <h3 className="text-base font-black text-white">Session terminée</h3>
                <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {mins}m {String(secs).padStart(2, '0')}s
                    </span>
                    <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" /> {summary.utteranceCount} échanges
                    </span>
                </div>
            </div>

            {/* Mentioned products */}
            {summary.mentionedProducts.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1">
                        Produits recommandés
                    </p>
                    {summary.mentionedProducts.map(p => (
                        <div key={p.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                            {p.image_url && (
                                <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-800" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white line-clamp-1">{p.name}</p>
                                <p className="text-xs font-black text-green-neon">{p.price.toFixed(2)}€</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAddProduct(p)}
                                className="p-2 rounded-lg bg-green-neon/10 text-green-neon hover:bg-green-neon/20 transition-all flex-shrink-0"
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
                {onContinueInChat && (
                    <button
                        type="button"
                        onClick={onContinueInChat}
                        className="w-full py-3 rounded-2xl bg-green-neon/10 border border-green-neon/30 text-green-neon text-xs font-bold hover:bg-green-neon/20 transition-all flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Continuer en chat texte
                    </button>
                )}
                <button type="button" onClick={onDismiss} className="w-full py-2.5 text-zinc-600 text-[11px] font-bold hover:text-zinc-400 transition-all">
                    Fermer
                </button>
            </div>
        </motion.div>
    );
}

// ─── Feature 5: Emotion Badge ────────────────────────────────────────────────

const EMOTION_ICONS: Record<EmotionState, string> = {
    neutral: '',
    confident: '\uD83D\uDCAA',
    curious: '\uD83E\uDD14',
    hesitant: '\uD83D\uDCAD',
    enthusiastic: '\u2728',
};

const EMOTION_COLORS: Record<EmotionState, string> = {
    neutral: 'text-zinc-500 bg-zinc-800/50 border-zinc-700/30',
    confident: 'text-green-neon bg-green-neon/10 border-green-neon/20',
    curious: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    hesitant: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    enthusiastic: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

function EmotionBadge({ indicator }: { indicator: EmotionIndicator }) {
    if (indicator.emotion === 'neutral' || indicator.confidence < 0.3) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 4 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border ${EMOTION_COLORS[indicator.emotion]}`}
        >
            <span>{EMOTION_ICONS[indicator.emotion]}</span>
            <span>{indicator.message}</span>
        </motion.div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VoiceAdvisor({ products, pastProducts, savedPrefs, userName, isOpen, onClose, onContinueInChat }: Props) {
    const {
        voiceState, transcript, error, isMuted, isSupported, compatibilityError,
        startSession, stopSession, toggleMute,
        sessionStartTime, reconnectAttempt,
        outputAmplitude, inputAmplitude,
    } = useGeminiLiveVoice({ products, pastProducts, savedPrefs, userName });

    // Feature 3: Product detection
    const isActive = voiceState === 'listening' || voiceState === 'speaking';
    const { detectedProducts, dismissProduct } = useVoiceProductDetection(transcript, products, isActive);

    // Feature 4: Session summary
    const { summary, showSummary, generateSummary, dismissSummary } = useVoiceSummary();

    // Feature 5: Emotion detection
    const { currentEmotion } = useVoiceEmotionDetection(transcript, isActive);

    const handleClose = () => {
        stopSession();
        onClose();
    };

    const handleStopSession = () => {
        // Feature 4: Generate summary before stopping
        if (transcript.length > 0) {
            generateSummary(
                transcript,
                sessionStartTime,
                detectedProducts.map(d => d.product)
            );
        }
        stopSession();
    };

    const handleContinueInChat = () => {
        if (onContinueInChat && summary) {
            onContinueInChat(summary.fullTranscript);
        }
        dismissSummary();
        onClose();
    };

    const handleDismissSummary = () => {
        dismissSummary();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 z-20 flex flex-col overflow-hidden"
                >
                    {/* Layered background */}
                    <div className="absolute inset-0 bg-zinc-950/[0.98]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(57,255,20,0.03)_0%,_transparent_70%)]" />

                    {/* Feature 2: Audio-reactive ambiance */}
                    <AmbianceBackground amplitude={outputAmplitude} isActive={isActive || voiceState === 'reconnecting'} />

                    {/* ── Header ── */}
                    <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.04] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                                <Headphones className="w-4 h-4 text-green-neon" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                                    CONSEILLER VOCAL
                                    <motion.span
                                        animate={isActive ? { opacity: [1, 0.5, 1] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="text-[9px] bg-green-neon/10 text-green-neon px-2.5 py-0.5 rounded-full border border-green-neon/20 font-bold tracking-wider inline-flex items-center gap-1"
                                    >
                                        <Radio className="w-2.5 h-2.5" />
                                        LIVE
                                    </motion.span>
                                    {/* Feature 1: Session timer */}
                                    {sessionStartTime && (
                                        <SessionTimer startTime={sessionStartTime} />
                                    )}
                                </h3>
                                <p className="text-[10px] text-zinc-600 mt-0.5 font-medium">
                                    {voiceState === 'reconnecting'
                                        ? `Tentative ${reconnectAttempt}/3 — Ne quittez pas`
                                        : 'Gemini Live · Audio natif temps réel'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5"
                                aria-label="Fermer le conseiller vocal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Summary view (Feature 4) ── */}
                    {showSummary && summary && voiceState === 'idle' ? (
                        <SessionSummaryPanel
                            summary={summary}
                            onContinueInChat={onContinueInChat ? handleContinueInChat : undefined}
                            onDismiss={handleDismissSummary}
                        />
                    ) : (
                        <>
                            {/* ── Main voice area ── */}
                            <div className="relative flex-1 flex flex-col items-center justify-center gap-8 px-6 py-6">

                                {/* Feature 3: Product cards overlay — right side */}
                                <div className="absolute right-3 top-3 bottom-3 flex flex-col justify-end gap-2 pointer-events-auto z-10 overflow-y-auto max-w-[240px]">
                                    <AnimatePresence>
                                        {detectedProducts.map(({ product }) => (
                                            <VoiceProductCard
                                                key={product.id}
                                                product={product}
                                                onDismiss={() => dismissProduct(product.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Mic / state visualisation */}
                                <div className="relative flex items-center justify-center w-40 h-40">

                                    {/* Orbiting dots when active */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                key="orbit"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <OrbitingDots />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Pulsing rings when listening */}
                                    <AnimatePresence>
                                        {voiceState === 'listening' && (
                                            <>
                                                <PulseRing delay={0} scale={1.6} />
                                                <PulseRing delay={0.5} scale={1.35} />
                                                <PulseRing delay={1} scale={1.5} />
                                            </>
                                        )}
                                    </AnimatePresence>

                                    {/* Waveform when speaking */}
                                    <AnimatePresence>
                                        {voiceState === 'speaking' && (
                                            <motion.div
                                                key="wave"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="absolute"
                                            >
                                                <WaveformBars />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Outer glow ring */}
                                    <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isActive
                                        ? 'shadow-[0_0_60px_rgba(57,255,20,0.08),_inset_0_0_30px_rgba(57,255,20,0.03)]'
                                        : ''
                                        }`} />

                                    {/* Central button */}
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.92 }}
                                        whileHover={!isActive && voiceState !== 'connecting' && voiceState !== 'reconnecting' ? { scale: 1.05 } : {}}
                                        onClick={isActive || voiceState === 'connecting' || voiceState === 'reconnecting' || !isSupported ? undefined : startSession}
                                        disabled={voiceState === 'connecting' || voiceState === 'reconnecting' || !isSupported}
                                        aria-label={isActive ? 'Session active' : 'Démarrer la session vocale'}
                                        className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500
                                            ${voiceState === 'error'
                                                ? 'bg-gradient-to-br from-red-500/10 to-red-900/10 border-2 border-red-500/30 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
                                                : voiceState === 'reconnecting'
                                                    ? 'bg-gradient-to-br from-amber-500/10 to-amber-900/10 border-2 border-amber-500/30 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.1)] cursor-wait'
                                                    : isActive
                                                        ? 'bg-gradient-to-br from-green-neon/10 to-emerald-900/10 border-2 border-green-neon/40 text-green-neon shadow-[0_0_50px_rgba(57,255,20,0.12)]'
                                                        : voiceState === 'connecting'
                                                            ? 'bg-zinc-900/80 border-2 border-zinc-700/50 text-zinc-500 cursor-wait'
                                                            : 'bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border-2 border-zinc-700/50 text-zinc-400 hover:border-green-neon/30 hover:text-green-neon/80 cursor-pointer hover:shadow-[0_0_40px_rgba(57,255,20,0.08)]'
                                            }`}
                                    >
                                        {/* Inner ring glow */}
                                        {isActive && (
                                            <div className="absolute inset-[3px] rounded-full border border-green-neon/10" />
                                        )}

                                        <AnimatePresence mode="wait">
                                            {voiceState === 'connecting' && (
                                                <motion.div
                                                    key="spinner"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="w-8 h-8 border-2 border-green-neon/30 border-t-green-neon rounded-full animate-spin"
                                                />
                                            )}
                                            {/* Feature 1: Reconnecting state */}
                                            {voiceState === 'reconnecting' && (
                                                <motion.div key="reconnect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <RefreshCw className="w-8 h-8 animate-spin" />
                                                </motion.div>
                                            )}
                                            {voiceState === 'speaking' && (
                                                <motion.div key="vol" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                                    <Volume2 className="w-9 h-9" />
                                                </motion.div>
                                            )}
                                            {(voiceState === 'listening' || voiceState === 'idle' || voiceState === 'error') && (
                                                <motion.div key="mic" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                                    {isMuted ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                </div>

                                {/* Status text */}
                                <div className="text-center space-y-2">
                                    <motion.p
                                        key={voiceState}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`text-base font-bold tracking-tight ${voiceState === 'error' ? 'text-red-400'
                                            : voiceState === 'reconnecting' ? 'text-amber-400'
                                                : isActive ? 'text-white' : 'text-zinc-300'
                                            }`}
                                    >
                                        {STATUS[voiceState]}
                                    </motion.p>
                                    <p className="text-[11px] text-zinc-600 font-medium max-w-[260px] mx-auto leading-relaxed" aria-live="polite" aria-atomic="true">
                                        {error || compatibilityError || STATUS_SUB[voiceState]}
                                    </p>
                                </div>

                                {/* Feature 5: Emotion Badge */}
                                <AnimatePresence>
                                    {isActive && currentEmotion.emotion !== 'neutral' && (
                                        <EmotionBadge indicator={currentEmotion} />
                                    )}
                                </AnimatePresence>

                                {/* Active session controls */}
                                <AnimatePresence>
                                    {(isActive || voiceState === 'reconnecting') && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 12 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-center gap-3"
                                        >
                                            <button
                                                type="button"
                                                onClick={toggleMute}
                                                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 ${isMuted
                                                    ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.05)]'
                                                    : 'bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:border-white/10 hover:text-zinc-300'
                                                    }`}
                                                aria-label={isMuted ? 'Réactiver le micro' : 'Couper le micro'}
                                            >
                                                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                                {isMuted ? 'Micro coupé' : 'Couper le micro'}
                                                {/* Feature 2: VU Meter next to mute button */}
                                                {!isMuted && <VUMeter amplitude={inputAmplitude} isListening={voiceState === 'listening'} />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleStopSession}
                                                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold bg-red-500/[0.06] border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300"
                                                aria-label="Terminer la session vocale"
                                            >
                                                <PhoneOff className="w-3.5 h-3.5" />
                                                Raccrocher
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* ── Fallback when voice is unsupported ── */}
                            {!isSupported && (
                                <div className="relative px-5 pb-5 pt-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="w-full py-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 font-black text-sm uppercase tracking-wider hover:bg-zinc-700/80 transition-all duration-300"
                                    >
                                        Continuer en chat texte
                                    </button>
                                    <p className="text-[10px] text-zinc-600 text-center mt-3 font-medium">
                                        Votre navigateur ne supporte pas toutes les APIs vocales nécessaires.
                                    </p>
                                </div>
                            )}

                            {/* ── Start / retry button ── */}
                            <AnimatePresence>
                                {(voiceState === 'idle' || voiceState === 'error') && isSupported && !showSummary && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="relative px-5 pb-5 pt-2 shrink-0"
                                    >
                                        <button
                                            type="button"
                                            onClick={startSession}
                                            className="group w-full py-4 rounded-2xl bg-gradient-to-r from-green-neon to-emerald-400 text-black font-black text-sm uppercase tracking-wider hover:shadow-[0_0_40px_rgba(57,255,20,0.25)] active:scale-[0.98] transition-all duration-300 relative overflow-hidden"
                                        >
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            <span className="relative">
                                                {voiceState === 'error' ? 'Réessayer la connexion' : 'Démarrer la session vocale'}
                                            </span>
                                        </button>
                                        <p className="text-[10px] text-zinc-600 text-center mt-3 font-medium flex items-center justify-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-green-neon/40" />
                                            Microphone requis · Connexion directe sécurisée
                                            <span className="w-1 h-1 rounded-full bg-green-neon/40" />
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
