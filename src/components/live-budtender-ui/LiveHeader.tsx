import { motion } from 'motion/react';
import { X, Leaf, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { LiveSessionStatus } from '../../lib/types';

interface LiveHeaderProps {
    status: LiveSessionStatus;
    onClose: () => void;
}

const STATUS_CONFIG: Record<LiveSessionStatus, { label: string; color: string; icon?: any }> = {
    idle: { label: 'En attente', color: 'text-zinc-500' },
    connecting: { label: 'Connexion...', color: 'text-yellow-400' },
    connected: { label: 'Connecté', color: 'text-green-neon' },
    listening: { label: 'À l\'écoute', color: 'text-green-neon' },
    ai_speaking: { label: 'BudTender parle...', color: 'text-green-neon' },
    disconnected: { label: 'Déconnecté', color: 'text-zinc-500' },
    error: { label: 'Erreur', color: 'text-red-400' },
};

export default function LiveHeader({ status, onClose }: LiveHeaderProps) {
    const [elapsed, setElapsed] = useState(0);
    const isActive = ['connected', 'listening', 'ai_speaking'].includes(status);

    useEffect(() => {
        if (!isActive) return;
        const start = Date.now();
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const cfg = STATUS_CONFIG[status];

    return (
        <div className="flex items-center gap-4 px-5 py-4 sm:px-6 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
            {/* Icon + Title */}
            <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-green-neon" />
                </div>
                {/* Live dot */}
                {isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-950 animate-live-blink" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white tracking-tight">
                        BUDTENDER
                    </h3>
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-black tracking-wider"
                    >
                        LIVE
                    </motion.span>
                    {isActive && (
                        <span className="text-[10px] text-zinc-500 font-mono tabular-nums">
                            {formatTime(elapsed)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {status === 'connecting' ? (
                        <Loader2 className="w-2.5 h-2.5 text-yellow-400 animate-spin" />
                    ) : isActive ? (
                        <Wifi className="w-2.5 h-2.5 text-green-neon" />
                    ) : (
                        <WifiOff className="w-2.5 h-2.5 text-zinc-500" />
                    )}
                    <p className={`text-[10px] font-medium ${cfg.color}`}>
                        {cfg.label}
                    </p>
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                aria-label="Fermer le mode live"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
