import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

/**
 * Animated typing indicator shown while the bot is composing a response.
 * Displays the bot avatar alongside three pulsing dots.
 */
export default function BudTenderTypingIndicator() {
    return (
        <div className="flex justify-start items-end gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-neon/20 to-green-neon/5 border border-green-neon/20 flex items-center justify-center mb-1 flex-shrink-0 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-green-neon" />
            </div>
            <div
                className="px-6 py-5 rounded-[1.5rem] sm:rounded-[1.75rem] rounded-bl-none flex gap-1.5 border border-white/10 shadow-xl pointer-events-none"
                style={{
                    backgroundColor: 'rgba(24, 24, 27, 0.7)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
                }}
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-green-neon rounded-full"
                        animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.8, 1.1, 0.8],
                            boxShadow: [
                                '0 0 0 rgba(57,255,20,0)',
                                '0 0 8px rgba(57,255,20,0.4)',
                                '0 0 0 rgba(57,255,20,0)'
                            ]
                        }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    />
                ))}
            </div>
        </div>
    );
}
