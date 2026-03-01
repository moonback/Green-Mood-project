import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Package, RefreshCw, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { useWishlistStore } from '../store/wishlistStore';
import StockBadge from './StockBadge';
import StarRating from './StarRating';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openSidebar = useCartStore((s) => s.openSidebar);
  const addToast = useToastStore((s) => s.addToast);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isWished = useWishlistStore((s) => s.hasItem(product.id));

  const handleToggleWishlist = (e: MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
    addToast({
      message: isWished ? `${product.name} retiré des favoris` : `${product.name} ajouté aux favoris`,
      type: isWished ? 'info' : 'success',
    });
  };

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    addItem(product);
    openSidebar();
    addToast({ message: `${product.name} ajouté au panier`, type: 'success' });
  };

  // Limit to 2 key tags for cleaner card
  const tags: { label: string; variant: 'spec' | 'benefit' | 'aroma' }[] = [];
  if (product.cbd_percentage != null) tags.push({ label: `CBD ${product.cbd_percentage}%`, variant: 'spec' });
  if (product.weight_grams != null && tags.length < 2) tags.push({ label: `${product.weight_grams}g`, variant: 'spec' });
  for (const b of (product.attributes?.benefits || []).slice(0, 1)) {
    if (tags.length < 2) tags.push({ label: b, variant: 'benefit' });
  }

  const tagStyles = {
    spec: 'bg-white/[0.06] text-zinc-300 border border-white/[0.06]',
    benefit: 'bg-green-900/20 text-green-400 border border-green-800/30',
    aroma: 'bg-white/[0.04] text-zinc-400 border border-white/[0.06]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative bg-zinc-900/50 rounded-2xl border border-white/[0.06] overflow-hidden hover:border-green-neon/20 transition-colors duration-300"
    >
      {/* Bundle badge */}
      {product.is_bundle && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-purple-600/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-semibold text-white">
          <Package className="w-3 h-3" />
          Pack
        </div>
      )}

      {/* Featured badge */}
      {product.is_featured && !product.is_bundle && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-green-neon/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-semibold text-black glow-pulse-green">
          <Star className="w-3 h-3" />
          Populaire
        </div>
      )}

      {/* Wishlist + Subscription badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleToggleWishlist}
          className={`flex items-center justify-center w-8 h-8 rounded-xl border backdrop-blur-md transition-all ${isWished
            ? 'bg-red-500/90 border-red-500/50 text-white'
            : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/30'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
        </button>
        {product.is_subscribable && (
          <div className="flex items-center justify-center w-8 h-8 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-white/10 text-green-neon">
            <RefreshCw className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Image — aspect 4:5 coherent with product detail */}
      <Link to={`/catalogue/${product.slug}`} className="block aspect-[4/5] overflow-hidden bg-zinc-800/50">
        <img
          src={product.image_url ?? 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag.label} className={`text-xs px-2 py-0.5 rounded-lg ${tagStyles[tag.variant]}`}>
              {tag.label}
            </span>
          ))}
        </div>

        {/* Name */}
        <Link
          to={`/catalogue/${product.slug}`}
          className="block font-serif font-semibold text-base text-white leading-snug line-clamp-1 group-hover:text-green-neon transition-colors duration-300"
        >
          {product.name}
        </Link>

        {/* Star rating */}
        {product.avg_rating !== undefined && product.avg_rating > 0 && (
          <StarRating
            rating={product.avg_rating}
            size="sm"
            showCount
            count={product.review_count}
          />
        )}

        <StockBadge stock={product.stock_quantity} />

        {/* Price + Add to cart */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-lg font-bold text-green-neon glow-green">
              {product.price.toFixed(2)} €
            </span>
            {product.is_bundle && product.original_value && product.original_value > product.price && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-zinc-500 line-through">
                  {product.original_value.toFixed(2)} €
                </span>
                <span className="text-xs font-semibold text-purple-400 bg-purple-900/25 px-1.5 py-0.5 rounded-lg">
                  −{(product.original_value - product.price).toFixed(2)} €
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.is_available || product.stock_quantity === 0}
            className="flex items-center gap-2 bg-green-neon text-black text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-[0_0_16px_rgba(57,255,20,0.35)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            <ShoppingCart className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>
    </motion.div>
  );
}
