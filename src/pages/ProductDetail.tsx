/**
 * ProductDetail.tsx
 *
 * Product detail page. All data fetching and business logic is handled by
 * useProductDetail. UI sub-sections are composed from focused components:
 * - ProductImageGallery: main image + thumbnails + badges
 * - ProductReviewSection: review list + form + eligibility CTA
 *
 * This component owns only UI state that is specific to the cart interaction
 * (quantity, addedFeedback) and renders the product info, specs, cart, bundle,
 * and subscription panels inline.
 */

import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CATEGORY_SLUGS } from '../lib/constants';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ShoppingCart,
  Leaf,
  FlaskConical,
  Weight,
  Star,
  RefreshCw,
  CheckCircle,
  Package,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Product, SubscriptionFrequency } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { useSettingsStore } from '../store/settingsStore';
import StockBadge from '../components/StockBadge';
import StarRating from '../components/StarRating';
import SEO from '../components/SEO';
import { buildProductSEO } from '../lib/seo/metaBuilder';
import { breadcrumbSchema, productSchema } from '../lib/seo/schemaBuilder';
import { buildInternalLinks } from '../lib/seo/internalLinks';
import RelatedProducts from '../components/RelatedProducts';
import FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether';
import ProductImageGallery from '../components/product/ProductImageGallery';
import ProductReviewSection from '../components/product/ProductReviewSection';
import { useProductDetail } from '../hooks/useProductDetail';

const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  weekly: 'Chaque semaine',
  biweekly: 'Toutes les 2 semaines',
  monthly: 'Chaque mois',
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const settings = useSettingsStore((s) => s.settings);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const openSidebar = useCartStore((s) => s.openSidebar);
  const addToast = useToastStore((s) => s.addToast);

  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const {
    product,
    bundleItems,
    productImages,
    isLoading,
    reviews,
    avgRating,
    canReview,
    reviewSuccess,
    subFrequency,
    setSubFrequency,
    subSuccess,
    subLoading,
    handleSubscribe,
    handleSubmitReview,
  } = useProductDetail({ slug, userId: user?.id });

  const isBulkProduct = (
    product?.category?.slug?.includes('fleurs') ||
    product?.category?.slug?.includes('resines') ||
    product?.category?.slug === 'nouveautes' ||
    product?.category?.slug === CATEGORY_SLUGS.FLOWERS ||
    product?.category?.slug === CATEGORY_SLUGS.RESINS
  );
  const isPerUnit = !isBulkProduct || product?.is_bundle || (!!product?.weight_grams && product?.weight_grams > 1 && !product?.name.toLowerCase().includes('pack'));
  const showWeightSelector = isBulkProduct && !isPerUnit;

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
        {...buildProductSEO(product)}
        schema={[
          productSchema({ ...product, avg_rating: avgRating || product.avg_rating, review_count: reviews.length || product.review_count }),
          breadcrumbSchema([
            { name: 'Accueil', path: '/' },
            { name: 'Catalogue', path: '/catalogue' },
            { name: product.name, path: `/catalogue/${product.slug}` },
          ]),
        ]}
        product={{
          price: product.price,
          currency: 'EUR',
          availability: product.is_available ? 'instock' : 'oos',
          sku: product.sku ?? undefined,
          brand: 'Green Mood CBD',
        }}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
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
          {/* Image Gallery */}
          <ProductImageGallery product={product} images={productImages} />

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

              <div className="flex flex-wrap gap-10">
                {(product.attributes?.benefits || []).length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-green-neon" /> Effets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.attributes.benefits!.map(b => (
                        <span key={b} className="text-[11px] font-bold uppercase tracking-wider text-green-neon/80 bg-green-neon/5 border border-green-neon/10 px-4 py-2 rounded-xl hover:border-green-neon/30 transition-all cursor-default">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(product.attributes?.aromas || []).length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Leaf className="w-3 h-3 text-green-neon" /> Arômes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.attributes.aromas!.map(a => (
                        <span key={a} className="text-[11px] font-bold uppercase tracking-wider text-white/60 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:border-white/20 transition-all cursor-default">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Specifications Bar */}
            <div className="flex items-center flex-wrap gap-8 py-2 border-y border-white/[0.04]">
              {product.cbd_percentage != null && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-neon/5 border border-green-neon/10 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-green-neon" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em] leading-tight">CBD Pureté</span>
                    <span className="text-lg font-serif font-bold text-white leading-tight">{product.cbd_percentage}%</span>
                  </div>
                </div>
              )}
              {product.thc_max != null && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em] leading-tight">THC Légal</span>
                    <span className="text-lg font-serif font-bold text-white leading-tight">&lt; {product.thc_max}%</span>
                  </div>
                </div>
              )}
              {product.weight_grams != null && product.weight_grams > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Weight className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em] leading-tight">Poids Net</span>
                    <span className="text-lg font-serif font-bold text-white leading-tight">{product.weight_grams}g</span>
                  </div>
                </div>
              )}
            </div>

            {/* Price & Cart Panel */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-10 relative overflow-hidden group/panel">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-neon/20 to-transparent" />

              <div className="flex items-start justify-between">
                <div className="flex flex-wrap gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isPerUnit ? 'Prix Unitaire' : 'Prix au gramme'}</p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl font-serif font-bold text-green-neon leading-none">
                        {product.price.toFixed(2)}<span className="text-sm ml-1 italic font-sans uppercase tracking-widest text-zinc-500">€{isPerUnit ? '' : '/g'}</span>
                      </p>
                      {product.original_value && product.original_value > product.price && (
                        <p className="text-sm font-medium text-zinc-600 line-through decoration-red-500/100">
                          {product.original_value.toFixed(2)} €
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-px h-10 bg-white/10 hidden sm:block" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-green-neon/60 font-black uppercase tracking-widest">
                      Total Sélectionné ({quantity} {isPerUnit ? `unité${quantity > 1 ? 's' : ''}` : 'g'})
                    </p>
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
                    {showWeightSelector && (
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
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-2 flex items-center">
                        <div className="flex items-center gap-1.5 px-3">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{isPerUnit ? 'Quantité:' : 'Poids:'}</span>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max={product.stock_quantity}
                            value={quantity}
                            onChange={handleQuantityChange}
                            className="w-12 bg-transparent text-sm font-black text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {!isPerUnit && <span className="text-[10px] text-zinc-500 font-bold">g</span>}
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

            <section className="mt-16 rounded-2xl border border-zinc-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Ressources & liens utiles</h2>
              <div className="flex flex-wrap gap-4">
                {buildInternalLinks(product).map((link) => (
                  <Link key={link.to} to={link.to} className="text-green-neon underline underline-offset-2">
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
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
        <ProductReviewSection
          reviews={reviews}
          avgRating={avgRating}
          canReview={canReview}
          reviewSuccess={reviewSuccess}
          onSubmitReview={handleSubmitReview}
        />

        {/* Related Products */}
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
                {(product.price * quantity).toFixed(2)}<span className="text-xs text-zinc-500 ml-1">€</span>
                {!isPerUnit && <span className="text-[10px] text-zinc-600 ml-1 uppercase">/g</span>}
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
