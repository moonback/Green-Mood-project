import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

export default function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already verified their age
    const isVerified = localStorage.getItem('ageVerified');
    if (!isVerified) {
      // Small delay to ensure smooth rendering before popup appears
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('ageVerified', 'true');
    setIsVisible(false);
  };

  const handleDeny = () => {
    // Redirect to a safe page (e.g., Google) if under 18
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/[0.08] rounded-3xl p-8 shadow-2xl text-center"
          >
            <div className="mx-auto w-16 h-16 bg-green-neon/20 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="h-8 w-8 text-green-neon" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-white mb-4">
              Vérification d'âge
            </h2>

            <p className="text-zinc-400 mb-8 leading-relaxed">
              L'accès à ce site est strictement réservé aux personnes majeures.
              Les produits à base de CBD sont interdits aux mineurs.
              <br /><br />
              <strong className="text-white">Avez-vous plus de 18 ans ?</strong>
            </p>

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                className="w-full py-4 px-6 bg-green-neon text-black rounded-xl font-semibold transition-all hover:shadow-[0_0_16px_rgba(57,255,20,0.3)] active:scale-[0.98]"
              >
                Oui, j'ai plus de 18 ans
              </button>
              <button
                onClick={handleDeny}
                className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-all"
              >
                Non, je n'ai pas 18 ans
              </button>
            </div>

            <p className="mt-6 text-xs text-zinc-500">
              En entrant sur ce site, vous acceptez nos conditions générales d'utilisation.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
