import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

    // Custom components for Markdown rendering
    const markdownComponents = {
        p: ({ children }: { children: React.ReactNode }) => <p className="mb-3 last:mb-0">{children}</p>,
        strong: ({ children }: { children: React.ReactNode }) => (
            <strong className={`font-black ${sender === 'bot' ? 'text-green-neon' : 'text-black opacity-90'}`}>
                {children}
            </strong>
        ),
        em: ({ children }: { children: React.ReactNode }) => <em className="italic opacity-90">{children}</em>,
        ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc ml-4 my-3 space-y-1.5">{children}</ul>,
        ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal ml-4 my-3 space-y-1.5">{children}</ol>,
        li: ({ children }: { children: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
    };

    return (
        <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3 sm:gap-4`}>
            {sender === 'bot' && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-neon/20 to-green-neon/5 border border-green-neon/20 flex items-center justify-center mb-1 flex-shrink-0 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                    <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-green-neon" />
                </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[80%] space-y-3 sm:space-y-4 ${sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text bubble */}
                {text && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`px-5 py-3.5 sm:px-6 sm:py-4.5 rounded-[1.5rem] sm:rounded-[1.75rem] text-sm sm:text-base leading-relaxed shadow-xl ${sender === 'user'
                                ? 'bg-gradient-to-br from-green-neon to-emerald-400 text-black font-black rounded-br-none'
                                : 'text-zinc-100 font-medium rounded-bl-none border border-white/10'
                            }`}
                        style={sender === 'bot' ? {
                            backgroundColor: 'rgba(24, 24, 27, 0.7)',
                            backdropFilter: 'blur(16px)',
                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)'
                        } : {}}
                    >
                        {sender === 'bot' ? (
                            <ReactMarkdown components={markdownComponents}>
                                {text}
                            </ReactMarkdown>
                        ) : (
                            text
                        )}
                    </motion.div>
                )}

                {/* Slot for additional content: restock cards, quiz options, results, feedback, etc. */}
                {children}
            </div>
        </div>
    );
}
