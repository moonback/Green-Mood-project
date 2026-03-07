import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, PhoneOff, Volume2, X, Radio, Headphones } from 'lucide-react';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from '../hooks/useBudTenderMemory';
import { useGeminiLiveVoice, VoiceState } from '../hooks/useGeminiLiveVoice';
import { useSettingsStore } from '../store/settingsStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
    products: Product[];
    pastProducts: PastProduct[];
    savedPrefs: SavedPrefs | null;
    userName: string | null;
    isOpen: boolean;
    onClose: () => void;
    onHangup?: () => void;
    onAddItem?: (product: Product, quantity: number) => void;
    onViewProduct?: (product: Product) => void;
    onNavigate?: (path: string) => void;
    showUI?: boolean;
    cartItems?: any[];
}

// ─── Status labels ───────────────────────────────────────────────────────────

const STATUS: Record<VoiceState, string> = {
    idle: 'Démarrage…',
    connecting: 'Connexion…',
    listening: 'À votre écoute',
    speaking: 'BudTender répond',
    error: 'Erreur',
};

const STATUS_COLOR: Record<VoiceState, string> = {
    idle: 'text-zinc-400',
    connecting: 'text-zinc-400',
    listening: 'text-green-400',
    speaking: 'text-green-neon',
    error: 'text-red-400',
};

// ─── Animated waveform bars ──────────────────────────────────────────────────

