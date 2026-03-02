import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, PhoneOff, Volume2, X, MessageSquare } from 'lucide-react';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from '../hooks/useBudTenderMemory';
import { useGeminiLiveVoice, VoiceState, VoiceUtterance } from '../hooks/useGeminiLiveVoice';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
    products: Product[];
    pastProducts: PastProduct[];
    savedPrefs: SavedPrefs | null;
    userName: string | null;
    isOpen: boolean;
    onClose: () => void;
}

// ─── Status labels ───────────────────────────────────────────────────────────

const STATUS: Record<VoiceState, string> = {
    idle: 'Appuyez pour démarrer',
    connecting: 'Connexion en cours…',
    listening: 'Je vous écoute…',
    speaking: 'BudTender répond…',
    error: 'Erreur de connexion',
};

// ─── Waveform bars ───────────────────────────────────────────────────────────

function WaveformBars() {
    return (
        <div className="flex items-center gap-1.5">
            {[0, 0.1, 0.2, 0.1, 0].map((delay, i) => (
                <motion.div
                    key={i}
                    className="w-1.5 bg-green-neon rounded-full"
                    animate={{ height: ['8px', i === 2 ? '36px' : '24px', '8px'] }}
                    transition={{ duration: 0.55, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

// ─── Transcript list ─────────────────────────────────────────────────────────

function TranscriptList({ utterances }: { utterances: VoiceUtterance[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [utterances.length]);

    if (utterances.length === 0) return null;

    return (
        <div className="w-full px-4 pb-2 space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] px-1">Transcript</p>
            {utterances.slice(-6).map((u, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs px-3 py-2 rounded-xl leading-relaxed ${u.role === 'user'
                        ? 'bg-zinc-800/60 text-zinc-400 ml-10'
                        : 'bg-green-neon/5 border border-green-neon/10 text-zinc-300 mr-10'
                        }`}
                >
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-50 block mb-0.5">
                        {u.role === 'user' ? 'Vous' : 'BudTender'}
                    </span>
                    {u.text}
                </motion.div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VoiceAdvisor({ products, pastProducts, savedPrefs, userName, isOpen, onClose }: Props) {
    const { voiceState, transcript, error, isMuted, startSession, stopSession, toggleMute } =
        useGeminiLiveVoice({ products, pastProducts, savedPrefs, userName });

    const [showTranscript, setShowTranscript] = useState(false);

    const isActive = voiceState === 'listening' || voiceState === 'speaking';

    const handleClose = () => {
        stopSession();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="absolute inset-0 z-20 bg-zinc-950/98 backdrop-blur-sm flex flex-col overflow-hidden"
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50 bg-gradient-to-r from-zinc-950/80 to-zinc-900/80 shrink-0">
                        <div>
                            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                                CONSEILLER VOCAL
                                <span className="text-[9px] bg-green-neon/10 text-green-neon px-2 py-0.5 rounded-full border border-green-neon/20 font-bold tracking-wider">
                                    LIVE
                                </span>
                            </h3>
                            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                                Conseiller vocal IA · Audio natif
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {transcript.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    className={`p-2 rounded-xl transition-all relative ${showTranscript
                                        ? 'text-green-neon bg-green-neon/10'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                        }`}
                                    title={showTranscript ? "Masquer la transcription" : "Afficher la transcription"}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    {!showTranscript && transcript.length > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-neon rounded-full shadow-[0_0_5px_rgba(57,255,20,0.5)]"
                                        />
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                aria-label="Fermer le conseiller vocal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Main voice area ── */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-4">

                        {/* Mic / state visualisation */}
                        <div className="relative flex items-center justify-center w-32 h-32">

                            {/* Pulsing rings when listening */}
                            <AnimatePresence>
                                {voiceState === 'listening' && (
                                    <>
                                        <motion.div
                                            key="ring1"
                                            initial={{ scale: 1, opacity: 0.5 }}
                                            animate={{ scale: 1.55, opacity: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                                            className="absolute inset-0 rounded-full border border-green-neon/25"
                                        />
                                        <motion.div
                                            key="ring2"
                                            initial={{ scale: 1, opacity: 0.4 }}
                                            animate={{ scale: 1.28, opacity: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                                            className="absolute inset-0 rounded-full border border-green-neon/35"
                                        />
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Waveform when speaking */}
                            <AnimatePresence>
                                {voiceState === 'speaking' && (
                                    <motion.div
                                        key="wave"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute"
                                    >
                                        <WaveformBars />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Central button */}
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={isActive || voiceState === 'connecting' ? undefined : startSession}
                                disabled={voiceState === 'connecting'}
                                aria-label={isActive ? 'Session active' : 'Démarrer la session vocale'}
                                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all
                                    ${voiceState === 'error'
                                        ? 'bg-red-500/15 border-2 border-red-500/40 text-red-400'
                                        : isActive
                                            ? 'bg-green-neon/10 border-2 border-green-neon/50 text-green-neon shadow-[0_0_30px_rgba(57,255,20,0.1)]'
                                            : voiceState === 'connecting'
                                                ? 'bg-zinc-800/60 border-2 border-zinc-700 text-zinc-500 cursor-wait'
                                                : 'bg-zinc-800/80 border-2 border-zinc-700 text-zinc-400 hover:border-green-neon/40 hover:text-green-neon/70 cursor-pointer'
                                    }`}
                            >
                                <AnimatePresence mode="wait">
                                    {voiceState === 'connecting' && (
                                        <motion.div
                                            key="spinner"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="w-7 h-7 border-2 border-green-neon/40 border-t-green-neon rounded-full animate-spin"
                                        />
                                    )}
                                    {voiceState === 'speaking' && (
                                        <motion.div key="vol" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                            <Volume2 className="w-8 h-8" />
                                        </motion.div>
                                    )}
                                    {(voiceState === 'listening' || voiceState === 'idle' || voiceState === 'error') && (
                                        <motion.div key="mic" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                            {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>

                        {/* Status text */}
                        <div className="text-center space-y-1">
                            <p className={`text-sm font-semibold ${voiceState === 'error' ? 'text-red-400' : 'text-zinc-300'}`}>
                                {STATUS[voiceState]}
                            </p>
                            {error && (
                                <p className="text-xs text-red-400/80 max-w-[260px] text-center leading-relaxed">
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Active session controls */}
                        <AnimatePresence>
                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    className="flex items-center gap-3"
                                >
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isMuted
                                            ? 'bg-orange-500/15 border border-orange-500/40 text-orange-400'
                                            : 'bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                            }`}
                                        aria-label={isMuted ? 'Réactiver le micro' : 'Couper le micro'}
                                    >
                                        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                        {isMuted ? 'Micro coupé' : 'Couper le micro'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={stopSession}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                                        aria-label="Terminer la session vocale"
                                    >
                                        <PhoneOff className="w-3.5 h-3.5" />
                                        Raccrocher
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Transcript ── */}
                    {showTranscript && <TranscriptList utterances={transcript} />}

                    {/* ── Start / retry button ── */}
                    <AnimatePresence>
                        {(voiceState === 'idle' || voiceState === 'error') && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="px-5 pb-5 pt-2 shrink-0"
                            >
                                <button
                                    type="button"
                                    onClick={startSession}
                                    className="w-full py-4 rounded-2xl bg-green-neon text-black font-black text-sm uppercase tracking-wider hover:shadow-[0_0_25px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all"
                                >
                                    {voiceState === 'error' ? '🔄 Réessayer' : '🎤 Démarrer la session vocale'}
                                </button>
                                <p className="text-[10px] text-zinc-600 text-center mt-2 font-medium">
                                    Microphone requis · Connexion directe au conseiller vocal
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
