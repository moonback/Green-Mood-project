import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, X, Sparkles, Filter, LayoutGrid, CalendarCheck, Info, ShieldCheck, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
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
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

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

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'rating': return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
      case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default: return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = sorted.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedCategory, selectedBenefit, selectedAroma, searchQuery, sortBy]);

  const activeFilterCount = [selectedBenefit, selectedAroma].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <SEO
        title="Archives N10 & CBD — L'Excellence Green Mood"
        description="Explorez l'univers moléculaire du N10 et des meilleurs extraits de CBD. Livraison discrète et Click & Collect."
      />

      {/* ────────── Hero Header ────────── */}
      <section className="relative min-h-[55vh] md:min-h-[60vh] flex items-center pt-32 pb-16 px-5 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
          >
            <img
              src="/images/products-flower.png"
              alt="Molécule N10 d'exception"
              className="w-full h-full object-cover opacity-60 blur-[2px]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/60 to-zinc-950" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-green-neon animate-pulse" />
            <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">L'Innovation N10 est ici</span>
          </motion.div>

          <div className="space-y-5">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tighter leading-none mb-8"
            >
              ARCHIVES <br />
              <span className="not-italic text-green-neon glow-green">MOLECULE</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto font-serif italic leading-relaxed"
            >
              Explorez une curatoriale sans compromis des extractions les plus pures et des molécules de synthèse maîtrisée.
            </motion.p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-12 relative max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl transition-all hover:border-white/[0.12]">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full bg-transparent border-none rounded-xl pl-12 pr-10 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl transition-all text-sm font-semibold ${showFilters || activeFilterCount > 0
                  ? 'bg-green-neon text-black'
                  : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08]'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-black/20 text-xs flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── Main Content ────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-20">
        {/* Filters Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Benefits */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-green-neon" />
                      Bénéfices
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {allBenefits.map((benefit) => (
                        <button
                          key={benefit}
                          onClick={() => setSelectedBenefit(selectedBenefit === benefit ? null : benefit)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all border ${selectedBenefit === benefit
                            ? 'bg-green-neon border-transparent text-black font-semibold'
                            : 'bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]'
                            }`}
                        >
                          {benefit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aromas */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-green-neon" />
                      Signatures Olfactives
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {allAromas.map((aroma) => (
                        <button
                          key={aroma}
                          onClick={() => setSelectedAroma(selectedAroma === aroma ? null : aroma)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all border ${selectedAroma === aroma
                            ? 'bg-white border-transparent text-black font-semibold'
                            : 'bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]'
                            }`}
                        >
                          {aroma}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
                  <p className="text-xs text-zinc-600">
                    {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => { setSelectedBenefit(null); setSelectedAroma(null); setSelectedCategory(null); setSearchQuery(''); }}
                    className="text-xs text-zinc-500 hover:text-red-400 font-medium transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Réinitialiser
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Navigation */}
        <div className="sticky top-20 z-30 mb-10">
          <div className="bg-zinc-950/70 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${!selectedCategory
                ? 'bg-white text-black'
                : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tout
            </button>

            <div className="w-px h-5 bg-white/[0.08] mx-1" />

            <div className="flex items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${selectedCategory === cat.id
                    ? 'bg-green-neon text-black'
                    : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3 pr-2 lg:pr-4">
              <div className="w-px h-5 bg-white/[0.08] hidden lg:block" />
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-2 text-xs font-semibold text-zinc-400 focus:outline-none focus:border-green-neon/40 cursor-pointer"
                >
                  <option value="featured">Populaires</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix decroissant</option>
                  <option value="rating">Mieux notes</option>
                  <option value="newest">Nouveautes</option>
                </select>
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              </div>
              <span className="text-xs text-zinc-600 hidden lg:inline">
                <span className="text-green-neon font-semibold">{filtered.length}</span> produit{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-white/[0.04] rounded-2xl" />
                <div className="p-4 space-y-3">
                  <div className="flex gap-1.5">
                    <div className="h-5 bg-white/[0.04] rounded-lg w-12" />
                    <div className="h-5 bg-white/[0.04] rounded-lg w-8" />
                  </div>
                  <div className="h-5 bg-white/[0.04] rounded-lg w-3/4" />
                  <div className="h-8 bg-white/[0.04] rounded-xl w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 space-y-8"
          >
            <div className="w-24 h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-serif font-bold text-white">Aucun résultat</h2>
              <p className="text-zinc-500 max-w-sm mx-auto text-sm">
                Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
              </p>
            </div>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedBenefit(null); setSelectedAroma(null); }}
              className="px-6 py-3 bg-green-neon text-black font-semibold rounded-xl hover:shadow-[0_0_16px_rgba(57,255,20,0.3)] transition-all text-sm"
            >
              Réinitialiser les filtres
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                      delay: idx * 0.04,
                      duration: 0.35,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    layout
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                    className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all ${page === currentPage
                      ? 'bg-green-neon text-black'
                      : 'bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-white hover:border-white/[0.15]'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* BudTender CTA */}
        <div className="mt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]" />
            <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-green-neon/5 rounded-full blur-[120px]" />
            <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[120px]" />

            <div className="relative z-10 px-8 md:px-14 py-14 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="max-w-lg space-y-5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-neon/10 border border-green-neon/15 text-green-neon text-xs font-semibold uppercase tracking-wider">
                  BudTender IA Connecté
                </div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold leading-tight uppercase">
                  TROUVEZ VOTRE <br /> <span className="text-green-neon">FRÉQUENCE.</span>
                </h3>
                <p className="text-zinc-500 text-sm md:text-base max-w-sm mx-auto lg:mx-0">
                  Laissez notre technologie d'analyse vous guider vers le produit parfaitement calibré pour vos besoins.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <button
                  onClick={() => {
                    const btn = document.querySelector('[aria-label="Toggle BudTender"]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="flex-1 lg:flex-none px-8 py-4 bg-green-neon text-black font-semibold rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all text-sm"
                >
                  Lancer le Diagnostic
                </button>
                <Link
                  to="/contact"
                  className="flex-1 lg:flex-none px-8 py-4 bg-white/[0.05] border border-white/[0.08] text-white font-medium rounded-2xl hover:bg-white/[0.08] transition-all text-sm text-center"
                >
                  Expert Live Chat
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Compliance Footer */}
        <div className="mt-20 pt-12 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: <ShieldCheck className="w-4 h-4" />,
              title: "Conformité Normative",
              text: "Tous nos produits sont analysés en laboratoires indépendants et garantissent un taux de THC < 0.3% conformément à la réglementation européenne."
            },
            {
              icon: <CalendarCheck className="w-4 h-4" />,
              title: "Vérification d'Identité",
              text: "L'accès à nos produits est strictement réservé aux personnes majeures. Un justificatif d'identité peut être requis lors du retrait ou de la livraison."
            },
            {
              icon: <Info className="w-4 h-4" />,
              title: "Guide d'Utilisation",
              text: "Nos produits sont destinés à un usage sensoriel et collectionneur. Ne pas fumer. Consulter un professionnel de santé en cas de doute."
            }
          ].map((item, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <span className="text-green-neon">{item.icon}</span>
                {item.title}
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
