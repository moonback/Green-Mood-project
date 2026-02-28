import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, X, Sparkles, Filter, LayoutGrid, CalendarCheck, Info, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      <SEO
        title="Archives N10 & CBD — L'Excellence Green Mood"
        description="Explorez l'univers moléculaire du N10 et des meilleurs extraits de CBD. Livraison discrète et Click & Collect."
      />

      {/* Hero Header - Immersive N10 Branding */}
      <section className="relative min-h-[70vh] flex items-center pt-40 pb-24 px-4 overflow-hidden">
        {/* Background Visual Layers */}
        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 2, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
          >
            <img
              src="/images/products-flower.png"
              alt="Molécule N10 d'exception"
              className="w-full h-full object-cover opacity-20 blur-[3px]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-zinc-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,163,0.05)_0%,transparent_70%)]" />

          {/* Dynamic Molecular Glows */}
          <motion.div
            animate={{
              x: [-100, 100, -100],
              y: [-50, 50, -50],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-green-neon/10 rounded-full blur-[150px] -z-10"
          />
          <motion.div
            animate={{
              x: [100, -100, 100],
              y: [50, -50, 50],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-green-neon/5 rounded-full blur-[120px] -z-10"
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-3xl mb-12"
          >
            <Sparkles className="w-4 h-4 text-green-neon animate-pulse" />
            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.5em]">L'Innovation N10 est ici</span>
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl lg:text-8xl font-serif font-black tracking-tighter leading-[0.85] uppercase italic"
            >
              ARCHIVES <br />
              <span className="not-italic text-green-neon glow-green-strong">MOLECUL'</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto font-serif italic leading-relaxed pt-6 opacity-80"
            >
              Explorez une curatoriale sans compromis des extractions les plus pures et des molécules de synthèse maîtrisée.
            </motion.p>
          </div>

          {/* Search & Filter Bar - Ultra Premium */}
          <div className="mt-20 relative max-w-4xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-neon/20 via-white/5 to-green-neon/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative flex flex-col md:flex-row gap-4 p-4 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl transition-all hover:border-white/20">
              <div className="relative flex-1">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-700 group-focus-within:text-green-neon transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="QUELLE EXPÉRIENCE RECHERCHEZ-VOUS ?"
                  className="w-full bg-transparent border-none rounded-3xl pl-20 pr-12 py-6 text-lg font-serif italic text-white placeholder:text-zinc-800 focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-4 px-12 py-6 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.4em] ${showFilters || selectedBenefit || selectedAroma
                  ? 'bg-green-neon text-black shadow-[0_0_30px_rgba(0,255,163,0.3)]'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filtres
                {(selectedBenefit || selectedAroma) && (
                  <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        {/* Advanced Filters Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {/* Needs & Benefits */}
                  <div className="space-y-8">
                    <h3 className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.5em] flex items-center gap-4">
                      <Filter className="w-4 h-4 text-green-neon" />
                      SPECTRE DE BÉNÉFICES
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {allBenefits.map((benefit) => (
                        <button
                          key={benefit}
                          onClick={() => setSelectedBenefit(selectedBenefit === benefit ? null : benefit)}
                          className={`px-6 py-4 rounded-2xl text-sm font- serif italic transition-all border ${selectedBenefit === benefit
                            ? 'bg-green-neon border-transparent text-black font-black not-italic'
                            : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'
                            }`}
                        >
                          {benefit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aromatics */}
                  <div className="space-y-8">
                    <h3 className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.5em] flex items-center gap-4">
                      <Sparkles className="w-4 h-4 text-green-neon" />
                      SIGNATURES OLFACTIVES
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {allAromas.map((aroma) => (
                        <button
                          key={aroma}
                          onClick={() => setSelectedAroma(selectedAroma === aroma ? null : aroma)}
                          className={`px-6 py-4 rounded-2xl text-sm font-serif italic transition-all border ${selectedAroma === aroma
                            ? 'bg-white border-transparent text-black font-black not-italic'
                            : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'
                            }`}
                        >
                          {aroma}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-10 border-t border-white/5">
                  <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
                    ALGORITHME DE SÉLECTION MASTER ACTIF.
                  </p>
                  <button
                    onClick={() => { setSelectedBenefit(null); setSelectedAroma(null); setSelectedCategory(null); setSearchQuery(''); }}
                    className="text-[10px] text-zinc-500 hover:text-red-400 font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reset Universe
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky Global Navigation */}
        <div className="sticky top-28 z-30 mb-20">
          <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black transition-all uppercase tracking-widest ${!selectedCategory
                ? 'bg-white text-black'
                : 'text-zinc-600 hover:text-white'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Omnia
            </button>

            <div className="w-px h-6 bg-white/10 mx-2" />

            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`whitespace-nowrap px-8 py-4 rounded-2xl text-xs font-black transition-all uppercase tracking-widest ${selectedCategory === cat.id
                    ? 'bg-green-neon text-black shadow-[0_0_20px_rgba(0,255,163,0.2)]'
                    : 'text-zinc-600 hover:text-white'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="ml-auto hidden lg:flex items-center gap-4 pr-6">
              <div className="w-px h-6 bg-white/10" />
              <div className="text-[10px] font-mono text-zinc-800">
                MATCHES: <span className="text-green-neon">{filtered.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Showcase */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-8 animate-pulse">
                <div className="aspect-[4/5] bg-white/5 rounded-[3rem]" />
                <div className="space-y-4 px-6">
                  <div className="h-8 bg-white/5 rounded-xl w-3/4" />
                  <div className="h-4 bg-white/5 rounded-lg w-full" />
                  <div className="h-12 bg-white/5 rounded-2xl w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-40 space-y-12"
          >
            <div className="w-32 h-32 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto relative">
              <Search className="w-12 h-12 text-zinc-800" />
              <div className="absolute inset-0 border border-green-neon/20 rounded-full animate-ping" />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-serif font-black text-white italic">Silence Moléculaire.</h2>
              <p className="text-zinc-600 max-w-sm mx-auto font-medium">
                Aucune de nos créations ne correspond à ce spectre de recherche.
                Redéfinissez vos paramètres d'exploration.
              </p>
            </div>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedBenefit(null); setSelectedAroma(null); }}
              className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-green-neon transition-all uppercase tracking-widest text-xs"
            >
              Réinitialiser l'Espace
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-24">
            <AnimatePresence mode="popLayout">
              {filtered.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    delay: idx * 0.05,
                    duration: 0.5,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  layout
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Exclusive Membership / Diagnostic CTA */}
        <div className="mt-48">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[5rem] overflow-hidden group"
          >
            {/* Background Layer */}
            <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-3xl border border-white/5" />
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-green-neon/5 rounded-full blur-[150px] group-hover:bg-green-neon/10 transition-colors duration-1000" />
            <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px]" />

            <div className="relative z-10 px-16 py-24 flex flex-col lg:flex-row items-center justify-between gap-16">
              <div className="max-w-xl space-y-8 text-center lg:text-left">
                <div className="inline-block px-6 py-2 rounded-full bg-green-neon/10 border border-green-neon/20 text-green-neon text-[10px] font-black uppercase tracking-[0.4em]">
                  BudTender IA Connecté
                </div>
                <h3 className="text-5xl md:text-7xl font-serif font-black leading-[0.9] uppercase italic">
                  TROUVEZ VOTRE <br /> <span className="text-green-neon not-italic">FREQUENCE.</span>
                </h3>
                <p className="text-zinc-500 text-lg font-serif italic max-w-sm mx-auto lg:mx-0">
                  Laissez notre technologie d'analyse moléculaire vous guider vers le produit parfaitement calibré pour votre physiologie.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
                <button className="flex-1 lg:flex-none px-16 py-8 bg-white text-black font-black uppercase tracking-[0.3em] rounded-[2.5rem] hover:bg-green-neon transition-all shadow-2xl relative overflow-hidden group/btn text-xs">
                  <span className="relative z-10">Lancer le Diagnostic</span>
                  <div className="absolute inset-0 bg-green-neon scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left duration-500" />
                </button>
                <Link
                  to="/contact"
                  className="flex-1 lg:flex-none px-16 py-8 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] rounded-[2.5rem] hover:bg-white/10 transition-all text-xs text-center"
                >
                  Expert Live Chat
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Global Compliance System Footer */}
        <div className="mt-32 pt-16 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            {
              icon: <ShieldCheck className="w-5 h-5" />,
              title: "CONFORMITÉ NORMATIVE",
              text: "TOUS NOS PRODUITS SONT ANALYSÉS EN LABORATOIRES INDÉPENDANTS ET GARANTISSENT UN TAUX DE THC < 0.3% CONFORMÉMENT À LA RÉGLEMENTATION EUROPÉENNE."
            },
            {
              icon: <CalendarCheck className="w-5 h-5" />,
              title: "VERIFICATION D'IDENTITÉ",
              text: "L'ACCÈS À NOS ARCHIVES EST STRICTEMENT RÉSERVÉ AUX PERSONNES MAJEURES. UN JUSTIFICATIF D'IDENTITÉ PEUT ÊTRE REQUIS LORS DU RETRAIT OU DE LA LIVRAISON."
            },
            {
              icon: <Info className="w-5 h-5" />,
              title: "GUIDE D'UTILISATION",
              text: "NOS PRODUITS SONT DESTINÉS À UN USAGE SENSORIEL ET COLLECTIONNEUR. NE PAS FUMER. CONSULTER UN PROFESSIONNEL DE SANTÉ EN CAS DE DOUTE."
            }
          ].map((item, idx) => (
            <div key={idx} className="space-y-6 group">
              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 flex items-center gap-3 transition-colors group-hover:text-green-neon">
                {item.icon}
                {item.title}
              </h4>
              <p className="text-[10px] text-zinc-700 leading-relaxed font-mono uppercase tracking-widest opacity-60">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
