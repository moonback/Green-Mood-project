import { useEffect, useRef, useState } from 'react';
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
}

// ─── Status labels ───────────────────────────────────────────────────────────

const STATUS: Record<VoiceState, string> = {
    idle: 'Démarrage du chat vocal…',
    connecting: 'Connexion en cours…',
    listening: 'Je vous écoute…',
    speaking: 'BudTender répond…',
    error: 'Erreur de connexion',
};

const STATUS_SUB: Record<VoiceState, string> = {
    idle: 'Votre conseiller vocal IA est prêt',
    connecting: 'Établissement de la connexion sécurisée',
    listening: 'Parlez naturellement, je vous comprends',
    speaking: 'Analyse et réponse en cours…',
    error: 'Vérifiez votre connexion et réessayez',
};

// ─── Animated ring component ─────────────────────────────────────────────────

function PulseRing({ delay = 0, scale = 1.5, color = 'green-neon' }: { delay?: number; scale?: number; color?: string }) {
    return (
        <motion.div
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay }}
            className={`absolute inset-0 rounded-full border border-${color}/30`}
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


// ─── Main component ───────────────────────────────────────────────────────────

export default function VoiceAdvisor({ products, pastProducts, savedPrefs, userName, isOpen, onClose, onHangup, onAddItem, onViewProduct, onNavigate, showUI = true }: Props) {
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
            onNavigate
        });

    // Auto-start when opened
    useEffect(() => {
        if (isOpen && voiceState === 'idle' && isSupported) {
            const timer = setTimeout(() => {
                startSession();
            }, 600); // Small delay for smooth transition
            return () => clearTimeout(timer);
        }
    }, [isOpen, voiceState, isSupported, startSession]);

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
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-neon/[0.02] blur-[120px] rounded-full" />

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
                                </h3>
                                <p className="text-[10px] text-zinc-600 mt-0.5 font-medium">
                                    Gemini Live · Audio natif temps réel
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

                    {/* ── Main voice area ── */}
                    <div className="relative flex-1 flex flex-col items-center justify-center gap-8 px-6 py-6">

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
                                whileHover={!isActive && voiceState !== 'connecting' ? { scale: 1.05 } : {}}
                                onClick={isActive || voiceState === 'connecting' || !isSupported ? undefined : startSession}
                                disabled={voiceState === 'connecting' || !isSupported}
                                aria-label={isActive ? 'Session active' : 'Démarrer la session vocale'}
                                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500
                                    ${voiceState === 'error'
                                        ? 'bg-gradient-to-br from-red-500/10 to-red-900/10 border-2 border-red-500/30 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
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
                                className={`text-base font-bold tracking-tight ${voiceState === 'error' ? 'text-red-400' : isActive ? 'text-white' : 'text-zinc-300'
                                    }`}
                            >
                                {STATUS[voiceState]}
                            </motion.p>
                            <p className="text-[11px] text-zinc-600 font-medium max-w-[260px] mx-auto leading-relaxed" aria-live="polite" aria-atomic="true">
                                {error || compatibilityError || STATUS_SUB[voiceState]}
                            </p>
                        </div>

                        {/* Active session controls */}
                        <AnimatePresence>
                            {isActive && (
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
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleHangup}
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
                                💬 Continuer en chat texte
                            </button>
                            <p className="text-[10px] text-zinc-600 text-center mt-3 font-medium">
                                Votre navigateur ne supporte pas toutes les APIs vocales nécessaires.
                            </p>
                        </div>
                    )}

                    {/* ── Start / retry button ── */}
                    <AnimatePresence>
                        {(voiceState === 'idle' || voiceState === 'error') && isSupported && (
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
                                        {voiceState === 'error' ? '🔄 Réessayer la connexion' : '🎤 Démarrer la session vocale'}
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
                </motion.div>
            )}
        </AnimatePresence>
    );
}
