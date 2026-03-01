import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart,
  ChevronLeft,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Info,
  ChevronRight,
  Plus,
  Minus,
  MessageSquare,
  Package,
  Calendar,
  Zap,
  Check,
  CheckCircle2,
  Gift
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Review } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscriptionInterval, setSubscriptionInterval] = useState('monthly');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [upsells, setUpsells] = useState<Product[]>([]);

  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error loading product:', error);
      } else {
        setProduct(data);
        // Load reviews
        const [{ data: reviewsData }, { data: upsellsData }] = await Promise.all([
          supabase.from('reviews').select('*').eq('product_id', data.id).eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from('products').select('*').eq('category_id', data.category_id).neq('id', data.id).limit(2)
        ]);

        if (reviewsData) setReviews(reviewsData);
        if (upsellsData) setUpsells(upsellsData);
      }
      setLoading(false);
    }

    loadProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (product) {
      if (showSubscription) {
        addItem(product, quantity, true, subscriptionInterval as any);
      } else {
        addItem(product, quantity);
      }
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 2000);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;

    setIsSubmittingReview(true);
    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: product.id,
        user_id: user.id,
        user_name: user.user_metadata.full_name || 'Utilisateur anonyme',
        rating: newReview.rating,
        comment: newReview.comment,
        is_verified_purchase: false,
        is_active: true,
        is_published: true
      });

    if (error) {
      alert('Erreur lors de l\'envoi de l\'avis');
    } else {
      setNewReview({ rating: 5, comment: '' });
      // Reload reviews
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data) setReviews(data);
    }
    setIsSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-green-neon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-5 text-center">
        <Package className="w-16 h-16 text-zinc-700 mb-6" />
        <h1 className="text-3xl font-serif font-bold text-white mb-4">Produit introuvable</h1>
        <p className="text-zinc-400 mb-8 max-w-md">Nous n'avons pas trouvé le produit que vous recherchez. Il a peut-être été retiré ou son lien a changé.</p>
        <Link to="/catalogue" className="px-8 py-3 bg-green-neon text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all uppercase tracking-wider text-sm">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  const images = product ? [product.image_url, ...(product.gallery_urls || [])].filter(Boolean) : [];

  return (
    <div className="bg-zinc-950 min-h-screen pb-24 lg:pb-12">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6">
        <nav className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-green-neon transition-colors">Accueil</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <Link to="/catalogue" className="hover:text-green-neon transition-colors">Catalogue</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          {product.category && (
            <>
              <Link to={`/catalogue?category=${product.category.slug}`} className="hover:text-green-neon transition-colors">{product.category.name}</Link>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
            </>
          )}
          <span className="text-zinc-300 truncate">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Product Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-white/[0.05] relative group"
            >
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {!product.is_available || product.stock_quantity <= 0 ? (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="px-6 py-2 bg-zinc-800 text-zinc-400 font-bold rounded-lg border border-zinc-700">RUPTURE DE STOCK</span>
                </div>
              ) : product.stock_quantity < 10 && (
                <div className="absolute top-5 right-5">
                  <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-full backdrop-blur-md">
                    PLUS QUE {product.stock_quantity} EN STOCK
                  </span>
                </div>
              )}
            </motion.div>

            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImage === idx ? 'border-green-neon shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {product.category && (
                  <span className="px-3 py-1 bg-green-neon/10 border border-green-neon/20 text-green-neon text-[10px] font-bold rounded-full uppercase tracking-widest">
                    {product.category.name}
                  </span>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="flex text-green-neon">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(averageRating) ? 'fill-current' : 'opacity-30'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-500">({reviews.length} avis)</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
                {product.name}
              </h1>

              <div className="flex items-end gap-3 pt-2">
                <span className="text-3xl font-serif font-bold text-white">{product.price.toFixed(2)}€</span>
                <span className="text-zinc-500 text-sm mb-1.5">TVA incluse</span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-zinc-400 leading-relaxed">
              {product.description.length > 200
                ? `${product.description.substring(0, 200)}...`
                : product.description}
            </p>

            {/* Add to Cart Section */}
            <div className="space-y-6 pt-4 border-t border-white/[0.06]">
              {product.is_available && product.stock_quantity > 0 ? (
                <>
                  {/* Quantity & Add to Cart */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center bg-zinc-900 border border-white/[0.08] rounded-2xl p-1 h-14 w-full sm:w-40">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center font-bold text-white">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        className="w-12 h-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-wider transition-all ${addedFeedback
                        ? 'bg-white text-black'
                        : 'bg-green-neon text-black hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98'
                        }`}
                    >
                      {addedFeedback ? (
                        <>
                          <Check className="w-5 h-5" />
                          Ajouté au panier
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          Ajouter au panier
                        </>
                      )}
                    </button>
                  </div>

                  {/* Subscription Option */}
                  <div className={`p-4 rounded-3xl border transition-all ${showSubscription
                    ? 'bg-green-neon/5 border-green-neon/30'
                    : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
                    }`}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={showSubscription}
                          onChange={(e) => setShowSubscription(e.target.checked)}
                        />
                        <div className="w-5 h-5 border-2 border-zinc-600 rounded-lg group-hover:border-green-neon/50 transition-colors peer-checked:bg-green-neon peer-checked:border-green-neon" />
                        <Check className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">S'abonner et économiser 15%</span>
                          <span className="px-1.5 py-0.5 bg-green-neon/20 text-green-neon text-[9px] font-bold rounded uppercase">Recommandé</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Livraison récurrente sans engagement pour votre bien-être quotidien.</p>
                      </div>
                    </label>

                    <AnimatePresence>
                      {showSubscription && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 grid grid-cols-2 gap-2">
                            {['biweekly', 'monthly', 'quarterly'].map((interval) => (
                              <button
                                key={interval}
                                onClick={() => setSubscriptionInterval(interval)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${subscriptionInterval === interval
                                  ? 'bg-green-neon text-black border-green-neon shadow-[0_0_12px_rgba(57,255,20,0.3)]'
                                  : 'bg-black/40 text-zinc-400 border-white/[0.05] hover:border-white/[0.1]'
                                  }`}
                              >
                                {interval === 'biweekly' ? '2 semaines' : interval === 'monthly' ? 'Mensuel' : 'Trimestriel'}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/[0.05] text-center">
                  <p className="text-zinc-400 mb-4">Ce produit est actuellement indisponible.</p>
                  <button className="w-full h-12 rounded-xl border border-white/[0.08] text-zinc-400 text-xs font-bold uppercase tracking-widest hover:bg-white/[0.02] transition-all">
                    M'avertir du retour en stock
                  </button>
                </div>
              )}

              {/* Loyalty Reward Progress */}
              <div className="p-6 rounded-3xl bg-green-neon/[0.03] border border-green-neon/10 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-neon/10 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-green-neon" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">RÉCOMPENSE FIDÉLITÉ</span>
                  </div>
                  <span className="text-[10px] font-black text-green-neon uppercase tracking-widest">+{Math.floor(product.price * 10)} POINTS</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Niveau Bronze</span>
                    <span>Prochain palier : -10€</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/[0.03]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-green-neon/40 to-green-neon shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500 italic mt-2">Plus que 350 points pour débloquer votre bon d'achat premium.</p>
                </div>
              </div>

              {/* Trust Bar */}
              <div className="grid grid-cols-3 gap-2 pt-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.05] flex items-center justify-center">
                    <Truck className="w-4 h-4 text-green-neon" />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Expédition<br />sous 24h</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.05] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-green-neon" />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Paiement<br />Sécurisé</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.05] flex items-center justify-center">
                    <RotateCcw className="w-4 h-4 text-green-neon" />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Garantie<br />Satisfait</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together */}
        {upsells.length > 0 && (
          <div className="mt-24 p-8 sm:p-10 rounded-[2.5rem] bg-zinc-900/30 border border-white/[0.05] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 text-white/[0.02] pointer-events-none">
              <Plus className="w-32 h-32" />
            </div>

            <h3 className="text-xl font-serif font-bold text-white mb-8 flex items-center gap-3">
              <Zap className="w-5 h-5 text-green-neon" />
              SOUVENT ACHETÉS ENSEMBLE
            </h3>

            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="flex items-center gap-4 sm:gap-8">
                {/* Main Product */}
                <div className="w-24 sm:w-32 aspect-square rounded-2xl overflow-hidden border border-white/10 shrink-0">
                  <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                </div>

                <Plus className="w-6 h-6 text-zinc-600 shrink-0" />

                {/* Upsell Product */}
                <div className="w-24 sm:w-32 aspect-square rounded-2xl overflow-hidden border border-white/10 shrink-0 relative group">
                  <img src={upsells[0].image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link to={`/catalogue/${upsells[0].slug}`} className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left">
                <p className="text-zinc-400 text-sm mb-1 italic">Duo Moléculaire Recommandé :</p>
                <h4 className="text-white font-bold mb-4">{product.name} + {upsells[0].name}</h4>
                <div className="flex items-center justify-center lg:justify-start gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-serif font-black text-green-neon">{((product.price + upsells[0].price) * 0.9).toFixed(2)}€</span>
                    <span className="text-xs text-zinc-500 line-through">{(product.price + upsells[0].price).toFixed(2)}€</span>
                  </div>
                  <button
                    onClick={() => {
                      addItem(product);
                      addItem(upsells[0]);
                      setAddedFeedback(true);
                      setTimeout(() => setAddedFeedback(false), 3000);
                    }}
                    className="px-8 py-3.5 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-green-neon transition-all shadow-xl active:scale-95"
                  >
                    Ajouter le pack duo (−10%)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Tabs */}
        <div className="mt-20">
          <div className="flex gap-8 border-b border-white/[0.06] mb-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'description', label: 'Description' },
              { id: 'specs', label: 'Spécifications' },
              { id: 'reviews', label: `Avis (${reviews.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-2 text-xs font-bold uppercase tracking-[0.2em] relative transition-all ${activeTab === tab.id ? 'text-green-neon' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-neon shadow-[0_0_10px_rgba(57,255,20,0.5)]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="prose prose-invert prose-zinc max-w-none text-zinc-400 leading-relaxed"
                >
                  <p className="whitespace-pre-line leading-loose">{product.description}</p>
                </motion.div>
              )}

              {activeTab === 'specs' && (
                <motion.div
                  key="specs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-4">
                      <h4 className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Informations Générales</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 border-b border-zinc-500/10 flex-grow mr-4 pb-1">Nom</span>
                          <span className="text-zinc-300 font-medium">{product.name}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 border-b border-zinc-500/10 flex-grow mr-4 pb-1">Catégorie</span>
                          <span className="text-zinc-300 font-medium">{product.category?.name}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 border-b border-zinc-500/10 flex-grow mr-4 pb-1">Stock disponnible</span>
                          <span className="text-zinc-300 font-medium">{product.stock_quantity > 0 ? product.stock_quantity : 'Sur commande'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-4">
                      <h4 className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Attributs Produits</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 border-b border-zinc-500/10 flex-grow mr-4 pb-1">Origine</span>
                          <span className="text-zinc-300 font-medium">Suisse / Premium</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 border-b border-zinc-500/10 flex-grow mr-4 pb-1">Taux THC</span>
                          <span className="text-zinc-300 font-medium">&lt; 0.3%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 border-b border-zinc-500/10 flex-grow mr-4 pb-1">Culture</span>
                          <span className="text-zinc-300 font-medium">Greenhouse / Hydro</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lab Reports / COA Card */}
                  <div className="p-8 rounded-3xl bg-green-neon/[0.02] border border-green-neon/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-green-neon/5 opacity-50 group-hover:opacity-100 transition-opacity">
                      <ShieldCheck className="w-16 h-16" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                      <div className="w-20 h-20 rounded-2xl bg-green-neon/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-10 h-10 text-green-neon" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="text-xl font-serif font-bold text-white mb-2">Certificats d'Analyse (COA)</h4>
                        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                          La transparence est au cœur de notre démarche. Chaque lot est rigoureusement testé par des laboratoires tiers indépendants pour garantir une pureté absolue et une conformité légale totale.
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/[0.1] transition-all">
                            <Info className="w-4 h-4 text-green-neon" />
                            Voir le rapport PDF
                          </button>
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-neon/20 bg-green-neon/5">
                            <ShieldCheck className="w-4 h-4 text-green-neon" />
                            <span className="text-[10px] font-black text-green-neon uppercase tracking-widest">Garanti &lt; 0.3% THC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  {/* Reviews Summary */}
                  <div className="flex flex-col md:flex-row items-center gap-10 p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-center md:text-left space-y-3">
                      <div className="text-5xl font-serif font-bold text-white">{averageRating.toFixed(1)}</div>
                      <div className="flex text-green-neon justify-center md:justify-start">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-5 h-5 ${s <= Math.round(averageRating) ? 'fill-current' : 'opacity-30'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Basé sur {reviews.length} avis</p>
                    </div>

                    <div className="flex-grow w-full space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviews.filter(r => r.rating === rating).length;
                        const p = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center gap-4 text-xs">
                            <span className="w-2 font-bold text-zinc-400">{rating}</span>
                            <div className="flex-grow h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${p}%` }}
                                className="h-full bg-green-neon"
                              />
                            </div>
                            <span className="w-10 text-zinc-600 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Form */}
                  {user ? (
                    <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 flex items-center gap-2 text-green-neon/20 pointer-events-none">
                        <MessageSquare className="w-12 h-12" />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-white mb-6">Écrire un avis</h3>
                      <form onSubmit={handleSubmitReview} className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Votre Note</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setNewReview({ ...newReview, rating: s })}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${s <= newReview.rating ? 'bg-green-neon text-black' : 'bg-zinc-900 text-zinc-600 hover:text-zinc-400'
                                  }`}
                              >
                                <Star className={`w-5 h-5 ${s <= newReview.rating ? 'fill-current' : ''}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Votre Commentaire</label>
                          <textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            placeholder="Partagez votre expérience avec ce produit..."
                            rows={4}
                            className="w-full bg-zinc-950 border border-white/[0.08] rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="px-8 h-12 bg-green-neon text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] disabled:opacity-50 transition-all uppercase tracking-wider text-xs"
                        >
                          {isSubmittingReview ? 'Envoi en cours...' : 'Publier l\'avis'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-10 rounded-3xl border border-dashed border-white/[0.1] text-center">
                      <p className="text-zinc-500 mb-6">Vous devez être connecté pour laisser un avis sur ce produit.</p>
                      <Link to="/connexion" className="px-6 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white text-xs font-bold rounded-xl hover:bg-white/[0.08] transition-all uppercase tracking-widest">
                        Se connecter
                      </Link>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review.id} className="p-8 rounded-3xl bg-white/[0.01] border border-white/[0.05] space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex gap-1 text-green-neon mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-current' : 'opacity-20'}`} />
                                ))}
                              </div>
                              <h4 className="font-bold text-white uppercase tracking-wider text-xs">{review.user_name}</h4>
                              <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {review.is_verified_purchase && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-neon/10 border border-green-neon/20 rounded-full">
                                <ShieldCheck className="w-3 h-3 text-green-neon" />
                                <span className="text-[9px] font-bold text-green-neon uppercase tracking-tighter">Achat vérifié</span>
                              </div>
                            )}
                          </div>
                          <p className="text-zinc-400 text-sm leading-relaxed">"{review.comment}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20">
                        <MessageSquare className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
                        <p className="text-zinc-400">Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile Only) */}
      <AnimatePresence>
        {product.is_available && product.stock_quantity > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 z-40 lg:hidden p-4 bg-zinc-950/80 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-4 max-w-lg mx-auto">
              <div className="flex-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Prix unitaire</p>
                <p className="text-xl font-serif font-bold text-white">{product.price.toFixed(2)}€</p>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-[2] bg-green-neon text-black font-bold uppercase tracking-wider py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-95 transition-all text-sm flex items-center justify-center gap-3"
              >
                <ShoppingCart className="w-4 h-4" />
                {addedFeedback ? 'DÉPOSÉ' : 'ACQUÉRIR'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
