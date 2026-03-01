import { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, PhoneOff, SendHorizontal, Keyboard } from 'lucide-react';
import type { LiveSessionStatus } from '../../lib/types';

interface LiveControlsProps {
    isMicActive: boolean;
    userAudioLevel: number;
    status: LiveSessionStatus;
    onToggleMic: () => void;
    onSendText: (text: string) => void;
    onEndSession: () => void;
}

export default function LiveControls({
    isMicActive,
    userAudioLevel,
    status,
    onToggleMic,
    onSendText,
    onEndSession,
}: LiveControlsProps) {
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState('');

    const isActive = ['connected', 'listening', 'ai_speaking'].includes(status);
    const canToggleMic = isActive;

    const handleSendText = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = textInput.trim();
        if (!text) return;
        onSendText(text);
        setTextInput('');
    };

    // Dynamic ring size based on audio level
    const ringScale = 1 + userAudioLevel * 0.4;

    return (
        <div className="border-t border-white/[0.06] bg-zinc-950/60 backdrop-blur-xl">
            {/* Text input (togglable) */}
            {showTextInput && (
                <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleSendText}
                    className="flex items-center gap-2 px-4 pt-3"
                >
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Tapez votre message..."
                        disabled={!isActive}
                        className="flex-1 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-green-neon/40 transition-colors"
                    />
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="submit"
                        disabled={!textInput.trim() || !isActive}
                        className="p-2.5 bg-green-neon/10 hover:bg-green-neon text-green-neon hover:text-black rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <SendHorizontal className="w-4 h-4" />
                    </motion.button>
                </motion.form>
            )}

            {/* Main controls */}
            <div className="flex items-center justify-center gap-4 px-4 py-4">
                {/* Text input toggle */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowTextInput(!showTextInput)}
                    className={`p-3 rounded-xl transition-all ${
                        showTextInput
                            ? 'bg-green-neon/10 text-green-neon border border-green-neon/20'
                            : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border border-zinc-700/50'
                    }`}
                    title="Basculer en mode texte"
                >
                    <Keyboard className="w-5 h-5" />
                </motion.button>

                {/* Microphone button (main) */}
                <div className="relative">
                    {/* Audio level ring */}
                    {isMicActive && (
                        <motion.div
                            animate={{ scale: ringScale }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                            className="absolute inset-0 rounded-full border-2 border-green-neon/30 pointer-events-none"
                            style={{ margin: '-4px' }}
                        />
                    )}

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggleMic}
                        disabled={!canToggleMic}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed ${
                            isMicActive
                                ? 'bg-green-neon text-black shadow-[0_0_30px_rgba(57,255,20,0.3)]'
                                : isActive
                                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-2 border-zinc-600'
                                : 'bg-zinc-900 text-zinc-600 border-2 border-zinc-800'
                        }`}
                        title={isMicActive ? 'Couper le micro' : 'Activer le micro'}
                    >
                        {isMicActive ? (
                            <Mic className="w-7 h-7" />
                        ) : (
                            <MicOff className="w-7 h-7" />
                        )}

                        {/* Status dot */}
                        {isActive && (
                            <span
                                className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                                    isMicActive ? 'bg-green-neon animate-pulse' : 'bg-zinc-500'
                                }`}
                            />
                        )}
                    </motion.button>
                </div>

                {/* End session */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onEndSession}
                    disabled={status === 'idle' || status === 'disconnected'}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Terminer la session"
                >
                    <PhoneOff className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Mic hint */}
            {!isMicActive && isActive && !showTextInput && (
                <p className="text-center text-[9px] text-zinc-600 pb-2 -mt-1">
                    Appuyez sur le micro pour commencer à parler
                </p>
            )}
        </div>
    );
}
