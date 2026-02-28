import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import StockBadge from './StockBadge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openSidebar = useCartStore((s) => s.openSidebar);

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    addItem(product);
    openSidebar();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-all duration-300"
    >
      {/* Featured badge */}
      {product.is_featured && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-green-primary px-2 py-0.5 rounded-full text-xs font-semibold text-white">
          <Star className="w-3 h-3" />
          Populaire
        </div>
      )}

      {/* Image */}
      <Link to={`/catalogue/${product.slug}`} className="block aspect-square overflow-hidden">
        <img
          src={product.image_url ?? 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <Link
            to={`/catalogue/${product.slug}`}
            className="font-serif font-semibold text-white hover:text-green-primary transition-colors line-clamp-1"
          >
            {product.name}
          </Link>
          {product.description && (
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {product.cbd_percentage != null && (
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
              CBD {product.cbd_percentage}%
            </span>
          )}
          {product.weight_grams != null && (
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
              {product.weight_grams}g
            </span>
          )}
          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
            THC &lt; {product.thc_max ?? 0.2}%
          </span>
        </div>

        <StockBadge stock={product.stock_quantity} />

        {/* Price + Add to cart */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xl font-bold text-white">
            {product.price.toFixed(2)} €
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!product.is_available || product.stock_quantity === 0}
            className="flex items-center gap-2 bg-green-primary hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>
    </motion.div>
  );
}
