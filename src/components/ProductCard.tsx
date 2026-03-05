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
    spec: 'bg-white/[0.05] text-zinc-300 border border-white/[0.1] backdrop-blur-md',
    benefit: 'bg-green-neon/10 text-green-neon border border-green-neon/20 backdrop-blur-md',
    aroma: 'bg-white/[0.03] text-zinc-400 border border-white/[0.05] backdrop-blur-md',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-zinc-900/30 rounded-[2rem] border border-white/10 overflow-hidden hover:border-green-neon/30 transition-all duration-500 shadow-xl"
    >
      {/* Background Glow Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Bundle badge */}
      {product.is_bundle && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-purple-600/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
          <Package className="w-3 h-3" />
          Pack
        </div>
      )}

      {/* Featured badge */}
      {product.is_featured && !product.is_bundle && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-green-neon text-black backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(57,255,20,0.4)]">
          <Star className="w-3 h-3 fill-current" />
          Elite
        </div>
      )}

      {/* Wishlist + Subscription badges */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleToggleWishlist}
          className={`flex items-center justify-center w-9 h-9 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${isWished
            ? 'bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
            : 'bg-zinc-950/40 border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/30'
            }`}
        >
          <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
        </button>
        {product.is_subscribable && (
          <div className="flex items-center justify-center w-9 h-9 bg-zinc-950/40 backdrop-blur-xl rounded-2xl border border-white/10 text-green-neon shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
          </div>
        )}
      </div>

      {/* Image — aspect 4:5 */}
      <Link to={`/catalogue/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-zinc-950/20 group-hover:bg-zinc-950/0 transition-colors duration-500">
        <img
          src={product.image_url ?? 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400'}
          alt={product.name}
          className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-500" />
      </Link>

      {/* Content */}
      <div className="p-5 md:p-6 space-y-4 relative z-10">
        <div className="space-y-2">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.label} className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${tagStyles[tag.variant]}`}>
                {tag.label}
              </span>
            ))}
          </div>

          {/* Name */}
          <Link
            to={`/catalogue/${product.slug}`}
            className="block font-serif font-bold text-lg md:text-xl text-white leading-tight line-clamp-1 group-hover:text-green-neon transition-colors duration-300"
          >
            {product.name}
          </Link>

          {/* Star rating */}
          {product.avg_rating !== undefined && product.avg_rating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating
                rating={product.avg_rating}
                size="sm"
                showCount={false}
              />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">({product.review_count})</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="space-y-0.5">
            <span className="text-xl md:text-2xl font-bold font-serif text-white tracking-tight">
              {product.price.toFixed(2)}<span className="text-green-neon ml-1">€</span>
            </span>
            {product.is_bundle && product.original_value && product.original_value > product.price && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 line-through">
                  {product.original_value.toFixed(2)}€
                </span>
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                  −{(product.original_value - product.price).toFixed(2)}€
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.is_available || product.stock_quantity === 0}
            className="flex items-center justify-center w-12 h-12 md:w-auto md:px-6 md:py-3 bg-green-neon text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] active:scale-95 disabled:opacity-30 group/btn"
          >
            <ShoppingCart className="w-4 h-4 md:mr-2 group-hover/btn:scale-110 transition-transform" />
            <span className="hidden md:inline">Ajouter</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
