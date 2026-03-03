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
        <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-4`}>
            {sender === 'bot' && (
                <div className="w-10 h-10 rounded-xl bg-green-neon/10 border border-green-neon/20 flex items-center justify-center mb-1 flex-shrink-0 shadow-sm">
                    <Leaf className="w-5 h-5 text-green-neon" />
                </div>
            )}
            <div className="max-w-[90%] space-y-4">
                {/* Text bubble */}
                {text && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`px-6 py-4.5 rounded-[1.75rem] text-base leading-relaxed shadow-lg whitespace-pre-wrap ${sender === 'user'
                            ? 'bg-green-neon text-black font-black'
                            : 'text-zinc-100 font-medium'
                            }`}
                        style={sender === 'bot' ? { backgroundColor: 'rgba(39, 39, 42, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(113, 113, 122, 0.4)' } : {}}
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
