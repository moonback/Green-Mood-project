import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Clock, CheckCircle, MessageSquareQuote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Review } from '../lib/types';
import StarRating from '../components/StarRating';
import SEO from '../components/SEO';

export default function MyReviews() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reviews')
      .select('*, product:products(id, name, slug, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data as Review[]) ?? []);
        setIsLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
      <SEO title="Mes Impressions — L'Excellence Green Mood" description="Consultez et gérez vos avis produits." />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-black uppercase tracking-widest transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au Hub
            </Link>
            <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight leading-none uppercase">
              MES <br /><span className="text-green-neon italic">IMPRESSIONS.</span>
            </h1>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600 md:text-right">
            VOS TÉMOIGNAGES — {reviews.length} CONTRIBUTIONS
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 animate-pulse h-32" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-green-neon/5 rounded-full blur-xl" />
              <MessageSquareQuote className="w-10 h-10 text-zinc-800" />
            </div>
            <div className="space-y-3">
              <p className="font-serif text-2xl font-black text-white">Le silence est d'or</p>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto italic">
                Partagez vos impressions après avoir savouré vos sélections d'exception.
              </p>
            </div>
            <Link
              to="/compte/commandes"
              className="bg-white text-black font-black uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-green-neon transition-all"
            >
              Voir mes Commandes
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 md:p-10 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Product image */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-green-neon/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    {review.product?.image_url ? (
                      <Link to={`/catalogue/${review.product.slug}`}>
                        <img
                          src={review.product.image_url}
                          alt={review.product.name}
                          className="w-24 h-24 object-cover rounded-2xl border border-white/10 group-hover:border-green-neon/30 transition-all"
                        />
                      </Link>
                    ) : (
                      <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center">
                        <Star className="w-8 h-8 text-zinc-800" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <Link
                          to={`/catalogue/${review.product?.slug ?? ''}`}
                          className="text-xl font-serif font-black text-white hover:text-green-neon transition-colors uppercase tracking-tight"
                        >
                          {review.product?.name ?? 'Produit Inconnu'}
                        </Link>
                        <div className="mt-2 flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest ml-2">Note de dégustation</span>
                        </div>
                      </div>

                      {/* Status badge */}
                      {review.is_published ? (
                        <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-green-neon bg-green-neon/5 border border-green-neon/20 px-4 py-2 rounded-full shadow-lg">
                          <CheckCircle className="w-3 h-3" />
                          PUBLIÉ AVEC SUCCÈS
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-4 py-2 rounded-full shadow-lg">
                          <Clock className="w-3 h-3" />
                          MODÉRATION EN COURS
                        </span>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-zinc-400 italic font-serif leading-relaxed text-lg border-l-2 border-green-neon/20 pl-6 py-1">
                        "{review.comment}"
                      </p>
                    )}

                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                        SÉLECTION TRANSMISE LE {new Date(review.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-20 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-zinc-700">L'EXPRESSION DE VOTRE SATISFACTION EST NOTRE PRIORITÉ.</p>
        </div>
      </div>
    </div>
  );
}
