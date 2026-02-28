import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Leaf,
  HeartHandshake,
  ArrowRight,
  Star,
  Package,
  Clock,
  Truck,
  Sparkles,
  Search,
  MessageCircle,
  CheckCircle2,
  Zap
} from "lucide-react";
import FAQ from "../components/FAQ";
import SEO from "../components/SEO";
import { useSettingsStore } from "../store/settingsStore";

export default function Home() {
  const settings = useSettingsStore((s) => s.settings);

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Green Mood CBD Shop",
    "image": "https://images.unsplash.com/photo-1603908064973-206e23114d59?q=80&w=2070&auto=format&fit=crop",
    "@id": "https://greenMood-cbd.fr",
    "url": "https://greenMood-cbd.fr",
    "telephone": "0123456789",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Rue de la Nature",
      "addressLocality": "Paris",
      "postalCode": "75000",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 48.8566,
      "longitude": 2.3522
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "10:00",
      "closes": "19:30"
    }
  };

  const categories = [
    { name: "Fleurs", slug: "fleurs", img: "/images/hero-premium.png", count: "18 varietés" },
    { name: "Huiles", slug: "huiles", img: "/images/cbd-oil.png", count: "8 concentrés" },
    { name: "Résines", slug: "resines", img: "/images/presentation-cbd2.png", count: "12 textures" },
    { name: "Infusions", slug: "infusions", img: "/images/lifestyle-relax.png", count: "6 mélanges" },
  ];

  const testimonials = [
    {
      name: "Thomas B.",
      text: "La qualité des fleurs est incomparable. On sent que chaque bourgeon est sélectionné avec soin. Livraison discrète et ultra-rapide.",
      rating: 5,
      date: "Il y a 2 jours"
    },
    {
      name: "Aurélie M.",
      text: "L'huile 20% m'a réconciliée avec le sommeil. Green Mood est devenu mon adresse de référence pour le CBD à Paris.",
      rating: 5,
      date: "Il y a 1 semaine"
    },
    {
      name: "Marc D.",
      text: "Un service client au top et des produits qui respectent vraiment leurs promesses. Je recommande les packs découverte pour tester.",
      rating: 5,
      date: "Il y a 10 jours"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white overflow-hidden">
      <SEO
        title="Acheter CBD à Paris - Green Mood Shop | Fleurs, Résines, Huiles"
        description="L'excellence du CBD à Paris. Fleurs, résines et huiles 100% bio et légales. Découvrez la sélection premium Green Mood, pour un bien-être sans compromis."
        keywords="CBD Paris, acheter CBD, boutique CBD, fleurs CBD, résine CBD, huile CBD, CBD légal, Green Mood"
        schema={homeSchema}
      />

      {/* Hero Section - N10 Refocus */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 px-4 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Animated Glows */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 -left-20 w-[800px] h-[800px] bg-green-neon/5 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-green-neon/5 rounded-full blur-[120px]"
          />
        </div>

        {/* Backdrop Visual */}
        <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
          <img
            src="/images/presentation-cbd.png"
            alt="N10 - L'Intensité Pure"
            className="w-full h-full object-cover opacity-30 scale-105 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/70 to-zinc-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950 opacity-80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="space-y-12"
          >
            {/* Exclusive Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-green-neon/10 border border-green-neon/30 text-green-neon text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-3xl shadow-[0_0_50px_rgba(57,255,20,0.1)] mb-4"
            >
              <Sparkles className="w-4 h-4" />
              <span>Nouveauté Mondiale : La Molécule N10</span>
            </motion.div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-7xl md:text-9xl lg:text-[11rem] font-serif font-black tracking-tighter leading-[0.8] uppercase flex flex-col items-center">
                <span className="text-white">L'ÈRE DU</span>
                <span className="text-green-neon italic glow-green-strong">N10.</span>
              </h1>
            </div>

            {/* Content Subtitle */}
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="text-xl md:text-3xl text-zinc-400 font-serif italic leading-relaxed max-w-3xl mx-auto">
                Plus puissante, plus intense, plus radicale que le CBNO. <br />
                <span className="text-white not-italic font-sans font-light uppercase tracking-widest text-sm opacity-60">Découvrez l'apogée des cannabinoides de synthèse maîtrisée.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                <Link
                  to="/catalogue?search=N10"
                  className="w-full sm:w-auto px-12 py-6 bg-white text-black font-black rounded-2xl transition-all transform hover:scale-105 hover:bg-green-neon shadow-[0_30px_60px_-15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 group"
                >
                  DÉCOUVRIR LE N10
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Link>
                <Link
                  to="/catalogue"
                  className="w-full sm:w-auto px-12 py-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold backdrop-blur-xl transition-all flex items-center justify-center gap-4"
                >
                  Toute la Collection
                </Link>
              </div>
            </div>

            {/* Key USPs */}
            <div className="flex flex-wrap justify-center items-center gap-12 pt-20 border-t border-white/5">
              <div className="flex flex-col items-center gap-3">
                <Zap className="w-5 h-5 text-green-neon" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Puissance Absolue</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-neon" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Conformité Totale</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Clock className="w-5 h-5 text-green-neon" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Effet Prolongé</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* N10 Deep Dive - The Core Focus */}
      <section className="py-24 relative px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[4rem] p-12 md:p-24 overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-neon/5 rounded-full blur-[120px] -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h2 className="text-5xl md:text-7xl font-serif font-black text-white leading-tight uppercase">
                    LA GRÂCE DU <br />
                    <span className="text-green-neon italic">CONTRÔLE.</span>
                  </h2>
                  <p className="text-xl text-zinc-400 font-light leading-relaxed">
                    Le N10 marque une rupture technologique dans l'univers des cannabinoides.
                    Conçu pour ceux qui recherchent une <span className="text-white font-bold italic">profondeur sensorielle</span> sans précédent,
                    il surpasse le CBNO par sa biodisponibilité et sa puissance d'action.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 group hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-green-neon/10 flex items-center justify-center text-green-neon">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Puissance Brute</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed uppercase tracking-tighter">Une intensité décuplée par rapport aux standards du marché.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 group hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Clarté Mentale</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed uppercase tracking-tighter">Un équilibre parfait entre relaxation physique et éveil cognitif.</p>
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    to="/catalogue?search=N10"
                    className="inline-flex items-center gap-6 px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-green-neon transition-all uppercase tracking-[0.2em] text-[10px]"
                  >
                    Acquérir l'Exclusivité
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-square rounded-[3.5rem] overflow-hidden group shadow-3xl border border-white/10"
              >
                <img
                  src="/images/presentation-cbd2.png"
                  alt="N10 Extraction Process"
                  className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-[2s]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-10 left-10">
                  <div className="px-6 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-[9px] font-black uppercase tracking-[0.4em] text-green-neon">
                    LABORATORY GRADE N10
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">
              Nos <span className="text-green-neon">Essentiels</span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-md">
              Des formats adaptés à chaque moment de votre journée.
            </p>
          </div>
          <Link to="/catalogue" className="text-green-neon font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
            Voir tout le catalogue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/catalogue?category=${cat.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-[2.5rem] border border-white/5"
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-0 inset-x-0 p-8">
                  <p className="text-green-neon text-xs font-bold uppercase tracking-[0.2em] mb-1">{cat.count}</p>
                  <h3 className="text-2xl font-bold font-serif">{cat.name}</h3>
                </div>
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Presentation - High End */}
      <section className="py-32 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative aspect-[4/5] rounded-[3rem] overflow-hidden order-last lg:order-first shadow-2xl"
            >
              <img
                src="/images/lifestyle-relax.png"
                alt="CBD Wellness Lifestyle"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-green-neon/20 to-transparent mix-blend-overlay" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <span className="text-green-neon font-black tracking-[0.3em] uppercase text-sm">Philosophie Green Mood</span>
                <h2 className="text-5xl md:text-6xl font-serif font-black text-white leading-tight">
                  Le Bien-Être, <br />
                  <span className="italic text-zinc-500 font-light">Sans Compromis.</span>
                </h2>
                <p className="text-xl text-zinc-400 leading-relaxed font-light">
                  Green Mood n'est pas qu'un CBD Shop. C'est un mouvement vers un mode de vie plus serein,
                  plus équilibré et intensément qualitatif.
                </p>
                <div className="space-y-4 pt-4">
                  {[
                    "Culture 100% Organique - Sans pesticides",
                    "Traçabilité totale de la graine au produit fini",
                    "Conseils personnalisés par des experts passionnés",
                    "Conditionnement hermétique préservant les arômes"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-green-neon/10 border border-green-neon/30 flex items-center justify-center group-hover:bg-green-neon transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-green-neon group-hover:text-black" />
                      </div>
                      <span className="text-zinc-300 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/qualite"
                className="inline-flex items-center gap-4 bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-green-neon transition-all"
              >
                Notre Charte Qualité
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI BudTender Concierge CTA */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-green-950 to-zinc-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden border border-green-neon/20 shadow-2xl"
        >
          {/* Animated Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-neon/10 rounded-full blur-[100px] animate-pulse" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-neon/20 text-green-neon font-black text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                BudTender IA Expérientiel
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-black text-white leading-none">
                Besoin de conseils <br />
                <span className="text-green-neon italic">Sur-Mesure ?</span>
              </h2>
              <p className="text-xl text-zinc-400 font-light max-w-xl">
                Notre intelligence artificielle analyse vos besoins (sommeil, stress, douleurs)
                pour vous proposer la routine CBD parfaitement adaptée à votre profil.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-4 justify-center md:justify-start">
                <button
                  onClick={() => {
                    const btn = document.querySelector('[aria-label="Toggle BudTender"]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="bg-green-neon text-black px-10 py-5 rounded-2xl font-black shadow-lg hover:shadow-green-neon/20 transition-all flex items-center gap-3"
                >
                  Démarrer le Quiz IA
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="w-48 h-48 md:w-64 md:h-64 relative flex-shrink-0">
              <div className="absolute inset-0 bg-green-neon opacity-20 blur-[60px] animate-pulse" />
              <div className="relative w-full h-full bg-zinc-900 rounded-full border border-green-neon/40 flex items-center justify-center p-8 group">
                <div className="w-full h-full rounded-full border border-green-neon/20 animate-[spin_10s_linear_infinite]" />
                <Sparkles className="absolute w-20 h-20 text-green-neon animate-bounce" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials - Premium Grid */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-serif font-black text-white">Vécus & <span className="text-green-neon">Partages</span></h2>
          <p className="text-zinc-500 font-medium">Ils ont choisi Green Mood pour leur bien-être quotidien.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex gap-1 mb-8">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 text-green-neon fill-green-neon" />
                ))}
              </div>
              <p className="text-lg text-zinc-300 font-light leading-relaxed italic mb-8">"{t.text}"</p>
              <div className="flex items-center justify-between border-t border-white/5 pt-8">
                <span className="font-bold text-white tracking-wider">{t.name}</span>
                <span className="text-zinc-600 text-sm font-medium">{t.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Bar (Stats) */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          <div className="space-y-2">
            <p className="text-4xl font-black text-green-neon tracking-tighter">98%</p>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Clients Satisfaits</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-white tracking-tighter">24H</p>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Expédition moy.</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-white tracking-tighter">100%</p>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Biologique & Traçable</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-white tracking-tighter">+50</p>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Références Premium</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Final CTA */}
      <section className="py-32 text-center px-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-green-neon/30 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-10"
        >
          <h2 className="text-6xl md:text-8xl font-serif font-black text-white tracking-tighter">
            RESSENTEZ <br />
            <span className="text-green-neon">LA DIFFÉRENCE.</span>
          </h2>
          <Link
            to="/boutique"
            className="inline-flex items-center gap-3 px-12 py-6 bg-white text-black font-black rounded-2xl hover:bg-green-neon hover:text-black transition-all transform hover:scale-105"
          >
            Accéder à la boutique
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
