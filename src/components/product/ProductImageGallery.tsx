/**
 * ProductImageGallery.tsx
 *
 * Displays the main product image with animated transitions and a thumbnail
 * strip for multi-image products. Renders featured/bundle badges as overlays.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Package } from 'lucide-react';
import { Product } from '../../lib/types';

interface ProductImageGalleryProps {
    product: Product;
    images: string[];
}

export default function ProductImageGallery({ product, images }: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const fallbackImage = 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800';
    const displayImage = images[activeIndex] || product.image_url || fallbackImage;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group lg:sticky lg:top-28"
        >
            {/* Decorative glow */}
            <div className="absolute inset-0 bg-green-neon/5 blur-[120px] -z-10 group-hover:bg-green-neon/10 transition-all duration-1000" />

            {/* Product badges */}
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

            {/* Main image */}
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] relative">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={activeIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        src={displayImage}
                        alt={`${product.name} - Image ${activeIndex + 1}`}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out shadow-inner"
                    />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent pointer-events-none" />
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
                <div className="flex gap-2 mt-4 justify-center">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === activeIndex
                                ? 'border-green-neon shadow-[0_0_12px_rgba(57,255,20,0.3)]'
                                : 'border-white/[0.08] opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={img}
                                alt={`Vue ${idx + 1}`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
