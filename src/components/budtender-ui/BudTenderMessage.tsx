import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

type MessageType = 'standard' | 'restock' | 'skip-quiz' | 'terpene';

export interface BudTenderMessageProps {
    /** Who sent the message */
    sender: 'bot' | 'user';
    /** The text content of the message */
    text?: string;
    /** The message type (controls styling nuances) */
    type?: MessageType;
    /** Whether the bot is currently typing (used to visually mute older messages) */
    isTyping?: boolean;
    /** Optional children rendered below the text bubble (cards, options, etc.) */
    children?: React.ReactNode;
}

/**
 * A single chat bubble for either the bot or the user.
 *
 * - Bot messages include a small Leaf avatar on the left.
 * - User messages are right-aligned with the green-neon background.
 * - Any extra content (product cards, quiz options, feedback) can be passed as
 *   `children` and will render inside the same row layout.
 */
export default function BudTenderMessage({
    sender,
    text,
    type: _type,
    isTyping: _isTyping,
    children,
}: BudTenderMessageProps) {
    return (
        <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}>
            {sender === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-green-neon/10 border border-green-neon/20 flex items-center justify-center mb-1 flex-shrink-0 shadow-sm">
                    <Leaf className="w-3.5 h-3.5 text-green-neon" />
                </div>
            )}
            <div className="max-w-[85%] space-y-3">
                {/* Text bubble */}
                {text && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                            sender === 'user'
                                ? 'bg-green-neon text-black font-bold'
                                : 'bg-zinc-800/80 border border-zinc-700/30 text-zinc-100 backdrop-blur-md'
                        }`}
                    >
                        {text}
                    </motion.div>
                )}

                {/* Slot for additional content: restock cards, quiz options, results, feedback, etc. */}
                {children}
            </div>
        </div>
    );
}
