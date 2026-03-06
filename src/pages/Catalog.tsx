import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { Search, SlidersHorizontal, X, Sparkles, Filter, LayoutGrid, CalendarCheck, Info, ShieldCheck, ArrowUpDown, ChevronLeft, ChevronRight, Microscope, Zap, ArrowLeft, Link2, PackageCheck, BadgeCheck, Repeat } from 'lucide-react';
import { Category, Product } from '../lib/types';
import { fetchActiveCatalog } from '../services/catalogService';
import ProductCard from '../components/ProductCard';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuthStore } from '../store/authStore';
import { useCatalogFilters } from '../hooks/useCatalogFilters';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const {
    selectedCategory,
    setSelectedCategory,
    selectedBenefit,
    setSelectedBenefit,
    selectedAroma,
    setSelectedAroma,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    inStockOnly,
    setInStockOnly,
    featuredOnly,
    setFeaturedOnly,
    subscribableOnly,
    setSubscribableOnly,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    displayDensity,
    setDisplayDensity,
    currentPage,
    setCurrentPage,
    allBenefits,
    allAromas,
    priceBounds,
    filtered,
    paginatedProducts,
    totalPages,
    activeFilterCount,
    resetAllFilters,
  } = useCatalogFilters({
    products,
    searchParams,
    setSearchParams,
    productsPerPage: 12,
  });

  // Mouse follow effect for Hero glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    async function load() {
      try {
        const payload = await fetchActiveCatalog();
        setCategories(payload.categories);
        setProducts(payload.products);
      } catch (error) {
        console.error('Catalog loading error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleShareCatalog = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 1800);
    } catch {
      setShareStatus('error');
      window.setTimeout(() => setShareStatus('idle'), 1800);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 overflow-hidden">
      <SEO
        title="CBD PREMIUM • ANALYSÉ EN LABORATOIRE | N10 CBD"
        description="Explorez l'univers moléculaire du CBD Premium et des meilleurs extraits de CBD. Livraison express 24h à Paris et tests certifiés en laboratoire."
      />

      {/* ────────── Hero Header ────────── */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-20 px-5 overflow-hidden">
        {/* Grain Overlay */}
        <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Interactive Mouse-Following Glow */}
        <motion.div
          style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
          className="absolute z-0 w-[600px] h-[600px] bg-green-neon/10 rounded-full blur-[140px] pointer-events-none opacity-40 mix-blend-screen"
        />

        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
          >
            <img
              src="/images/N10.png"
              alt="Archives N10"
              className="w-full h-full object-cover opacity-100 blur-[1px] scale-110"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-green-neon/10 border border-green-neon/20 backdrop-blur-xl mb-10"
          >
            <Sparkles className="w-3.5 h-3.5 text-green-neon animate-pulse" />
            <span className="text-green-neon text-[10px] font-bold uppercase tracking-[0.3em]">CBD PREMIUM • ANALYSÉ EN LABORATOIRE</span>
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tighter leading-none mb-4"
            >
              CBD PREMIUM <br />
              <span className="not-italic text-green-neon glow-green-strong filter hue-rotate-[15deg]">EXTRACTIONS.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
            >
              Explorez notre sélection de fleurs, résines et extractions CBD rigoureusement sélectionnées pour leur pureté,
              leurs arômes et leur qualité premium.
            </motion.p>
          </div>

          {/* Search Bar - Integrated & Slick */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl transition-all hover:border-white/10 group">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500 group-hover:text-green-neon transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une molécule, un arôme..."
                  className="w-full bg-transparent border-none rounded-2xl pl-16 pr-10 py-4 text-lg text-white placeholder:text-zinc-600 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-3 px-10 py-4 rounded-2xl transition-all text-sm font-bold uppercase tracking-widest group/btn ${showFilters || activeFilterCount > 0
                  ? 'bg-green-neon text-black'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <SlidersHorizontal className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-6 h-6 rounded-full bg-black/20 text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── Main Content ────────── */}
      <section className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-16 relative z-20">

        {!selectedCategory && !searchQuery ? (
          // ────────── Categories Selection Grid ──────────
          <div className="space-y-16">
            <div className="flex items-center gap-6 justify-center">
              <span className="w-12 h-px bg-white/10" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500">Sélectionner une Molécule</h2>
              <span className="w-12 h-px bg-white/10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="group relative h-96 w-full rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-zinc-900/50"
                >
                  <img
                    src={cat.image_url || `/images/category-${cat.slug}.png`}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 grayscale-[0.4] group-hover:grayscale-0 opacity-60 group-hover:opacity-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  {/* Decorative Scanline */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />

                  <div className="absolute inset-x-0 bottom-0 p-10 text-center space-y-4">
                    <h3 className="text-3xl font-serif font-bold text-white uppercase tracking-tighter group-hover:text-green-neon transition-all duration-500 hover-glow-small">
                      {cat.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <span className="text-[10px] font-black text-green-neon uppercase tracking-widest">Explorer la Collection</span>
                      <Zap className="w-3 h-3 text-green-neon" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          // ────────── Products View ──────────
          <>
            {/* Context Navigation */}
            <div className="flex items-center justify-between mb-12">
              <button
                onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux Collections
              </button>

              {selectedCategory && (
                <div className="flex items-center gap-4">
                  <span className="w-12 h-px bg-white/5" />
                  <span className="text-sm font-serif font-bold italic text-white uppercase tracking-tight">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                </div>
              )}
            </div>

            {/* Advanced Filters Drawer */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -20 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden mb-12"
                >
                  <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 md:p-14 space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                      {/* Benefits */}
                      <div className="space-y-6">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                          <Zap className="w-4 h-4 text-green-neon" />
                          Effets Recherchés
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {allBenefits.map((benefit) => (
                            <button
                              key={benefit}
                              onClick={() => setSelectedBenefit(selectedBenefit === benefit ? null : benefit)}
                              className={`px-6 py-3 rounded-2xl text-sm transition-all border ${selectedBenefit === benefit
                                ? 'bg-green-neon border-transparent text-black font-bold shadow-[0_0_20px_rgba(57,255,20,0.3)]'
                                : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:border-white/20'
                                }`}
                            >
                              {benefit}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Aromas */}
                      <div className="space-y-6">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-green-neon" />
                          Signatures Olfactives
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {allAromas.map((aroma) => (
                            <button
                              key={aroma}
                              onClick={() => setSelectedAroma(selectedAroma === aroma ? null : aroma)}
                              className={`px-6 py-3 rounded-2xl text-sm transition-all border ${selectedAroma === aroma
                                ? 'bg-white border-transparent text-black font-bold'
                                : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:border-white/20'
                                }`}
                            >
                              {aroma}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                        <Filter className="w-4 h-4 text-green-neon" />
                        Filtres instantanés
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => setInStockOnly((v) => !v)} className={`px-5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${inStockOnly ? 'bg-green-neon text-black border-green-neon' : 'border-white/10 text-zinc-400 hover:text-white'}`}><PackageCheck className="w-3.5 h-3.5 inline mr-2" />En stock</button>
                        <button onClick={() => setFeaturedOnly((v) => !v)} className={`px-5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${featuredOnly ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-400 hover:text-white'}`}><BadgeCheck className="w-3.5 h-3.5 inline mr-2" />Elite</button>
                        <button onClick={() => setSubscribableOnly((v) => !v)} className={`px-5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${subscribableOnly ? 'bg-purple-300 text-black border-purple-300' : 'border-white/10 text-zinc-400 hover:text-white'}`}><Repeat className="w-3.5 h-3.5 inline mr-2" />Abonnement</button>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">Fourchette de prix</h3>
                        <span className="text-xs text-zinc-400">{priceMin ?? 0}€ - {priceMax ?? 0}€</span>
                      </div>
                      <div className="space-y-3">
                        <input type="range" min={priceBounds.min} max={priceBounds.max} value={priceMin ?? priceBounds.min} onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax ?? priceBounds.max))} className="w-full accent-green-neon" />
                        <input type="range" min={priceBounds.min} max={priceBounds.max} value={priceMax ?? priceBounds.max} onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin ?? priceBounds.min))} className="w-full accent-green-neon" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-10 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-neon animate-pulse" />
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                          {filtered.length} molécule{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={resetAllFilters}
                        className="text-xs text-zinc-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reset Archives
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sorting Bar - Compact */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 p-2 bg-white/[0.02] border border-white/5 rounded-2xl gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest ${showFilters ? 'bg-green-neon text-black' : 'text-zinc-500 hover:text-white'}`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filtres Avancés
                </button>
                <button
                  onClick={handleShareCatalog}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {shareStatus === 'copied' ? 'Lien copié' : shareStatus === 'error' ? 'Copie impossible' : 'Partager'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center bg-zinc-900/60 rounded-xl border border-white/10 p-1">
                  <button onClick={() => setDisplayDensity('cozy')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider ${displayDensity === 'cozy' ? 'bg-green-neon text-black' : 'text-zinc-500'}`}>Confort</button>
                  <button onClick={() => setDisplayDensity('compact')} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider ${displayDensity === 'compact' ? 'bg-green-neon text-black' : 'text-zinc-500'}`}>Compact</button>
                </div>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="appearance-none bg-transparent pl-10 pr-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 focus:outline-none cursor-pointer hover:text-white transition-all"
                  >
                    <option value="featured">Populaires</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="rating">Mieux notés</option>
                    <option value="newest">Nouveautés</option>
                  </select>
                  <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className={`grid grid-cols-2 ${displayDensity === 'compact' ? 'lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6' : 'lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-10'}`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-white/[0.03] rounded-[2rem] mb-6" />
                    <div className="space-y-4 px-2">
                      <div className="h-4 bg-white/[0.03] rounded-lg w-1/3" />
                      <div className="h-6 bg-white/[0.03] rounded-lg w-3/4" />
                      <div className="h-10 bg-white/[0.03] rounded-xl w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-40 space-y-10"
              >
                <div className="w-32 h-32 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto relative group">
                  <div className="absolute inset-0 bg-green-neon/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Search className="w-12 h-12 text-zinc-700 relative z-10" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-serif font-bold text-white">Archives Vides</h2>
                  <p className="text-zinc-500 max-w-sm mx-auto text-lg font-light leading-relaxed">
                    Aucune molécule ne correspond à vos paramètres.
                  </p>
                </div>
                <button
                  onClick={resetAllFilters}
                  className="px-12 py-5 bg-green-neon text-black font-bold uppercase tracking-widest rounded-2xl hover:scale-105 transition-all text-sm"
                >
                  Réinitialiser
                </button>
              </motion.div>
            ) : (
              <>
                <div className={`grid grid-cols-2 ${displayDensity === 'compact' ? 'lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6' : 'lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-10'}`}>
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{
                          delay: (idx % 4) * 0.1,
                          duration: 0.6,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        layout
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination Premium */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-24">
                    <button
                      onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                      disabled={currentPage === 1}
                      className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => { setCurrentPage(page); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                        className={`w-14 h-14 rounded-2xl text-xs font-bold transition-all ${page === currentPage
                          ? 'bg-green-neon text-black shadow-[0_0_20px_rgba(57,255,20,0.3)]'
                          : 'bg-white/[0.02] border border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                      disabled={currentPage === totalPages}
                      className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}


        {/* Improved BudTender CTA */}
        {user && (
        <div className="mt-40">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] overflow-hidden group shadow-2xl border border-white/5"
          >
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-3xl" />
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-green-neon/5 rounded-full blur-[140px] group-hover:bg-green-neon/10 transition-colors duration-700" />
            <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[140px]" />

            <div className="relative z-10 px-8 md:px-20 py-20 flex flex-col lg:flex-row items-center justify-between gap-16">
              <div className="max-w-xl space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-green-neon/10 border border-green-neon/20 text-green-neon text-[10px] font-bold uppercase tracking-[0.3em]">
                  BudTender IA Expérientiel
                </div>
                <h3 className="text-4xl md:text-6xl font-serif font-bold leading-none uppercase tracking-tighter">
                  IDENTIFIEZ VOTRE <br /> <span className="text-green-neon italic hue-rotate-[15deg]">SIGNATURE.</span>
                </h3>
                <p className="text-zinc-500 text-lg md:text-xl font-light leading-relaxed">
                  Laissez notre technologie d'analyse moléculaire identifier le produit parfaitement calibré pour votre équilibre personnel.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
                <button
                  onClick={() => {
                    const btn = document.querySelector('[aria-label="Toggle BudTender"]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="flex-1 lg:flex-none px-12 py-5 bg-green-neon text-black font-bold uppercase tracking-widest rounded-2xl hover:scale-105 hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all text-sm shadow-xl"
                >
                  Démarrer le Diagnostic
                </button>
                <Link
                  to="/contact"
                  className="flex-1 lg:flex-none px-12 py-5 bg-white/[0.04] border border-white/10 text-white font-bold uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all text-sm text-center"
                >
                  Expert Live Chat
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        )}

        {/* Advanced Compliance Footer */}
        <div className="mt-32 pt-16 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {[
            {
              icon: <ShieldCheck className="w-5 h-5" />,
              title: "Protocoles de Pureté",
              text: "Chaque lot est soumis à une triple analyse en laboratoires certifiés ISO. Taux de THC < 0.3%, absence totale de métaux lourds et pesticides."
            },
            {
              icon: <Microscope className="w-5 h-5" />,
              title: "Innovation Moléculaire",
              text: "Accès exclusif aux terpènes RARES et aux concentrations nanométriques pour une biodisponibilité optimisée et une précision d'effet inégalée."
            },
            {
              icon: <Info className="w-5 h-5" />,
              title: "Usage Responsable",
              text: "Produits destinés exclusivement aux adultes consentants. Usage sensoriel encadré. Ne pas consommer si vous êtes enceinte ou suivez un traitement médical."
            }
          ].map((item, idx) => (
            <div key={idx} className="space-y-4 group">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3 group-hover:text-white transition-colors">
                <span className="text-green-neon group-hover:scale-110 transition-transform">{item.icon}</span>
                {item.title}
              </h4>
              <p className="text-sm text-zinc-600 leading-relaxed font-light group-hover:text-zinc-500 transition-colors">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
