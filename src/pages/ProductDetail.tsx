import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ShoppingCart,
  Leaf,
  FlaskConical,
  Weight,
  Star,
  RefreshCw,
  CheckCircle,
  Send,
  MessageSquare,
  Package,
  Tag,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Review, SubscriptionFrequency, BundleItem } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import StockBadge from '../components/StockBadge';
import QuantitySelector from '../components/QuantitySelector';
import StarRating from '../components/StarRating';
import SEO from '../components/SEO';
import RelatedProducts from '../components/RelatedProducts';
import { useSettingsStore } from '../store/settingsStore';

const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  weekly: 'Chaque semaine',
  biweekly: 'Toutes les 2 semaines',
  monthly: 'Chaque mois',
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Subscription state
  const [subFrequency, setSubFrequency] = useState<SubscriptionFrequency>('monthly');
  const [subQty, setSubQty] = useState(1);
  const [subSuccess, setSubSuccess] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [reviewableOrderId, setReviewableOrderId] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const openSidebar = useCartStore((s) => s.openSidebar);
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          navigate('/catalogue', { replace: true });
          return;
        }
        const p = data as Product;
        setProduct(p);
        setIsLoading(false);
        loadReviews(p.id);
        if (user) checkCanReview(p.id, user.id);
        // Load bundle items if applicable
        if (p.is_bundle) {
          supabase
            .from('bundle_items')
            .select('*, product:products(id, name, slug, price, image_url, cbd_percentage, weight_grams)')
            .eq('bundle_id', p.id)
            .then(({ data: items }) => {
              if (items) setBundleItems(items as BundleItem[]);
            });
        }
      });
  }, [slug, navigate, user]);

  async function loadReviews(productId: string) {
    const { data } = await supabase
      .from('reviews')
      .select('*, profile:profiles(full_name)')
      .eq('product_id', productId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    const list = (data as Review[]) ?? [];
    setReviews(list);
    if (list.length > 0) {
      setAvgRating(list.reduce((s, r) => s + r.rating, 0) / list.length);
    }
  }

  async function checkCanReview(productId: string, userId: string) {
    // Find delivered order items for this product by this user
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('product_id', productId);

    if (!items || items.length === 0) return;
    const orderIds = items.map((i: { order_id: string }) => i.order_id);

    const { data: deliveredOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'delivered')
      .in('id', orderIds);

    if (!deliveredOrders || deliveredOrders.length === 0) return;

    // Check no existing review for this product
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .limit(1);

    if (!existing || existing.length === 0) {
      setCanReview(true);
      setReviewableOrderId(deliveredOrders[0].id);
    }
  }

  async function handleSubscribe() {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (!product) return;
    setSubLoading(true);

    const next = new Date();
    if (subFrequency === 'weekly') next.setDate(next.getDate() + 7);
    else if (subFrequency === 'biweekly') next.setDate(next.getDate() + 14);
    else next.setMonth(next.getMonth() + 1);

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      product_id: product.id,
      quantity: subQty,
      frequency: subFrequency,
      next_delivery_date: next.toISOString().split('T')[0],
      status: 'active',
    });

    setSubLoading(false);
    setSubSuccess(true);
  }

  async function handleSubmitReview() {
    if (!user || !product || !reviewableOrderId) return;
    setIsSubmittingReview(true);
    setReviewError('');

    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      order_id: reviewableOrderId,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
      is_verified: true,
      is_published: false,
    });

    if (error) {
      setReviewError('Erreur lors de l\'envoi. Veuillez réessayer.');
      setIsSubmittingReview(false);
      return;
    }

    setReviewSuccess(true);
    setShowReviewForm(false);
    setCanReview(false);
    setIsSubmittingReview(false);
  }

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    if (quantity > 1) updateQuantity(product.id, quantity);
    openSidebar();
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const isOil = product?.category?.slug === 'huiles' && !product?.is_bundle;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <>
      <SEO
        title={`${product.name} — Green Mood CBD`}
        description={product.description ?? `Achetez ${product.name} en ligne sur Green Mood CBD. Click & Collect ou livraison.`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link to="/catalogue" className="flex items-center gap-1 hover:text-green-neon transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Catalogue
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <span>{product.category.name}</span>
            </>
          )}
          <span>/</span>
          <span className="text-zinc-300">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            {/* Bundle badge on image */}
            {product.is_bundle && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-purple-600 px-3 py-1 rounded-full text-sm font-bold text-white shadow-lg">
                <Package className="w-4 h-4" />
                Pack Découverte
              </div>
            )}
            {product.is_featured && !product.is_bundle && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-green-neon px-3 py-1 rounded-full text-sm font-semibold text-white">
                <Star className="w-3.5 h-3.5" />
                Populaire
              </div>
            )}
            <div className="aspect-square rounded-3xl overflow-hidden bg-zinc-900">
              <img
                src={product.image_url ?? 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {product.category && (
              <Link
                to={`/catalogue`}
                className="text-sm text-green-neon font-medium hover:underline"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="font-serif text-4xl font-bold">{product.name}</h1>

            {/* Average rating (if reviews exist) */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} size="md" />
                <span className="text-sm text-zinc-400">
                  {avgRating.toFixed(1)} ({reviews.length} avis)
                </span>
              </div>
            )}

            {product.description && (
              <p className="text-zinc-400 leading-relaxed text-lg">{product.description}</p>
            )}

            {/* Benefits & Aromas */}
            {((product.attributes?.benefits || []).length > 0 || (product.attributes?.aromas || []).length > 0) && (
              <div className="flex flex-wrap gap-6 pt-2">
                {(product.attributes?.benefits || []).length > 0 && (
                  <div className="space-y-2 flex-1 min-w-[140px]">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Leaf className="w-3.5 h-3.5 text-green-neon" />
                      Bénéfices
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {product.attributes.benefits!.map(b => (
                        <span key={b} className="text-xs bg-green-900/20 text-green-400 px-2.5 py-1 rounded-lg border border-green-800/40 font-medium">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(product.attributes?.aromas || []).length > 0 && (
                  <div className="space-y-2 flex-1 min-w-[140px]">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-zinc-400" />
                      Arômes
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {product.attributes.aromas!.map(a => (
                        <span key={a} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700 font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3">
              {product.cbd_percentage != null && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center gap-2 text-green-neon mb-1">
                    <Leaf className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">CBD</span>
                  </div>
                  <span className="text-2xl font-bold">{product.cbd_percentage}%</span>
                </div>
              )}
              {product.thc_max != null && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <FlaskConical className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">THC max</span>
                  </div>
                  <span className="text-2xl font-bold">{product.thc_max}%</span>
                </div>
              )}
              {product.weight_grams != null && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Weight className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Poids</span>
                  </div>
                  <span className="text-2xl font-bold">{product.weight_grams}g</span>
                </div>
              )}
            </div>

            <StockBadge stock={product.stock_quantity} />

            {/* Price */}
            <div>
              <div className="text-4xl font-bold">{product.price.toFixed(2)} €</div>
              {product.is_bundle && product.original_value && product.original_value > product.price && (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-lg text-zinc-500 line-through">{product.original_value.toFixed(2)} €</span>
                  <span className="flex items-center gap-1 text-sm font-bold text-purple-400 bg-purple-900/30 border border-purple-700/40 px-2.5 py-1 rounded-full">
                    <Tag className="w-3.5 h-3.5" />
                    Vous économisez {(product.original_value - product.price).toFixed(2)} €
                  </span>
                </div>
              )}
            </div>

            {/* Add to cart */}
            {product.is_available && product.stock_quantity > 0 ? (
              <div className="flex items-center gap-4">
                <QuantitySelector
                  quantity={quantity}
                  onChange={setQuantity}
                  max={product.stock_quantity}
                />
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-neon hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addedFeedback ? 'Ajouté !' : 'Ajouter au panier'}
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-2xl p-4 text-center text-zinc-500 border border-zinc-800">
                Produit temporairement indisponible
              </div>
            )}

            {/* ── Bundle content section ── */}
            {product.is_bundle && bundleItems.length > 0 && (
              <div className="bg-zinc-900/70 border border-purple-800/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">Contenu du Pack</h3>
                  <span className="ml-auto text-xs text-purple-400 font-medium">{bundleItems.length} produit{bundleItems.length > 1 ? 's' : ''}</span>
                </div>
                {bundleItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/50">
                    {item.product?.image_url && (
                      <img
                        src={item.product.image_url}
                        alt={item.product?.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/catalogue/${item.product?.slug}`}
                        className="text-sm font-semibold text-white hover:text-green-neon transition-colors line-clamp-1"
                      >
                        {item.quantity > 1 && <span className="text-green-neon mr-1">{item.quantity}×</span>}
                        {item.product?.name}
                      </Link>
                      {item.product?.cbd_percentage && (
                        <p className="text-xs text-zinc-500 mt-0.5">CBD {item.product.cbd_percentage}%</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-zinc-300 flex-shrink-0">
                      {item.product ? (item.product.price * item.quantity).toFixed(2) : '—'} €
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Subscription panel (oils only, not bundles) ── */}
            {settings.subscriptions_enabled && isOil && !subSuccess && (
              <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-green-neon" />
                  <h3 className="font-semibold">S'abonner & recevoir automatiquement</h3>
                </div>
                <p className="text-sm text-zinc-400">
                  Livraison automatique sans effort. Modifiable ou résiliable à tout moment depuis votre compte.
                </p>

                {/* Frequency */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">Fréquence</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(FREQUENCY_LABELS) as SubscriptionFrequency[]).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setSubFrequency(freq)}
                        className={`py-2 px-2 rounded-xl text-xs text-center border transition-colors ${subFrequency === freq
                          ? 'bg-green-neon/20 border-green-primary text-green-400 font-medium'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                          }`}
                      >
                        {FREQUENCY_LABELS[freq]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">Quantité</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSubQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-lg"
                    >
                      −
                    </button>
                    <span className="text-white font-semibold w-6 text-center">{subQty}</span>
                    <button
                      onClick={() => setSubQty((q) => Math.min(10, q + 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-lg"
                    >
                      +
                    </button>
                    <span className="text-sm text-zinc-500">
                      = {(product.price * subQty).toFixed(2)} € / livraison
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-green-primary text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${subLoading ? 'animate-spin' : ''}`} />
                  {subLoading ? 'En cours…' : 'S\'abonner'}
                </button>
              </div>
            )}

            {settings.subscriptions_enabled && isOil && subSuccess && (
              <div className="bg-green-900/20 border border-green-800 rounded-2xl p-5 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-semibold">Abonnement créé !</p>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    Gérez vos livraisons depuis{' '}
                    <Link to="/compte/abonnements" className="text-green-neon hover:underline">
                      Mon compte
                    </Link>.
                  </p>
                </div>
              </div>
            )}

            {/* Legal */}
            <p className="text-xs text-zinc-600 leading-relaxed">
              Produit contenant moins de 0,3% de THC. Conforme à la réglementation française (décret n°2021-1282).
              Vente réservée aux personnes âgées de 18 ans et plus.
            </p>
          </motion.div>
        </div>

        {/* ── Reviews Section ── */}
        <div className="mt-16 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold">Avis clients</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} size="md" />
                <span className="text-zinc-400 text-sm">{avgRating.toFixed(1)} / 5 ({reviews.length})</span>
              </div>
            )}
          </div>

          {/* Can review CTA */}
          {canReview && !reviewSuccess && !showReviewForm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-green-800/50 rounded-2xl p-5 mb-6"
            >
              <p className="text-sm text-zinc-300 mb-3">
                Vous avez acheté ce produit. Partagez votre expérience !
              </p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2 bg-green-neon hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Rédiger un avis
              </button>
            </motion.div>
          )}

          {/* Review success message */}
          {reviewSuccess && (
            <div className="bg-green-900/20 border border-green-800 rounded-2xl p-5 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">
                Merci pour votre avis ! Il sera publié après validation par notre équipe.
              </p>
            </div>
          )}

          {/* Review form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 space-y-4"
              >
                <h3 className="font-semibold">Votre avis sur {product.name}</h3>

                {/* Star picker */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">Note</p>
                  <StarRating
                    rating={reviewRating}
                    size="lg"
                    interactive
                    onRate={setReviewRating}
                  />
                </div>

                {/* Comment */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">
                    Commentaire <span className="text-zinc-600 normal-case">(optionnel)</span>
                  </p>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    placeholder="Décrivez votre expérience avec ce produit…"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors resize-none"
                  />
                </div>

                {reviewError && (
                  <p className="text-sm text-red-400">{reviewError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="flex items-center gap-2 bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmittingReview ? 'Envoi…' : 'Soumettre'}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="text-zinc-400 hover:text-white text-sm px-4 py-2.5 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-zinc-800 rounded-2xl">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun avis pour l'instant.</p>
              {!user && (
                <p className="text-sm mt-1">
                  <Link to="/connexion" className="text-green-neon hover:underline">
                    Connectez-vous
                  </Link>{' '}
                  pour laisser un avis après votre achat.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, i) => {
                const initials = (review.profile?.full_name ?? 'Client')
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-green-neon/20 flex items-center justify-center text-green-400 text-sm font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-white">
                            {review.profile?.full_name ?? 'Client'}
                          </span>
                          {review.is_verified && (
                            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Achat vérifié
                            </span>
                          )}
                          <span className="text-xs text-zinc-600 ml-auto">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="mt-1 mb-2">
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-zinc-400 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Related Products ── */}
        <RelatedProducts productId={product.id} categoryId={product.category_id} />
      </div>
    </>
  );
}
