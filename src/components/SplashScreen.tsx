import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('hasSeenSplash');
        }
        return true;
    });

    const handleHide = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenSplash', 'true');
    };

    useEffect(() => {
        if (!isVisible) return;

        const timer = setTimeout(handleHide, 5000);
        return () => clearTimeout(timer);
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
                >
                    <video
                        autoPlay
                        muted
                        playsInline
                        onEnded={handleHide}
                        className="max-w-[80%] max-h-[80%] w-auto h-auto object-contain"
                    >
                        <source src="/splash.mp4" type="video/mp4" />
                        Votre navigateur ne supporte pas la vidéo.
                    </video>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

