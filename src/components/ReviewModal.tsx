import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MessageSquare, CheckCircle2, ChevronRight, ChevronLeft, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order, OrderItem, Product } from '../lib/types';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import StarRating from './StarRating';

interface ReviewModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
}

interface ProductReview {
    product_id: string;
    product_name: string;
    image_url: string | null;
    rating: number;
    comment: string;
    isSubmitted: boolean;
}

export default function ReviewModal({ order, isOpen, onClose }: ReviewModalProps) {
    const { user } = useAuthStore();
    const addToast = useToastStore((s) => s.addToast);
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && order.order_items) {
            // Map order items to review objects
            const items = order.order_items as OrderItem[];
            setReviews(items.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                image_url: item.product?.image_url || null,
                rating: 0,
                comment: '',
                isSubmitted: false
            })));
            setCurrentIndex(0);
        }
    }, [isOpen, order]);

    const currentReview = reviews[currentIndex];
    const isFinished = reviews.every(r => r.isSubmitted || (r.rating > 0));

    const handleRatingChange = (rating: number) => {
        setReviews(prev => prev.map((r, i) =>
            i === currentIndex ? { ...r, rating } : r
        ));
    };

    const handleCommentChange = (comment: string) => {
        setReviews(prev => prev.map((r, i) =>
            i === currentIndex ? { ...r, comment } : r
        ));
    };

    const submitCurrentReview = async () => {
        if (!user || !currentReview || currentReview.rating === 0) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                product_id: currentReview.product_id,
                user_id: user.id,
                order_id: order.id,
                rating: currentReview.rating,
                comment: currentReview.comment.trim() || null,
                is_published: false, // Wait for moderation
                is_verified: true, // Verified because it's from an order
            });

            if (error) throw error;

            setReviews(prev => prev.map((r, i) =>
                i === currentIndex ? { ...r, isSubmitted: true } : r
            ));

            if (currentIndex < reviews.length - 1) {
                setCurrentIndex(prev => prev + 1);
            }

            addToast({ message: `Avis pour ${currentReview.product_name} envoyé !`, type: 'success' });
        } catch (err: any) {
            addToast({ message: "Erreur lors de l'envoi de l'avis", type: 'error' });
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < reviews.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                        <div>
                            <h3 className="text-xl font-serif font-black text-white uppercase tracking-tight">Votre Expérience</h3>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Commande #{order.id.slice(0, 8)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8">
                        {currentReview ? (
                            <div className="space-y-8">
                                {/* Product Info */}
                                <div className="flex items-center gap-6">
                                    {currentReview.image_url ? (
                                        <img
                                            src={currentReview.image_url}
                                            className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg"
                                            alt={currentReview.product_name}
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                            <Star className="w-8 h-8 text-zinc-800" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-mono text-green-neon uppercase tracking-[0.2em] mb-1">Produit de votre sélection</p>
                                        <h4 className="text-xl font-serif font-black text-white uppercase truncate">{currentReview.product_name}</h4>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="space-y-4 text-center py-6 bg-white/[0.02] rounded-3xl border border-white/5">
                                    <p className="text-sm font-medium text-zinc-400 font-serif italic">Quelle note donneriez-vous à ce produit ?</p>
                                    <div className="flex justify-center">
                                        <StarRating
                                            rating={currentReview.rating}
                                            interactive={!currentReview.isSubmitted}
                                            onRate={handleRatingChange}
                                            size="lg"
                                        />
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-zinc-600" />
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vos impressions (Optionnel)</span>
                                    </div>
                                    <textarea
                                        value={currentReview.comment}
                                        readOnly={currentReview.isSubmitted}
                                        onChange={(e) => handleCommentChange(e.target.value)}
                                        placeholder="Parlez-nous des arômes, des effets ou de la qualité de votre sélection..."
                                        className="w-full bg-zinc-950/50 border border-white/5 rounded-[1.5rem] p-5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-neon/50 transition-all min-h-[120px] resize-none overflow-hidden hover:border-white/10"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handlePrev}
                                            disabled={currentIndex === 0}
                                            className="w-12 h-12 rounded-xl border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-0 transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                            {currentIndex + 1} / {reviews.length}
                                        </span>
                                        <button
                                            onClick={handleNext}
                                            disabled={currentIndex === reviews.length - 1}
                                            className="w-12 h-12 rounded-xl border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-0 transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {currentReview.isSubmitted ? (
                                        <div className="flex items-center gap-2 text-green-neon font-bold text-xs">
                                            <CheckCircle2 className="w-4 h-4" />
                                            AVIS TRANSMIS
                                        </div>
                                    ) : (
                                        <button
                                            onClick={submitCurrentReview}
                                            disabled={currentReview.rating === 0 || isSubmitting}
                                            className="bg-green-neon text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-2 text-xs"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <Send className="w-3.5 h-3.5" />
                                            )}
                                            Envoyer
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 space-y-6">
                                <div className="w-20 h-20 bg-green-neon/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-10 h-10 text-green-neon" />
                                </div>
                                <h4 className="text-2xl font-serif font-black text-white uppercase italic">Expérience Partagée</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mx-auto">
                                    Toute l'équipe Green Mood vous remercie pour vos précieuses impressions. Vos témoignages contribuent à l'excellence de notre boutique.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="bg-white text-black font-black uppercase tracking-widest px-10 py-4 rounded-2xl hover:bg-green-neon transition-all w-full"
                                >
                                    Fermer
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
