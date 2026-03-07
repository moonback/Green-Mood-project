/**
 * BannerTicker.tsx
 *
 * Animated ticker that cycles through promotional banner messages.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BannerTickerProps {
    messages: string[];
}

export default function BannerTicker({ messages }: BannerTickerProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (messages.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [messages.length]);

    return (
        <div className="relative h-4 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
                >
                    {messages[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    );
}
