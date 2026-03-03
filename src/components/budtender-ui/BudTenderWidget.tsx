import { motion } from 'motion/react';
import { Leaf, Mic } from 'lucide-react';

export interface BudTenderWidgetProps {
    /** Called when the user clicks the floating button */
    onClick: () => void;
    /** Called when the user clicks the quick voice button */
    onVoiceClick?: () => void;
    /** Whether the button should play the slow-pulse attention animation */
    pulse?: boolean;
    /** Whether a voice session is currently active */
    isVoiceActive?: boolean;
    /** Number of unread messages to show as a badge (0 = hidden) */
    unreadCount?: number;
    /** 'default' or 'expand' (when chat is shrunk) */
    mode?: 'default' | 'expand';
}

/**
 * The floating "BudTender IA" button that sits in the bottom-right corner.
 * Includes the Leaf icon, an online-status dot, and an optional unread badge.
 */
export default function BudTenderWidget({ onClick, onVoiceClick, pulse = false, isVoiceActive = false, unreadCount = 0, mode = 'default' }: BudTenderWidgetProps) {
    const isExpand = mode === 'expand';

    return (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3">
            {/* Quick Voice Button */}
            {!isExpand && onVoiceClick && (
                <motion.button
                    initial={{ scale: 0, opacity: 0, x: 20 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        x: 0,
                        backgroundColor: isVoiceActive ? 'rgba(57, 255, 20, 0.15)' : 'rgba(24, 24, 27, 0.8)'
                    }}
                    exit={{ scale: 0, opacity: 0, x: 20 }}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onVoiceClick();
                    }}
                    title={isVoiceActive ? "Mode vocal actif" : "Démarrer le mode vocal"}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all relative ${isVoiceActive
                            ? 'border-green-neon text-green-neon shadow-[0_0_20px_rgba(57,255,20,0.4)]'
                            : 'border-green-neon/30 text-green-neon shadow-[0_0_30px_rgba(57,255,20,0.1)] hover:border-green-neon'
                        }`}
                    style={{ backdropFilter: 'blur(20px)' }}
                >
                    <Mic className={`w-5 h-5 ${isVoiceActive ? 'animate-pulse' : ''}`} />
                    {isVoiceActive && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-neon rounded-full animate-ping" />
                    )}
                </motion.button>
            )}

            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                aria-label={isExpand ? "Agrandir BudTender" : "Toggle BudTender"}
                className={`flex items-center gap-3 border text-white rounded-2xl px-5 py-4 transition-all group ${pulse ? 'animate-pulse-slow' : ''} ${isExpand
                    ? 'border-green-neon bg-zinc-900 shadow-[0_0_50px_rgba(57,255,20,0.3)]'
                    : 'border-green-neon/30 bg-zinc-900/80 shadow-[0_0_30px_rgba(57,255,20,0.1)]'
                    }`}
                style={{ backdropFilter: 'blur(20px)' }}
            >
                <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpand ? 'bg-green-neon text-black' : 'bg-green-neon/20 text-green-neon'
                        }`}>
                        {isExpand ? (
                            <Leaf className="w-5 h-5 animate-bounce" />
                        ) : (
                            <Leaf className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                        )}
                    </div>

                    {!isExpand && (unreadCount > 0 ? (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-green-neon text-black text-[10px] font-black rounded-full border-2 border-zinc-900 px-1 leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    ) : (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-neon rounded-full border-2 border-zinc-900 animate-pulse" />
                    ))}
                </div>

                <div className="text-left hidden sm:block">
                    <p className="text-sm font-bold text-green-neon leading-none tracking-tight">
                        {isExpand ? 'Continuer la discussion' : 'BudTender IA'}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-none mt-1 group-hover:text-zinc-200 transition-colors">
                        {isExpand ? 'Cliquez pour réouvrir' : 'Votre expert CBD'}
                    </p>
                </div>
            </motion.button>
        </div>
    );
}
