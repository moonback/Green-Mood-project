import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { VoiceStatus, VoiceTranscriptEntry } from '../../hooks/useVoiceBudTender';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudTenderVoiceModalProps {
    status: VoiceStatus;
    isMuted: boolean;
    transcript: VoiceTranscriptEntry[];
    errorMessage: string | null;
    onClose: () => void;
    onToggleMute: () => void;
}

// ─── Orb animation variants ────────────────────────────────────────────────────

const ORB_COLORS: Record<VoiceStatus, string> = {
    idle: 'rgba(57,255,20,0.15)',
    connecting: 'rgba(57,255,20,0.20)',
    listening: 'rgba(57,255,20,0.30)',
    speaking: 'rgba(57,255,20,0.50)',
    error: 'rgba(239,68,68,0.30)',
};

const ORB_RING_COLORS: Record<VoiceStatus, string> = {
    idle: 'rgba(57,255,20,0.15)',
    connecting: 'rgba(57,255,20,0.25)',
    listening: 'rgba(57,255,20,0.40)',
    speaking: 'rgba(57,255,20,0.60)',
    error: 'rgba(239,68,68,0.40)',
};

const STATUS_LABELS: Record<VoiceStatus, string> = {
    idle: 'Déconnecté',
    connecting: 'Connexion en cours...',
    listening: 'Je vous écoute...',
    speaking: 'BudTender parle...',
    error: 'Erreur de connexion',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BudTenderVoiceModal({
    status,
    isMuted,
    transcript,
    errorMessage,
    onClose,
    onToggleMute,
}: BudTenderVoiceModalProps) {
    const isConnecting = status === 'connecting';
    const isSpeaking = status === 'speaking';
    const isListening = status === 'listening';
    const isError = status === 'error';

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Modal panel */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.92 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-zinc-950 border border-zinc-800/60 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_60px_rgba(57,255,20,0.08)] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                                <Volume2 className="w-4 h-4 text-green-neon" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white tracking-tight">Mode Vocal</p>
                                <p className="text-[10px] text-zinc-500 font-medium">Gemini 2.5 Flash Native Audio</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Orb area */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-8 py-10 px-6">

                        {/* Animated orb */}
                        <div className="relative flex items-center justify-center">
                            {/* Outer pulse rings */}
                            {(isListening || isSpeaking) && (
                                <>
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.6, 1],
                                            opacity: [0.4, 0, 0.4],
                                        }}
                                        transition={{
                                            duration: isSpeaking ? 0.9 : 1.8,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                        className="absolute w-36 h-36 rounded-full"
                                        style={{ backgroundColor: ORB_RING_COLORS[status] }}
                                    />
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.35, 1],
                                            opacity: [0.5, 0.1, 0.5],
                                        }}
                                        transition={{
                                            duration: isSpeaking ? 0.9 : 1.8,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            delay: 0.3,
                                        }}
                                        className="absolute w-28 h-28 rounded-full"
                                        style={{ backgroundColor: ORB_RING_COLORS[status] }}
                                    />
                                </>
                            )}

                            {/* Core orb */}
                            <motion.div
                                animate={
                                    isSpeaking
                                        ? { scale: [1, 1.1, 0.95, 1.08, 1], boxShadow: ['0 0 30px rgba(57,255,20,0.3)', '0 0 70px rgba(57,255,20,0.7)', '0 0 30px rgba(57,255,20,0.3)'] }
                                        : isListening
                                            ? { scale: [1, 1.04, 1], boxShadow: ['0 0 20px rgba(57,255,20,0.2)', '0 0 40px rgba(57,255,20,0.4)', '0 0 20px rgba(57,255,20,0.2)'] }
                                            : isConnecting
                                                ? { rotate: 360 }
                                                : {}
                                }
                                transition={
                                    isSpeaking
                                        ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' }
                                        : isListening
                                            ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                                            : isConnecting
                                                ? { duration: 2, repeat: Infinity, ease: 'linear' }
                                                : {}
                                }
                                className="w-24 h-24 rounded-full flex items-center justify-center relative overflow-hidden"
                                style={{
                                    backgroundColor: ORB_COLORS[status],
                                    border: `2px solid ${ORB_RING_COLORS[status]}`,
                                }}
                            >
                                {/* Inner gradient for orb depth */}
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: isSpeaking
                                            ? 'radial-gradient(circle at 40% 35%, rgba(57,255,20,0.7) 0%, rgba(57,255,20,0.15) 60%, transparent 100%)'
                                            : isListening
                                                ? 'radial-gradient(circle at 40% 35%, rgba(57,255,20,0.5) 0%, rgba(57,255,20,0.1) 60%, transparent 100%)'
                                                : isError
                                                    ? 'radial-gradient(circle at 40% 35%, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.1) 60%, transparent 100%)'
                                                    : 'radial-gradient(circle at 40% 35%, rgba(57,255,20,0.3) 0%, rgba(57,255,20,0.05) 60%, transparent 100%)',
                                    }}
                                />

                                {/* Icon inside orb */}
                                <div className="relative z-10">
                                    {isConnecting ? (
                                        <Loader2 className="w-8 h-8 text-green-neon animate-spin" />
                                    ) : isError ? (
                                        <AlertCircle className="w-8 h-8 text-red-400" />
                                    ) : (
                                        <motion.div
                                            animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                        >
                                            <Volume2 className={`w-8 h-8 ${isError ? 'text-red-400' : 'text-green-neon'}`} />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Status label */}
                        <div className="text-center space-y-1">
                            <motion.p
                                key={status}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-sm font-bold tracking-tight ${isError ? 'text-red-400' : 'text-white'}`}
                            >
                                {STATUS_LABELS[status]}
                            </motion.p>
                            {isError && errorMessage && (
                                <p className="text-xs text-red-400/70 max-w-[220px] text-center">{errorMessage}</p>
                            )}
                            {!isError && (
                                <p className="text-xs text-zinc-500">
                                    {isMuted ? '🔇 Micro désactivé' : 'Parlez directement en français'}
                                </p>
                            )}
                        </div>

                        {/* Mic toggle button */}
                        {!isError && !isConnecting && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onToggleMute}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border ${isMuted
                                        ? 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        : 'bg-green-neon/10 border-green-neon/40 text-green-neon hover:bg-green-neon/20'
                                    }`}
                            >
                                {isMuted ? (
                                    <>
                                        <MicOff className="w-4 h-4" />
                                        Activer le micro
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-4 h-4" />
                                        Couper le micro
                                    </>
                                )}
                            </motion.button>
                        )}

                        {/* Transcript */}
                        {transcript.length > 0 && (
                            <div className="w-full max-h-40 overflow-y-auto space-y-2.5 custom-scrollbar px-1">
                                {transcript.map((entry) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: entry.role === 'user' ? 10 : -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] text-xs px-3.5 py-2 rounded-2xl leading-relaxed ${entry.role === 'user'
                                                    ? 'bg-zinc-800 text-zinc-200 rounded-br-sm'
                                                    : 'bg-green-neon/10 text-green-neon/90 border border-green-neon/20 rounded-bl-sm'
                                                }`}
                                        >
                                            {entry.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 border-t border-zinc-800/50 flex items-center justify-between">
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">
                            BudTender IA Expert
                        </p>
                        <button
                            onClick={onClose}
                            className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                            <X className="w-3 h-3" />
                            Fermer le mode vocal
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
