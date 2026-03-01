import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

/**
 * Animated typing indicator shown while the bot is composing a response.
 * Displays the bot avatar alongside three pulsing dots.
 */
export default function BudTenderTypingIndicator() {
    return (
        <div className="flex justify-start items-end gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-neon/10 border border-green-neon/20 flex items-center justify-center mb-1 shadow-sm">
                <Leaf className="w-3.5 h-3.5 text-green-neon" />
            </div>
            <div className="bg-zinc-800/80 backdrop-blur-md px-5 py-4 rounded-2xl flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-green-neon/40 rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
        </div>
    );
}
