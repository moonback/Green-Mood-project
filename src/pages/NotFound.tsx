import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Ghost } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
            <SEO
                title="Page Introuvable | Green Moon"
                description="Désolé, la page que vous recherchez n'existe pas ou a été déplacée."
            />

            {/* Background Decorative Glows */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-neon/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-neon/5 rounded-full blur-[100px]" />

            <div className="max-w-md w-full text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mb-8 flex justify-center"
                >
                    <div className="relative">
                        <Ghost className="w-24 h-24 text-green-neon/20" />
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <span className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
                                404
                            </span>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-black text-white mb-4 tracking-tight"
                >
                    Oups ! Vous semblez perdu dans l'espace 🌿
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-zinc-400 mb-10 leading-relaxed"
                >
                    La page que vous cherchez n'existe pas ou nous l'avons déplacée pour faire de la place à nos nouvelles pépites N10.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link
                        to="/"
                        className="flex-1 flex items-center justify-center gap-2 bg-green-neon hover:bg-green-400 text-black font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)] hover:shadow-[0_0_30px_rgba(57,255,20,0.4)]"
                    >
                        <Home className="w-5 h-5" />
                        Retour à l'accueil
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 text-white font-bold py-4 rounded-2xl border border-zinc-700/50 transition-all backdrop-blur-md"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Page précédente
                    </button>
                </motion.div>

                {/* Quick Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 pt-8 border-t border-zinc-800/50"
                >
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Besoin d'aide ?</p>
                    <div className="flex justify-center gap-6 text-sm">
                        <Link to="/catalogue" className="text-zinc-400 hover:text-green-neon transition-colors">Notre Catalogue</Link>
                        <Link to="/contact" className="text-zinc-400 hover:text-green-neon transition-colors">Contactez-nous</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
