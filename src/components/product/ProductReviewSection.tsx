/**
 * ProductReviewSection.tsx
 *
 * Displays the reviews list, average rating, and a write-review form
 * for eligible authenticated users.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, CheckCircle, Send } from 'lucide-react';
import StarRating from '../StarRating';
import { Review } from '../../lib/types';

interface ProductReviewSectionProps {
    reviews: Review[];
    avgRating: number;
    canReview: boolean;
    reviewSuccess: boolean;
    onSubmitReview: (rating: number, comment: string) => Promise<string | null>;
}

export default function ProductReviewSection({
    reviews,
    avgRating,
    canReview,
    reviewSuccess,
    onSubmitReview,
}: ProductReviewSectionProps) {
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        const err = await onSubmitReview(rating, comment);
        if (err) {
            setError(err);
        } else {
            setShowForm(false);
            setComment('');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="mt-32 space-y-16">
            {/* Section header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.06] pb-8">
                <div className="space-y-4">
                    <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">EXPÉRIENCE &amp; TÉMOIGNAGES</h2>
                    <p className="text-2xl md:text-3xl font-serif font-bold italic text-white uppercase tracking-tight">L&apos;Expression de nos Membres.</p>
                </div>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-6 bg-white/5 border border-white/[0.06] px-8 py-4 rounded-2xl backdrop-blur-xl">
                        <StarRating rating={avgRating} size="sm" />
                        <div className="w-px h-6 bg-white/10" />
                        <span className="text-sm font-bold text-white">
                            {avgRating.toFixed(1)} <span className="text-xs text-zinc-500 ml-1">/ 5.0</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Write review CTA */}
            {canReview && !reviewSuccess && !showForm && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-neon/5 border border-dashed border-green-neon/20 rounded-2xl p-6 md:p-8 text-center space-y-6"
                >
                    <MessageSquare className="w-12 h-12 mx-auto text-green-neon/40" />
                    <div className="space-y-2">
                        <p className="font-serif text-2xl font-bold text-white">Partagez votre voyage sensoriel.</p>
                        <p className="text-zinc-500 text-sm max-w-sm mx-auto italic">Votre expertise contribue à l&apos;excellence de notre catalogue.</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-green-neon text-black font-semibold uppercase tracking-wider px-8 py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all"
                    >
                        Rédiger mon Impression
                    </button>
                </motion.div>
            )}

            {/* Review submitted confirmation */}
            {reviewSuccess && (
                <div className="bg-green-neon/5 border border-green-neon/20 rounded-2xl p-6 md:p-8 flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-green-neon/20 flex items-center justify-center text-green-neon">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-white font-semibold uppercase tracking-wider text-xs">Impression Transmise</p>
                        <p className="text-zinc-500 text-sm italic mt-1 font-serif">Votre témoignage est en cours de modération par notre comité d&apos;excellence.</p>
                    </div>
                </div>
            )}

            {/* Review form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 space-y-10"
                    >
                        <div className="space-y-2">
                            <h3 className="font-serif text-2xl font-bold italic text-white leading-none">Votre Note.</h3>
                            <StarRating rating={rating} size="lg" interactive onRate={setRating} />
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">VOTRE TÉMOIGNAGE</p>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={5}
                                placeholder="Décrivez les nuances, l'arôme, et l'expérience vécue..."
                                className="w-full bg-white/5 border border-white/[0.06] rounded-2xl px-5 py-4 text-lg font-serif italic text-white placeholder:text-zinc-800 focus:outline-none focus:border-green-neon transition-all resize-none"
                            />
                        </div>
                        {error && <p className="text-xs font-semibold uppercase tracking-wider text-red-500">{error}</p>}
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 bg-green-neon text-black font-semibold uppercase tracking-wider py-5 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl"
                            >
                                <Send className="w-4 h-4" />
                                {isSubmitting ? 'TRANSMISSION...' : 'TRANSMETTRE'}
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-10 py-5 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:text-white transition-colors"
                            >
                                ANNULER
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reviews list */}
            {reviews.length === 0 ? (
                <div className="py-24 text-center space-y-6 bg-white/[0.01] border border-dashed border-white/[0.06] rounded-2xl">
                    <MessageSquare className="w-16 h-16 mx-auto text-zinc-800" />
                    <div className="space-y-2">
                        <p className="font-serif text-2xl font-bold text-white italic">Silence Éloquent.</p>
                        <p className="text-zinc-600 text-sm max-w-xs mx-auto font-serif">Aucune impression n&apos;a encore été consignée pour cette édition.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-10">
                    {reviews.map((review, i) => {
                        const initials = (review.profile?.full_name ?? 'C L')
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                        return (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.8, ease: 'easeOut' }}
                                className="relative group lg:pl-12"
                            >
                                <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-green-neon/20 via-white/5 to-transparent" />
                                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/[0.06] rounded-[2.5rem] p-8 md:p-10 hover:border-green-neon/20 transition-all duration-700 relative overflow-hidden group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-neon/[0.02] blur-[100px] pointer-events-none" />
                                    <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                        <div className="flex flex-col items-center md:items-start gap-4 shrink-0">
                                            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-green-neon font-serif text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-700">
                                                {initials}
                                            </div>
                                            {review.is_verified && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-neon/10 border border-green-neon/20 rounded-full">
                                                    <CheckCircle className="w-3 h-3 text-green-neon" />
                                                    <span className="text-[9px] font-black text-green-neon uppercase tracking-widest">Certifié</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-6 text-center md:text-left">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <h4 className="text-xl font-serif font-bold text-white tracking-tight">
                                                        {review.profile?.full_name ?? 'Membre Anonyme'}
                                                    </h4>
                                                    <div className="flex justify-center md:justify-start">
                                                        <StarRating rating={review.rating} size="sm" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col md:items-end gap-1">
                                                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                                                        Impression No. {review.id.slice(0, 4).toUpperCase()}
                                                    </span>
                                                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                                        {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        }).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <div className="relative pt-4">
                                                    <span className="absolute -top-4 -left-4 text-6xl font-serif text-white/5 pointer-events-none group-hover:text-green-neon/5 transition-colors duration-700">&ldquo;</span>
                                                    <p className="text-zinc-400 font-serif italic text-xl md:text-2xl leading-relaxed max-w-3xl">
                                                        {review.comment}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
