import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [selectedAroma, setSelectedAroma] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('name'),
      ]);
      setCategories((cats as Category[]) ?? []);

      const productList = (prods as Product[]) ?? [];

      // Batch-fetch published reviews to compute avg ratings without N+1
      if (productList.length > 0) {
        const productIds = productList.map((p) => p.id);
        const { data: ratingsData } = await supabase
          .from('reviews')
          .select('product_id, rating')
          .in('product_id', productIds)
          .eq('is_published', true);

        const ratingMap = new Map<string, { sum: number; count: number }>();
        (ratingsData ?? []).forEach((r: { product_id: string; rating: number }) => {
          const cur = ratingMap.get(r.product_id) ?? { sum: 0, count: 0 };
          ratingMap.set(r.product_id, { sum: cur.sum + r.rating, count: cur.count + 1 });
        });

        const withRatings = productList.map((p) => {
          const r = ratingMap.get(p.id);
          return r ? { ...p, avg_rating: r.sum / r.count, review_count: r.count } : p;
        });
        setProducts(withRatings);
      } else {
        setProducts(productList);
      }

      setIsLoading(false);
    }
    load();
  }, []);

  // Extraire les bénéfices et arômes uniques pour les filtres
  const allBenefits = Array.from(new Set(products.flatMap(p => p.attributes?.benefits || [])));
  const allAromas = Array.from(new Set(products.flatMap(p => p.attributes?.aromas || [])));

  const filtered = products.filter((p) => {
    const matchCat = !selectedCategory || p.category_id === selectedCategory;
    const matchBenefit = !selectedBenefit || (p.attributes?.benefits || []).includes(selectedBenefit);
    const matchAroma = !selectedAroma || (p.attributes?.aromas || []).includes(selectedAroma);
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchBenefit && matchAroma && matchSearch;
  });

  return (
    <>
      <SEO
        title="Catalogue en ligne — Green Mood CBD"
        description="Commandez nos fleurs CBD, résines, huiles et infusions en ligne. Click & Collect ou livraison à domicile."
        keywords="acheter CBD en ligne, fleurs CBD, huile CBD, résine CBD, livraison CBD France"
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-zinc-900 to-zinc-950 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl md:text-5xl font-bold mb-4"
          >
            Notre <span className="text-green-neon">Catalogue</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg max-w-xl mx-auto mb-8"
          >
            Trouvez le produit idéal selon vos besoins et vos goûts.
          </motion.p>

          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative flex-1"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-12 pr-10 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>

            {/* Filter Toggle Toggle Button (Mobile/Desktop) */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border transition-all font-medium ${showFilters || selectedBenefit || selectedAroma
                ? 'bg-green-neon/10 border-green-neon text-green-neon'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filtres Avancés
              {(selectedBenefit || selectedAroma) && (
                <span className="w-2 h-2 rounded-full bg-green-neon animate-pulse" />
              )}
            </motion.button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Advaned Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Benefits */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Besoin & Bénéfice</h3>
                    <div className="flex flex-wrap gap-2">
                      {allBenefits.length > 0 ? (
                        allBenefits.map((benefit) => (
                          <button
                            key={benefit}
                            onClick={() => setSelectedBenefit(selectedBenefit === benefit ? null : benefit)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedBenefit === benefit
                              ? 'bg-green-neon border-green-primary text-black font-bold'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                              }`}
                          >
                            {benefit}
                          </button>
                        ))
                      ) : (
                        <p className="text-zinc-600 text-xs italic">Aucun bénéfice trouvé</p>
                      )}
                    </div>
                  </div>

                  {/* Aromas */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Notes Aromatiques</h3>
                    <div className="flex flex-wrap gap-2">
                      {allAromas.length > 0 ? (
                        allAromas.map((aroma) => (
                          <button
                            key={aroma}
                            onClick={() => setSelectedAroma(selectedAroma === aroma ? null : aroma)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedAroma === aroma
                              ? 'bg-zinc-100 border-white text-black font-bold'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                              }`}
                          >
                            {aroma}
                          </button>
                        ))
                      ) : (
                        <p className="text-zinc-600 text-xs italic">Aucune note trouvée</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-end lg:justify-end">
                    <button
                      onClick={() => { setSelectedBenefit(null); setSelectedAroma(null); setSelectedCategory(null); setSearchQuery(''); }}
                      className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Réinitialiser tous les filtres
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories (Tabs) */}
        <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-zinc-800 pb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${!selectedCategory
              ? 'bg-zinc-100 border-white text-black'
              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
          >
            Tous les formats
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedCategory === cat.id
                ? 'bg-zinc-100 border-white text-black'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
            >
              {cat.name}
            </button>
          ))}
          <span className="ml-auto text-sm text-zinc-500">
            {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden animate-pulse">
                <div className="aspect-square bg-zinc-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg">Aucun produit trouvé.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
              className="mt-4 text-green-neon hover:underline text-sm"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Legal notice */}
        <div className="mt-12 p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-500 text-center">
          Tous nos produits contiennent moins de 0,3% de THC et sont conformes à la réglementation française et européenne.
          Vente réservée aux personnes majeures. Ne pas utiliser en cas de grossesse ou d'allaitement.
        </div>
      </section>
    </>
  );
}
