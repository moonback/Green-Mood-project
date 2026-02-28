import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingCart, Leaf, FlaskConical, Weight, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import StockBadge from '../components/StockBadge';
import QuantitySelector from '../components/QuantitySelector';
import SEO from '../components/SEO';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const openSidebar = useCartStore((s) => s.openSidebar);

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
        setProduct(data as Product);
        setIsLoading(false);
      });
  }, [slug, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    if (quantity > 1) updateQuantity(product.id, quantity);
    openSidebar();
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

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
            {product.is_featured && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-green-primary px-3 py-1 rounded-full text-sm font-semibold text-white">
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

            {product.description && (
              <p className="text-zinc-400 leading-relaxed text-lg">{product.description}</p>
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
            <div className="text-4xl font-bold">{product.price.toFixed(2)} €</div>

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
                  className="flex-1 flex items-center justify-center gap-2 bg-green-primary hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all"
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

            {/* Legal */}
            <p className="text-xs text-zinc-600 leading-relaxed">
              Produit contenant moins de 0,3% de THC. Conforme à la réglementation française (décret n°2021-1282).
              Vente réservée aux personnes âgées de 18 ans et plus.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
