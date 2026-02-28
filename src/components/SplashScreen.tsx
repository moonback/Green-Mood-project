import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Hide splash screen when video ends or after a timeout
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 4500); // Fail-safe timeout 4.5s

        return () => clearTimeout(timer);
    }, []);

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
                        onEnded={() => setIsVisible(false)}
                        className="w-full h-full object-cover"
                    >
                        <source src="/splash.mp4" type="video/mp4" />
                        Votre navigateur ne supporte pas la vidéo.
                    </video>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
