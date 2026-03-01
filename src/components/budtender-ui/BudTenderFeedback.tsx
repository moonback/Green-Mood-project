import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export interface BudTenderFeedbackProps {
    /** Callback fired when the user clicks thumbs-up or thumbs-down */
    onFeedback: (type: 'positive' | 'negative') => void;
    /** Whether the buttons should be disabled (e.g. already submitted) */
    disabled?: boolean;
}

/**
 * Thumbs up / thumbs down feedback buttons shown after recommendation cards.
 * After clicking, a brief "Merci !" confirmation is displayed.
 */
export default function BudTenderFeedback({ onFeedback, disabled = false }: BudTenderFeedbackProps) {
    const [submitted, setSubmitted] = useState<'positive' | 'negative' | null>(null);

    const handleClick = (type: 'positive' | 'negative') => {
        if (disabled || submitted) return;
        setSubmitted(type);
        onFeedback(type);
    };

    return (
        <div className="flex items-center gap-3 pt-2">
            <AnimatePresence mode="wait">
                {submitted ? (
                    <motion.span
                        key="thanks"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-bold text-green-neon"
                    >
                        Merci !
                    </motion.span>
                ) : (
                    <motion.div
                        key="buttons"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-1">
                            Utile ?
                        </span>
                        <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleClick('positive')}
                            disabled={disabled}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-green-neon hover:bg-green-neon/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Recommandation utile"
                        >
                            <ThumbsUp className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleClick('negative')}
                            disabled={disabled}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Recommandation pas utile"
                        >
                            <ThumbsDown className="w-3.5 h-3.5" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
