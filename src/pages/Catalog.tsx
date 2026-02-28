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
        title="Catalogue Premium — Green Mood Shop"
        description="Explorez notre sélection exclusive de produits CBD de haute qualité. Livraison discrète ou Click & Collect à Paris."
        keywords="acheter CBD en ligne, fleurs CBD, huile CBD, résine CBD, livraison CBD France"
      />

      {/* Modern Hero Header */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] bg-green-neon/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-neon/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-green-neon text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles className="w-4 h-4" />
              Collections de Prestige
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-serif font-black tracking-tight leading-[0.9]"
            >
              LE CATALOGUE <br />
              <span className="text-green-neon italic glow-green">MASTER.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
            >
              Une curatoriale rigoureuse des meilleures génétiques et extractions
              pour une expérience CBD sans compromis.
            </motion.p>
          </div>

          {/* Search & Filter Bar */}
          <div className="relative max-w-4xl mx-auto z-10 flex flex-col md:flex-row gap-4 p-2 bg-zinc-900/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-green-neon transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quelle sensation recherchez-vous ?"
                className="w-full bg-transparent border-none rounded-2xl pl-16 pr-10 py-5 text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] transition-all font-black text-sm uppercase tracking-widest ${showFilters || selectedBenefit || selectedAroma
                ? 'bg-green-neon text-black'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5'
                }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filtres Expert
              {(selectedBenefit || selectedAroma) && (
                <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] ml-1">Active</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Advanced Filters Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 40 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 space-y-10 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12">
                  {/* Needs & Benefits */}
                  <div className="space-y-6">
                    <h3 className="text-zinc-500 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                      <Filter className="w-4 h-4 text-green-neon" />
                      Besoin & Bénéfice
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {allBenefits.length > 0 ? (
                        allBenefits.map((benefit) => (
                          <button
                            key={benefit}
                            onClick={() => setSelectedBenefit(selectedBenefit === benefit ? null : benefit)}
                            className={`px-5 py-3 rounded-2xl text-sm font-medium border transition-all ${selectedBenefit === benefit
                              ? 'bg-green-neon border-green-primary text-black font-black'
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:border-zinc-500'
                              }`}
                          >
                            {benefit}
                          </button>
                        ))
                      ) : (
                        <p className="text-zinc-600 text-sm italic py-2">Aucun bénéfice catalogué</p>
                      )}
                    </div>
                  </div>

                  {/* Aromatics */}
                  <div className="space-y-6">
                    <h3 className="text-zinc-500 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-green-neon" />
                      Notes Aromatiques
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {allAromas.length > 0 ? (
                        allAromas.map((aroma) => (
                          <button
                            key={aroma}
                            onClick={() => setSelectedAroma(selectedAroma === aroma ? null : aroma)}
                            className={`px-5 py-3 rounded-2xl text-sm font-medium border transition-all ${selectedAroma === aroma
                              ? 'bg-white text-black font-black'
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:border-zinc-500'
                              }`}
                          >
                            {aroma}
                          </button>
                        ))
                      ) : (
                        <p className="text-zinc-600 text-sm italic py-2">Aucune note détectée</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                  <p className="text-sm text-zinc-500">
                    Affinage précis basé sur vos préférences sensorielles.
                  </p>
                  <button
                    onClick={() => { setSelectedBenefit(null); setSelectedAroma(null); setSelectedCategory(null); setSearchQuery(''); }}
                    className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-2 transition-colors uppercase font-bold tracking-widest"
                  >
                    <X className="w-4 h-4" />
                    Tout Réinitialiser
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Catalog Navigation */}
        <div className="sticky top-24 z-20 mb-12 bg-zinc-950/80 backdrop-blur-md py-4 -mx-4 px-4 overflow-x-auto scrollbar-hide flex items-center gap-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`whitespace-nowrap flex items-center gap-3 px-6 py-3 rounded-full text-sm font-black transition-all border uppercase tracking-widest ${!selectedCategory
              ? 'bg-white text-black border-transparent'
              : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/30'
              }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Tous les formats
          </button>

          <div className="w-[1px] h-6 bg-zinc-800 shrink-0" />

          <div className="flex items-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-black transition-all border uppercase tracking-widest ${selectedCategory === cat.id
                  ? 'bg-green-neon text-black border-transparent'
                  : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/30'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="ml-auto hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-zinc-500 text-xs font-bold font-mono">
            COUNT: <span className="text-white">{filtered.length}</span>
          </div>
        </div>

        {/* Product Showcase */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-6 animate-pulse">
                <div className="aspect-[3/4] bg-zinc-900 rounded-[2.5rem]" />
                <div className="space-y-3 px-4">
                  <div className="h-6 bg-zinc-900 rounded-lg w-3/4" />
                  <div className="h-4 bg-zinc-900 rounded-lg w-full" />
                  <div className="h-10 bg-zinc-900 rounded-xl w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 space-y-8"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-serif font-black text-white">Aucun résultat d'exception.</h2>
              <p className="text-zinc-500 max-w-sm mx-auto">
                Vos critères actuels ne correspondent à aucune de nos pépites.
                Essayez d'élargir votre recherche.
              </p>
            </div>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedBenefit(null); setSelectedAroma(null); }}
              className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-green-neon transition-all"
            >
              Réinitialiser l'Univers
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-20"
          >
            {filtered.map((product) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={product.id}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Exclusive Membership / Bundle Link - Contextual CTA */}
        <div className="mt-40">
          <div className="relative rounded-[4rem] p-12 overflow-hidden border border-white/10 group">
            <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-3xl" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-neon/10 rounded-full blur-[100px] -z-10" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-4 text-center md:text-left">
                <h3 className="text-4xl font-serif font-black">Besoin de <br /> <span className="text-green-neon">Sur-Mesure ?</span></h3>
                <p className="text-zinc-400 font-light max-w-sm">
                  Laissez notre BudTender IA ou nos experts en boutique vous
                  guider vers l'expérience sensorielle ultime.
                </p>
              </div>
              <div className="flex flex-wrap gap-6 justify-center">
                <button className="px-10 py-5 bg-white text-black font-black rounded-2xl flex items-center gap-3 hover:bg-green-neon transition-all">
                  Ouvrir le Diagnostic
                </button>
                <Link
                  to="/contact"
                  className="px-10 py-5 bg-white/5 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center"
                >
                  Nous Contacter
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Strict Compliance Footer */}
        <div className="mt-20 pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 justify-center md:justify-start">
              <ShieldCheck className="w-4 h-4 text-green-neon" />
              CONFORMITÉ LÉGALE
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
              TOUS NOS PRODUITS CONTIENNENT MOINS DE 0,3% DE THC (DELTA-9-TÉTRAHYDROCANNABINOL)
              ET SONT CONFORMES AUX DIRECTIVES EUROPÉENNES ET À LA LÉGISLATION FRANÇAISE.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 justify-center md:justify-start">
              <CalendarCheck className="w-4 h-4 text-green-neon" />
              RESTRICTIONS D'AGE
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-mono uppercase">
              VENTE STRICTEMENT RÉSERVÉE AUX PERSONNES MAJEURES (+18 ANS).
              AUCUNE VENTE NE SERA EFFECTUÉE AUX MINEURS.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 justify-center md:justify-start">
              <Info className="w-4 h-4 text-green-neon" />
              USAGE PRÉCAUTIONNEL
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-mono uppercase">
              À DÉCONSEILLER AUX FEMMES ENCEINTES OU ALLAITANTES.
              NE PAS FUMER. TENIR HORS DE PORTÉE DES ENFANTS.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
