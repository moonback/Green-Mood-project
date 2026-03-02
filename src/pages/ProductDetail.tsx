import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CATEGORY_SLUGS } from '../lib/constants';
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
  Shield,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Review, SubscriptionFrequency, BundleItem } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import StockBadge from '../components/StockBadge';
import QuantitySelector from '../components/QuantitySelector';
import StarRating from '../components/StarRating';
import SEO from '../components/SEO';
import RelatedProducts from '../components/RelatedProducts';
import FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether';
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
  const [productImages, setProductImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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
  const addToast = useToastStore((s) => s.addToast);

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

        // Build images array (main + extra from product_images table)
        const mainImage = p.image_url ?? 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800';
        supabase
          .from('product_images')
          .select('image_url, sort_order')
          .eq('product_id', p.id)
          .order('sort_order')
          .then(({ data: extraImages, error: imgError }) => {
            if (imgError || !extraImages) {
              setProductImages([mainImage]);
              return;
            }
            const urls = extraImages.map((img: { image_url: string }) => img.image_url);
            setProductImages([mainImage, ...urls]);
          });
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
    addToast({ message: `${product.name} ajouté au panier`, type: 'success' });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) return;
    setQuantity(Math.max(1, Math.min(parseFloat(e.target.value) || 1, product.stock_quantity)));
  }, [product?.stock_quantity]);

  const isOil = product?.category?.slug === CATEGORY_SLUGS.OILS && !product?.is_bundle;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
      <SEO
        title={`${product.name} — Excellence Green Mood`}
        description={product.description ?? `Découvrez ${product.name} par Green Mood. L'excellence du CBD.`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-4 text-xs uppercase tracking-wider text-zinc-600 mb-12">
          <Link to="/catalogue" className="flex items-center gap-2 hover:text-green-neon transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Archives
          </Link>
          {product.category && (
            <>
              <span className="opacity-30">/</span>
              <span className="hover:text-white cursor-default">{product.category.name}</span>
            </>
          )}
          <span className="opacity-30">/</span>
          <span className="text-zinc-400">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group lg:sticky lg:top-28"
          >
            {/* Decorative Glow */}
            <div className="absolute inset-0 bg-green-neon/5 blur-[120px] -z-10 group-hover:bg-green-neon/10 transition-all duration-1000" />

            {/* Badges */}
            <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
              {product.is_bundle && (
                <div className="flex items-center gap-2 bg-purple-600/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white shadow-2xl">
                  <Package className="w-3 h-3" />
                  Écrin Prestige
                </div>
              )}
              {product.is_featured && !product.is_bundle && (
                <div className="flex items-center gap-2 bg-green-neon px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-black shadow-2xl">
                  <Star className="w-3 h-3 fill-current" />
                  Sélection Maître
                </div>
              )}
            </div>

            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={productImages[activeImageIndex] || product.image_url || 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800'}
                  alt={`${product.name} - Image ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out shadow-inner"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent pointer-events-none" />
            </div>

            {/* Image Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === activeImageIndex
                      ? 'border-green-neon shadow-[0_0_12px_rgba(57,255,20,0.3)]'
                      : 'border-white/[0.08] opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt={`Vue ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Specifications Overlay (Desktop Only) */}
            <div className="hidden md:flex absolute -bottom-6 -right-6 gap-3 z-30">
              {product.cbd_percentage != null && (
                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                  <p className="text-xs text-zinc-500 font-medium uppercase mb-1">Concentration</p>
                  <p className="text-3xl font-serif font-bold text-green-neon leading-none">{product.cbd_percentage}% <span className="text-xs uppercase font-sans tracking-tight">CBD</span></p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              {product.category && (
                <p className="text-xs text-green-neon uppercase tracking-wider font-medium">{product.category.name.toUpperCase()}</p>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold tracking-tight leading-[0.9] uppercase italic grayscale hover:grayscale-0 transition-all duration-1000">
                {product.name}.
              </h1>

              {reviews.length > 0 && (
                <div className="flex items-center gap-4 py-2">
                  <div className="flex text-yellow-500">
                    <StarRating rating={avgRating} size="sm" />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">
                    EXPÉRIENCE CLIENT : {avgRating.toFixed(1)}/5 — {reviews.length} TÉMOIGNAGES
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <p className="text-zinc-400 font-serif text-xl italic leading-relaxed max-w-xl">
                {product.description || "Une création singulière, élaborée avec la plus grande exigence pour une expérience sensorielle hors du temps."}
              </p>

              <div className="flex flex-wrap gap-8">
                {(product.attributes?.benefits || []).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-neon rounded-full" /> EFFETS RECHERCHÉS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.attributes.benefits!.map(b => (
                        <span key={b} className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border border-white/10 px-3 py-1.5 rounded-full hover:border-green-neon/50 transition-colors">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-10 relative overflow-hidden group/panel">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-neon/20 to-transparent" />

              <div className="flex items-start justify-between">
                <div className="flex flex-wrap gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Prix au gramme</p>
                    <p className="text-2xl font-serif font-bold text-green-neon leading-none">
                      {product.price.toFixed(2)}<span className="text-sm ml-1 italic font-sans uppercase tracking-widest text-zinc-500">€/g</span>
                    </p>
                  </div>
                  <div className="w-px h-10 bg-white/10 hidden sm:block" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-green-neon/60 font-black uppercase tracking-widest">Total Sélectionné ({quantity}g)</p>
                    <p className="text-4xl font-serif font-bold text-white leading-none">
                      {(product.price * quantity).toFixed(2)}<span className="text-xl ml-2 italic font-sans uppercase tracking-widest text-zinc-500">€</span>
                    </p>
                  </div>
                </div>
                <StockBadge stock={product.stock_quantity} />
              </div>

              {product.is_available && product.stock_quantity > 0 ? (
                <div className="space-y-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {[1, 5, 10, 30, 50, 100].map((weight) => (
                        <button
                          key={weight}
                          onClick={() => setQuantity(Math.min(weight, product.stock_quantity))}
                          className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${quantity === weight
                            ? 'bg-green-neon border-green-neon text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                            : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                            }`}
                        >
                          {weight}g
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-2 flex items-center">
                        <div className="flex items-center gap-1.5 px-3">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Poids:</span>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max={product.stock_quantity}
                            value={quantity}
                            onChange={handleQuantityChange}
                            className="w-12 bg-transparent text-sm font-black text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-[10px] text-zinc-500 font-bold">g</span>
                        </div>
                      </div>
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 w-full bg-green-neon text-black font-semibold uppercase tracking-wider py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all shadow-2xl group flex items-center justify-center gap-4"
                      >
                        <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {addedFeedback ? 'DÉPOSÉ AU PANIER' : 'ACQUÉRIR MAINTENANT'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium uppercase justify-center">
                    <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-neon" /> LIVRAISON DISCRÈTE</span>
                    <div className="w-1 h-1 bg-white/10 rounded-full" />
                    <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-zinc-500" /> PAIEMENT SÉCURISÉ</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 border-2 border-dashed border-white/[0.06] rounded-2xl text-center">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">ÉDITION TEMPORAIREMENT ÉPUISÉE</p>
                </div>
              )}
            </div>

            {/* Bundle Content */}
            {product.is_bundle && bundleItems.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xs text-zinc-500 font-medium uppercase tracking-wider px-2 flex items-center gap-3">
                  <Package className="w-3 h-3 text-purple-500" /> COMPOSITION DE L'ÉCRIN
                </h3>
                <div className="grid gap-4">
                  {bundleItems.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 group/item"
                    >
                      {item.product?.image_url && (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/[0.06] bg-zinc-900">
                          <img
                            src={item.product.image_url}
                            alt={item.product?.name}
                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/catalogue/${item.product?.slug}`}
                          className="text-sm font-bold uppercase tracking-wider text-white hover:text-green-neon transition-colors line-clamp-1"
                        >
                          {item.quantity > 1 && <span className="text-green-neon mr-2">{item.quantity}×</span>}
                          {item.product?.name}
                        </Link>
                        {item.product?.cbd_percentage && (
                          <p className="text-xs text-zinc-500 font-medium uppercase mt-1">CONCENTRATION : {item.product.cbd_percentage}%</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscription Card */}
            {settings.subscriptions_enabled && product.is_subscribable && !subSuccess && (
              <div className="bg-gradient-to-br from-green-neon/5 to-transparent border border-green-neon/20 rounded-2xl p-6 md:p-8 space-y-8 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-neon/10 flex items-center justify-center text-green-neon">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold uppercase italic text-white tracking-tight">Rituel d'Excellence.</h3>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">Abonnement Automatisé</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-zinc-500 font-medium mb-4 uppercase tracking-wider">FRÉQUENCE DE LIVRAISON</p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(FREQUENCY_LABELS) as SubscriptionFrequency[]).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setSubFrequency(freq)}
                          className={`px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${subFrequency === freq
                            ? 'bg-green-neon text-black shadow-lg shadow-green-neon/20'
                            : 'bg-white/5 border border-white/[0.06] text-zinc-500 hover:border-white/10'
                            }`}
                        >
                          {FREQUENCY_LABELS[freq]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={subLoading}
                    className="w-full flex items-center justify-center gap-4 bg-zinc-900 border border-white/10 hover:border-green-neon/50 text-white font-bold uppercase tracking-wider py-5 rounded-2xl transition-all"
                  >
                    {subLoading ? (
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        INITIER LE RITUEL
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {settings.subscriptions_enabled && product.is_subscribable && subSuccess && (
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

        {/* Frequently Bought Together */}
        {!product.is_bundle && (
          <div className="mt-20">
            <FrequentlyBoughtTogether
              productId={product.id}
              categoryId={product.category_id}
              currentPrice={product.price}
            />
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-32 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.06] pb-8">
            <div className="space-y-4">
              <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">EXPÉRIENCE & TÉMOIGNAGES</h2>
              <p className="text-2xl md:text-3xl font-serif font-bold italic text-white uppercase tracking-tight">L'Expression de nos Membres.</p>
            </div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-6 bg-white/5 border border-white/[0.06] px-8 py-4 rounded-2xl backdrop-blur-xl">
                <StarRating rating={avgRating} size="sm" />
                <div className="w-px h-6 bg-white/10" />
                <span className="text-sm font-bold text-white">{avgRating.toFixed(1)} <span className="text-xs text-zinc-500 ml-1">/ 5.0</span></span>
              </div>
            )}
          </div>

          {/* Can review CTA */}
          {canReview && !reviewSuccess && !showReviewForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-neon/5 border border-dashed border-green-neon/20 rounded-2xl p-6 md:p-8 text-center space-y-6"
            >
              <MessageSquare className="w-12 h-12 mx-auto text-green-neon/40" />
              <div className="space-y-2">
                <p className="font-serif text-2xl font-bold text-white">Partagez votre voyage sensoriel.</p>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto italic">Votre expertise contribue à l'excellence de notre catalogue.</p>
              </div>
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-green-neon text-black font-semibold uppercase tracking-wider px-8 py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all"
              >
                Rédiger mon Impression
              </button>
            </motion.div>
          )}

          {/* Review success message */}
          {reviewSuccess && (
            <div className="bg-green-neon/5 border border-green-neon/20 rounded-2xl p-6 md:p-8 flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-green-neon/20 flex items-center justify-center text-green-neon">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-semibold uppercase tracking-wider text-xs">Impression Transmise</p>
                <p className="text-zinc-500 text-sm italic mt-1 font-serif">Votre témoignage est en cours de modération par notre comité d'excellence.</p>
              </div>
            </div>
          )}

          {/* Review form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 space-y-10"
              >
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-bold italic text-white leading-none">Votre Note.</h3>
                  <StarRating
                    rating={reviewRating}
                    size="lg"
                    interactive
                    onRate={setReviewRating}
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">VOTRE TÉMOIGNAGE</p>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={5}
                    placeholder="Décrivez les nuances, l'arôme, et l'expérience vécue..."
                    className="w-full bg-white/5 border border-white/[0.06] rounded-2xl px-5 py-4 text-lg font-serif italic text-white placeholder:text-zinc-800 focus:outline-none focus:border-green-neon transition-all resize-none"
                  />
                </div>

                {reviewError && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-500">{reviewError}</p>
                )}

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="flex-1 bg-green-neon text-black font-semibold uppercase tracking-wider py-5 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmittingReview ? 'TRANSMISSION...' : 'TRANSMETTRE'}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
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
                <p className="text-zinc-600 text-sm max-w-xs mx-auto font-serif">Aucune impression n'a encore été consignée pour cette édition.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-8">
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-green-neon font-bold text-xs tracking-wider shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-bold uppercase tracking-wider text-white">{review.profile?.full_name ?? 'Membre Anonyme'}</p>
                            <div className="flex items-center gap-4">
                              <StarRating rating={review.rating} size="sm" />
                              {review.is_verified && (
                                <span className="text-xs font-semibold uppercase tracking-wider text-green-neon px-2 py-1 bg-green-neon/5 rounded-full">ACHAT CERTIFIÉ</span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium uppercase">
                            ARCHIVÉ LE {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }).toUpperCase()}
                          </p>
                        </div>
                        {review.comment && (
                          <p className="text-zinc-400 font-serif italic text-lg leading-relaxed border-l border-white/10 pl-8">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Related Products Section */}
        <div className="mt-20 pt-12 border-t border-white/[0.06]">
          <div className="mb-16 space-y-4">
            <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">VOUS POURRIEZ AUSSI APPRÉCIER</h2>
            <p className="text-2xl md:text-3xl font-serif font-bold italic text-white uppercase tracking-tight">Suite de l'Odyssée.</p>
          </div>
          <RelatedProducts productId={product.id} categoryId={product.category_id} />
        </div>

        {/* Legal Footer */}
        <div className="mt-32 pt-16 border-t border-white/[0.06] text-center">
          <p className="text-xs text-zinc-700 uppercase tracking-wider leading-loose max-w-2xl mx-auto">
            LES PRODUITS PRÉSENTÉS SONT CONFORMES AUX DÉCRETS N°2021-1282. TAUX DE THC INFÉRIEUR À 0.3%.
            DESTINÉS EXCLUSIVEMENT À UN PUBLIC MAJEUR ET AVERTI.
          </p>
        </div>
      </div>

      {/* Sticky Mobile Add to Cart Bar */}
      {product.is_available && product.stock_quantity > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
          <div className="bg-zinc-950/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3 flex items-center gap-3">
            <div className="flex-shrink-0">
              <p className="text-lg font-serif font-bold text-white leading-none">
                {product.price.toFixed(2)}<span className="text-xs text-zinc-500 ml-1">€</span>
              </p>
              {product.stock_quantity <= 5 && (
                <p className="text-[10px] text-orange-400 font-medium mt-0.5">Plus que {product.stock_quantity} en stock</p>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-green-neon text-black font-semibold uppercase tracking-wider py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <ShoppingCart className="w-4 h-4" />
              {addedFeedback ? 'AJOUTÉ' : 'AJOUTER AU PANIER'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