function WaveformBars({ active }: { active: boolean }) {
    const bars = [
        { delay: 0, maxH: 16 },
        { delay: 0.07, maxH: 24 },
        { delay: 0.14, maxH: 32 },
        { delay: 0.07, maxH: 24 },
        { delay: 0, maxH: 16 },
    ];

    if (!active) {
        return (
            <div className="flex items-center gap-[3px]">
                {bars.map((_, i) => (
                    <div key={i} className="w-[3px] h-[6px] bg-zinc-700 rounded-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-[3px]">
            {bars.map(({ delay, maxH }, i) => (
                <motion.div
                    key={i}
                    className="w-[3px] bg-gradient-to-t from-green-neon/60 to-green-neon rounded-full"
                    animate={{ height: ['4px', `${maxH}px`, '4px'] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

// ─── Central mic orb ────────────────────────────────────────────────────────

function MicOrb({ voiceState, isMuted }: { voiceState: VoiceState; isMuted: boolean }) {
    const isActive = voiceState === 'listening' || voiceState === 'speaking';
    const isListening = voiceState === 'listening';
    const isSpeaking = voiceState === 'speaking';

    return (
        <div className="relative flex items-center justify-center w-16 h-16">
            {/* Pulse rings when listening */}
            {isListening && !isMuted && (
                <>
                    <motion.div
                        className="absolute inset-0 rounded-full border border-green-neon/20"
                        animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-full border border-green-neon/15"
                        animate={{ scale: [1, 1.35], opacity: [0.3, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                    />
                </>
            )}

            {/* Orb background */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${voiceState === 'error'
                ? 'bg-red-500/10 border-2 border-red-500/30'
                : isSpeaking
                    ? 'bg-green-neon/15 border-2 border-green-neon/50 shadow-[0_0_24px_rgba(57,255,20,0.2)]'
                    : isListening
                        ? 'bg-green-neon/10 border-2 border-green-neon/30 shadow-[0_0_16px_rgba(57,255,20,0.12)]'
                        : 'bg-zinc-800/80 border-2 border-zinc-700/50'
                }`}>
                <AnimatePresence mode="wait">
                    {voiceState === 'connecting' && (
                        <motion.div
                            key="spinner"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-5 h-5 border-2 border-green-neon/30 border-t-green-neon rounded-full animate-spin"
                        />
                    )}
                    {isSpeaking && (
                        <motion.div key="vol" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            <Volume2 className="w-6 h-6 text-green-neon" />
                        </motion.div>
                    )}
                    {(isListening || voiceState === 'idle' || voiceState === 'error') && (
                        <motion.div key="mic" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            {isMuted
                                ? <MicOff className={`w-6 h-6 ${voiceState === 'error' ? 'text-red-400' : 'text-orange-400'}`} />
                                : <Mic className={`w-6 h-6 ${isActive ? 'text-green-neon' : voiceState === 'error' ? 'text-red-400' : 'text-zinc-400'}`} />
                            }
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function VoiceAdvisor({
    products, pastProducts, savedPrefs, userName,
    isOpen, onClose, onHangup, onAddItem, onViewProduct, onNavigate,
    showUI = true, cartItems = []
}: Props) {
    const { settings } = useSettingsStore();

    const { voiceState, error, isMuted, isSupported, compatibilityError, startSession, stopSession, toggleMute } =
        useGeminiLiveVoice({
            products,
            pastProducts,
            savedPrefs,
            userName,
            onAddItem,
            deliveryFee: settings.delivery_fee,
            deliveryFreeThreshold: settings.delivery_free_threshold,
            onCloseSession: onClose,
            onViewProduct,
            onNavigate,
            cartItems
        });

    // Auto-start ONCE when the panel opens — never on subsequent voiceState changes.
    // Without this guard, every time Gemini Live closes the WS cleanly (code 1000)
    // voiceState resets to 'idle' and this effect would restart the session in a loop.
    const hasAutoStartedRef = useRef(false);
    useEffect(() => {
        if (isOpen && isSupported) {
            if (!hasAutoStartedRef.current) {
                hasAutoStartedRef.current = true;
                const timer = setTimeout(() => startSession(), 400);
                return () => clearTimeout(timer);
            }
        } else {
            // Panel closed: reset so next open auto-starts fresh
            hasAutoStartedRef.current = false;
        }
    }, [isOpen, isSupported, startSession]);

    const isActive = voiceState === 'listening' || voiceState === 'speaking';

    const handleClose = () => {
        stopSession();
        onClose();
    };

    const handleHangup = () => {
        stopSession();
        onClose();
        if (onHangup) onHangup();
    };

    if (!showUI) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                /* ── Floating panel anchored bottom-right, site stays accessible ── */
                <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 24 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    /* Position: above the widget button (bottom-6 + widget ~72px = ~84px) and to its left */
                    className="fixed bottom-24 right-6 z-[99998] w-[320px] pointer-events-auto"
                    style={{ originX: 1, originY: 1 }}
                >
                    <div
                        className="relative rounded-3xl overflow-hidden border border-zinc-800/80"
                        style={{
                            background: 'rgba(9,9,11,0.96)',
                            backdropFilter: 'blur(32px)',
                            boxShadow: isActive
                                ? '0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(57,255,20,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
                                : '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
                        }}
                    >
                        {/* Subtle green top-border glow when active */}
                        {isActive && (
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-neon/30 to-transparent" />
                        )}

                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.04]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                                    <Headphones className="w-3.5 h-3.5 text-green-neon" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black text-white uppercase tracking-widest">
                                            Conseiller Vocal
                                        </span>
                                        <motion.span
                                            animate={isActive ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                                            transition={{ duration: 1.4, repeat: Infinity }}
                                            className="inline-flex items-center gap-1 text-[9px] bg-green-neon/10 text-green-neon px-1.5 py-0.5 rounded-full border border-green-neon/20 font-bold"
                                        >
                                            <Radio className="w-2 h-2" />
                                            LIVE
                                        </motion.span>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 font-medium mt-0.5">
                                        Gemini Live · Audio natif
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                aria-label="Fermer le conseiller vocal"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* ── Body ── */}
                        <div className="px-4 py-4 flex items-center gap-4">
                            {/* Orb */}
                            <MicOrb voiceState={voiceState} isMuted={isMuted} />

                            {/* Status + waveform */}
                            <div className="flex-1 min-w-0">
                                <motion.p
                                    key={voiceState}
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-sm font-bold leading-tight ${STATUS_COLOR[voiceState]}`}
                                >
                                    {STATUS[voiceState]}
                                </motion.p>
                                <p className="text-[11px] text-zinc-600 mt-1 truncate leading-snug" aria-live="polite">
                                    {compatibilityError || error || (
                                        voiceState === 'speaking' ? 'Analyse et réponse en cours…' :
                                            voiceState === 'listening' ? 'Parlez naturellement' :
                                                voiceState === 'connecting' ? 'Établissement connexion sécurisée…' :
                                                    voiceState === 'error' ? 'Appuyez sur Réessayer' :
                                                        'Votre conseiller IA est prêt'
                                    )}
                                </p>
                                <div className="mt-2.5">
                                    <WaveformBars active={voiceState === 'speaking'} />
                                </div>
                            </div>
                        </div>

                        {/* ── Controls ── */}
                        <div className="px-4 pb-4 flex items-center gap-2">
                            {/* Unsupported browser */}
                            {!isSupported && (
                                <div className="flex-1 text-[10px] text-zinc-500 text-center py-2">
                                    Navigateur non compatible · <button onClick={handleClose} className="underline text-zinc-400">Fermer</button>
                                </div>
                            )}

                            {/* Error → retry */}
                            {voiceState === 'error' && isSupported && (
                                <button
                                    type="button"
                                    onClick={startSession}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-neon to-emerald-400 text-black font-black text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] active:scale-[0.98] transition-all"
                                >
                                    🔄 Réessayer
                                </button>
                            )}

                            {/* Active controls: mute + hangup */}
                            {(isActive || voiceState === 'connecting') && isSupported && (
                                <>
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        disabled={voiceState === 'connecting'}
                                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40 ${isMuted
                                            ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                                            : 'bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:border-white/10 hover:text-zinc-300'
                                            }`}
                                        aria-label={isMuted ? 'Réactiver le micro' : 'Couper le micro'}
                                    >
                                        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                        {isMuted ? 'Activé' : 'Muet'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleHangup}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold bg-red-500/[0.06] border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                                        aria-label="Terminer la session vocale"
                                    >
                                        <PhoneOff className="w-3.5 h-3.5" />
                                        Raccrocher
                                    </button>
                                </>
                            )}

                            {/* Idle → start */}
                            {voiceState === 'idle' && isSupported && (
                                <button
                                    type="button"
                                    onClick={startSession}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-neon to-emerald-400 text-black font-black text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] active:scale-[0.98] transition-all"
                                >
                                    🎤 Démarrer
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
