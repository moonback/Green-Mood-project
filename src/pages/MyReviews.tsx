import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Clock, CheckCircle } from 'lucide-react';
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
    <>
      <SEO title="Mes avis — Green Mood CBD" description="Consultez et gérez vos avis produits." />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/compte"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Mon compte
          </Link>
        </div>

        <h1 className="font-serif text-3xl font-bold mb-2">Mes avis</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Les avis soumis sont vérifiés par notre équipe avant publication.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucun avis pour l'instant</p>
            <p className="text-sm mt-1 mb-6">
              Après avoir reçu votre commande, vous pouvez laisser un avis sur les produits achetés.
            </p>
            <Link
              to="/compte/commandes"
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Voir mes commandes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex gap-4">
                  {/* Product image */}
                  {review.product?.image_url ? (
                    <Link to={`/catalogue/${review.product.slug}`}>
                      <img
                        src={review.product.image_url}
                        alt={review.product.name}
                        className="w-14 h-14 object-cover rounded-xl flex-shrink-0 hover:opacity-80 transition-opacity"
                      />
                    </Link>
                  ) : (
                    <div className="w-14 h-14 bg-zinc-800 rounded-xl flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/catalogue/${review.product?.slug ?? ''}`}
                          className="font-semibold text-white hover:text-green-primary transition-colors text-sm"
                        >
                          {review.product?.name ?? 'Produit'}
                        </Link>
                        <div className="mt-1">
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>

                      {/* Status badge */}
                      {review.is_published ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 border border-green-800 px-2.5 py-1 rounded-full flex-shrink-0">
                          <CheckCircle className="w-3 h-3" />
                          Publié
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/30 border border-yellow-800 px-2.5 py-1 rounded-full flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          En attente
                        </span>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{review.comment}</p>
                    )}

                    <p className="text-xs text-zinc-600 mt-2">
                      Soumis le{' '}
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
