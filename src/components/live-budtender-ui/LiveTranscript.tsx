import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, User, Loader2 } from 'lucide-react';
import type { TranscriptEntry, LiveSessionStatus } from '../../lib/types';

interface LiveTranscriptProps {
    transcript: TranscriptEntry[];
    status: LiveSessionStatus;
}

export default function LiveTranscript({ transcript, status }: LiveTranscriptProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript, status]);

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3 custom-scrollbar"
        >
            <AnimatePresence mode="popLayout">
                {transcript.map((entry) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`flex gap-2.5 ${entry.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Avatar */}
                        {entry.sender === 'ai' && (
                            <div className="w-7 h-7 rounded-lg bg-green-neon/10 border border-green-neon/20 flex items-center justify-center flex-shrink-0">
                                <Leaf className="w-3.5 h-3.5 text-green-neon" />
                            </div>
                        )}
                        {entry.sender === 'user' && (
                            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        )}

                        {/* Bubble */}
                        <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                entry.sender === 'user'
                                    ? 'bg-green-neon/10 text-green-neon border border-green-neon/20 rounded-tr-sm'
                                    : entry.sender === 'system'
                                    ? 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 text-xs italic'
                                    : 'bg-zinc-800/60 text-zinc-200 border border-zinc-700/30 rounded-tl-sm'
                            }`}
                        >
                            {entry.text}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Status indicator */}
            {status === 'ai_speaking' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 px-2"
                >
                    <div className="w-7 h-7 rounded-lg bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                        <Leaf className="w-3.5 h-3.5 text-green-neon" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-800/40 rounded-full px-3 py-1.5">
                        <div className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] text-zinc-500">Parle...</span>
                    </div>
                </motion.div>
            )}

            {status === 'listening' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center"
                >
                    <span className="text-[10px] text-green-neon/50 font-medium tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-pulse" />
                        À l'écoute...
                    </span>
                </motion.div>
            )}

            {status === 'connecting' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center py-4"
                >
                    <div className="flex items-center gap-2 text-zinc-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-medium">Connexion en cours...</span>
                    </div>
                </motion.div>
            )}

            {transcript.length === 0 && status === 'connected' && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center mb-3">
                        <Leaf className="w-7 h-7 text-green-neon" />
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">Activez le micro pour commencer</p>
                    <p className="text-[10px] text-zinc-600 mt-1">ou utilisez l'entrée texte ci-dessous</p>
                </div>
            )}
        </div>
    );
}
