import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

export interface BudTenderWidgetProps {
    /** Called when the user clicks the floating button */
    onClick: () => void;
    /** Whether the button should play the slow-pulse attention animation */
    pulse?: boolean;
    /** Number of unread messages to show as a badge (0 = hidden) */
    unreadCount?: number;
}

/**
 * The floating "BudTender IA" button that sits in the bottom-right corner.
 * Includes the Leaf icon, an online-status dot, and an optional unread badge.
 */
export default function BudTenderWidget({ onClick, pulse = false, unreadCount = 0 }: BudTenderWidgetProps) {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900/80 backdrop-blur-xl border border-green-neon/30 text-white rounded-2xl px-5 py-4 shadow-[0_0_30px_rgba(57,255,20,0.1)] hover:border-green-neon/60 hover:shadow-[0_0_40px_rgba(57,255,20,0.2)] transition-all group ${pulse ? 'animate-pulse-slow' : ''}`}
        >
            <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-green-neon/20 flex items-center justify-center group-hover:bg-green-neon/30 transition-colors">
                    <Leaf className="w-5 h-5 text-green-neon group-hover:rotate-12 transition-transform duration-300" />
                </div>

                {/* Online dot or unread badge */}
                {unreadCount > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-green-neon text-black text-[10px] font-black rounded-full border-2 border-zinc-900 px-1 leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                ) : (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-neon rounded-full border-2 border-zinc-900 animate-pulse" />
                )}
            </div>

            <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-green-neon leading-none tracking-tight">BudTender IA</p>
                <p className="text-[11px] text-zinc-400 leading-none mt-1 group-hover:text-zinc-200 transition-colors">Votre expert CBD</p>
            </div>
        </motion.button>
    );
}
