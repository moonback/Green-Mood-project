import { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Review } from '../../lib/types';
import StarRating from '../StarRating';

interface ReviewWithRelations extends Omit<Review, 'product'> {
  product?: { id: string; name: string; slug: string; image_url: string | null };
  profile?: { id: string; full_name: string | null };
}

export default function AdminReviewsTab() {
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'published'>('all');

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setIsLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*, product:products(id, name), profile:profiles(id, full_name)')
      .order('created_at', { ascending: false });
    setReviews((data as ReviewWithRelations[]) ?? []);
    setIsLoading(false);
  }

  async function handleTogglePublish(review: ReviewWithRelations) {
    const newVal = !review.is_published;
    await supabase.from('reviews').update({ is_published: newVal }).eq('id', review.id);
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, is_published: newVal } : r))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet avis définitivement ?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered =
    filter === 'all'
      ? reviews
      : filter === 'pending'
        ? reviews.filter((r) => !r.is_published)
        : reviews.filter((r) => r.is_published);

  const pendingCount = reviews.filter((r) => !r.is_published).length;

  return (
    <div className="space-y-4">
      {/* Filters + stats */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: 'all', label: `Tous (${reviews.length})` },
            { key: 'pending', label: `En attente (${pendingCount})` },
            { key: 'published', label: `Publiés (${reviews.length - pendingCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === key
                ? 'bg-green-neon text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={loadReviews}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aucun avis à afficher.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={`bg-zinc-900 border rounded-xl p-4 ${review.is_published ? 'border-zinc-800' : 'border-yellow-900/50'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-sm font-medium text-white">
                      {review.profile?.full_name ?? 'Client'}
                    </span>
                    <span className="text-zinc-600 text-xs">sur</span>
                    <span className="text-xs text-zinc-400 truncate">
                      {review.product?.name ?? 'Produit inconnu'}
                    </span>
                    {review.is_verified && (
                      <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full">
                        Achat vérifié
                      </span>
                    )}
                    <span className={`ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${review.is_published
                      ? 'text-green-400 bg-green-900/20'
                      : 'text-yellow-400 bg-yellow-900/20'
                      }`}>
                      {review.is_published ? (
                        <><CheckCircle className="w-3 h-3" /> Publié</>
                      ) : (
                        <><Clock className="w-3 h-3" /> En attente</>
                      )}
                    </span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-3">{review.comment}</p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(review.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePublish(review)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${review.is_published
                      ? 'text-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/30'
                      : 'text-green-400 bg-green-900/20 hover:bg-green-900/30'
                      }`}
                    title={review.is_published ? 'Dépublier' : 'Publier'}
                  >
                    {review.is_published ? (
                      <><EyeOff className="w-3.5 h-3.5" /> Dépublier</>
                    ) : (
                      <><Eye className="w-3.5 h-3.5" /> Publier</>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
