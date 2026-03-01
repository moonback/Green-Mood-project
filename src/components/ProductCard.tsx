import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Package, RefreshCw, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import StockBadge from './StockBadge';
import StarRating from './StarRating';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openSidebar = useCartStore((s) => s.openSidebar);

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    addItem(product);
    // Suggest visual feedback here later if needed
  };

  // Limit visible tags
  const attributes: { label: string; icon?: string }[] = [];
  if (product.cbd_percentage != null) attributes.push({ label: `${product.cbd_percentage}% CBD` });

  const benefits = (product.attributes?.benefits || []).slice(0, 1);
  benefits.forEach(b => attributes.push({ label: b }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      className="group relative flex flex-col h-full"
    >
      {/* Premium Container */}
      <div className="relative flex flex-col h-full bg-zinc-900/40 rounded-[2rem] border border-white/[0.05] overflow-hidden transition-all duration-500 hover:border-green-neon/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:-translate-y-1">

        {/* badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {product.is_featured && (
            <div className="bg-green-neon text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(57,255,20,0.4)]">
              Elite Selection
            </div>
          )}
          {product.is_bundle && (
            <div className="bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
              Bundle
            </div>
          )}
        </div>

        {/* Favorite/Share placeholder or Subscription indicator */}
        {product.is_subscribable && (
          <div className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-950/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-green-neon">
            <RefreshCw className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Image Section */}
        <Link
          to={`/catalogue/${product.slug}`}
          className="relative aspect-[4/5] overflow-hidden bg-zinc-800"
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60 z-10" />

          <motion.img
            src={product.image_url ?? 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Quick view button (visual only for now) */}
          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-full scale-90 group-hover:scale-100 transition-transform duration-300">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </Link>

        {/* Info Section */}
        <div className="flex flex-col flex-grow p-6 pt-5">
          {/* Attributes */}
          <div className="flex flex-wrap gap-2 mb-3">
            {attributes.map((attr, i) => (
              <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-0.5">
                {attr.label}
              </span>
            ))}
          </div>

          <Link
            to={`/catalogue/${product.slug}`}
            className="text-lg font-serif font-bold text-white mb-2 line-clamp-1 hover:text-green-neon transition-colors"
          >
            {product.name}
          </Link>

          <div className="flex items-center gap-2 mb-4">
            {product.avg_rating > 0 ? (
              <div className="flex items-center gap-1.5">
                <div className="flex text-green-neon">
                  <Star className="w-3 h-3 fill-current" />
                </div>
                <span className="text-[10px] font-bold text-zinc-500">{product.avg_rating.toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Nouveauté</span>
            )}
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <StockBadge stock={product.stock_quantity} />
          </div>

          {/* Footer Card */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">
                {product.price.toFixed(2)}€
              </span>
              {product.original_value && product.original_value > product.price && (
                <span className="text-[10px] text-zinc-500 line-through">
                  {product.original_value.toFixed(2)}€
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.is_available || product.stock_quantity === 0}
              className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/[0.08] flex items-center justify-center text-white hover:bg-green-neon hover:text-black hover:border-green-neon hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-300 active:scale-90 disabled:opacity-30"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
