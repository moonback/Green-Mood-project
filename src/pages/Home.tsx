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

      {/* ────────── Hero Section ────────── */}
      <section className="relative min-h-[75vh] md:min-h-[85vh] flex items-center justify-center pt-28 pb-16 px-5 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-green-neon/5 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{ scale: [1.15, 1, 1.15], opacity: [0.04, 0.1, 0.04] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-green-neon/5 rounded-full blur-[120px]"
          />
        </div>

        {/* Backdrop image */}
        <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
          <img
            src="/images/N10.png"
            alt="N10 - L'Intensité Pure"
            className="w-full h-full object-cover opacity-100 scale-105"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-10"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-green-neon/10 border border-green-neon/25 text-green-neon text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur-xl"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nouveauté Mondiale : La Molécule N10</span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-tight uppercase flex flex-col items-center gap-1">
                <span className="text-white">L'ÈRE DU</span>
                <span className="text-green-neon italic glow-green">N10.</span>
              </h1>
            </div>

            {/* Subtitle */}
            <div className="max-w-3xl mx-auto space-y-8">
              <p className="text-lg md:text-xl text-zinc-400 font-serif italic leading-relaxed max-w-2xl mx-auto">
                Plus puissante, plus intense, plus radicale que le CBNO. <br />
                <span className="text-zinc-500 not-italic font-sans font-light uppercase tracking-widest text-xs mt-2 block">
                  Découvrez l'apogée des cannabinoides de synthèse maîtrisée.
                </span>
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  to="/catalogue?search=N10"
                  className="w-full sm:w-auto px-8 py-4 bg-green-neon text-black font-semibold rounded-2xl transition-all hover:shadow-[0_0_24px_rgba(57,255,20,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  DÉCOUVRIR LE N10
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/catalogue"
                  className="w-full sm:w-auto px-8 py-4 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] text-white rounded-2xl font-medium backdrop-blur-sm transition-all flex items-center justify-center gap-3"
                >
                  Toute la Collection
                </Link>
              </div>
            </div>

            {/* USPs */}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 pt-16 border-t border-white/[0.06]">
              {[
                { icon: <Zap className="w-4 h-4" />, label: "Puissance Absolue" },
                { icon: <ShieldCheck className="w-4 h-4" />, label: "Conformité Totale" },
                { icon: <Clock className="w-4 h-4" />, label: "Effet Prolongé" },
              ].map((usp) => (
                <div key={usp.label} className="flex items-center gap-2.5">
                  <span className="text-green-neon">{usp.icon}</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{usp.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────── N10 Deep Dive ────────── */}
      <section className="py-16 md:py-24 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 md:p-16 overflow-hidden relative">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-neon/5 rounded-full blur-[120px] -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-10">
                <div className="space-y-5">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight uppercase">
                    LA GRÂCE DU <br />
                    <span className="text-green-neon italic">CONTRÔLE.</span>
                  </h2>
                  <p className="text-base md:text-lg text-zinc-400 font-light leading-relaxed">
                    Le N10 marque une rupture technologique dans l'univers des cannabinoides.
                    Conçu pour ceux qui recherchent une <span className="text-white font-medium italic">profondeur sensorielle</span> sans précédent,
                    il surpasse le CBNO par sa biodisponibilité et sa puissance d'action.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: <Zap className="w-5 h-5" />, title: "Puissance Brute", desc: "Une intensité décuplée par rapport aux standards du marché.", accent: true },
                    { icon: <Sparkles className="w-5 h-5" />, title: "Clarté Mentale", desc: "Un équilibre parfait entre relaxation physique et éveil cognitif.", accent: false },
                  ].map((card) => (
                    <div key={card.title} className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3 group hover:bg-white/[0.05] transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.accent ? "bg-green-neon/10 text-green-neon" : "bg-white/[0.06] text-zinc-400"}`}>
                        {card.icon}
                      </div>
                      <h3 className="text-base font-semibold text-white">{card.title}</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    to="/catalogue?search=N10"
                    className="inline-flex items-center gap-3 px-6 py-3.5 bg-green-neon text-black font-semibold rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all text-sm"
                  >
                    Acquérir l'Exclusivité
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative aspect-square rounded-3xl overflow-hidden group shadow-2xl border border-white/[0.08]"
              >
                <img
                  src="/images/presentation-cbd2.png"
                  alt="N10 Extraction Process"
                  className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6">
                  <div className="px-4 py-1.5 rounded-xl bg-black/70 backdrop-blur-xl border border-white/[0.08] text-xs font-semibold uppercase tracking-wider text-green-neon">
                    LABORATORY GRADE N10
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── Categories Grid ────────── */}
      <section className="py-16 md:py-24 px-5 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
              Nos <span className="text-green-neon">Essentiels</span>
            </h2>
            <p className="text-zinc-500 text-base max-w-md">
              Des formats adaptés à chaque moment de votre journée.
            </p>
          </div>
          <Link to="/catalogue" className="text-green-neon font-semibold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity">
            Voir tout le catalogue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link
                to={`/catalogue?category=${cat.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
                  <p className="text-green-neon text-xs font-semibold uppercase tracking-wider mb-1">{cat.count}</p>
                  <h3 className="text-lg md:text-xl font-semibold font-serif">{cat.name}</h3>
                </div>
                <div className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ────────── Brand Presentation ────────── */}
      <section className="py-16 md:py-24 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[4/5] rounded-3xl overflow-hidden order-last lg:order-first shadow-2xl"
            >
              <img
                src="/images/lifestyle-relax.png"
                alt="CBD Wellness Lifestyle"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-green-neon/15 to-transparent mix-blend-overlay" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-5">
                <span className="text-green-neon font-semibold tracking-[0.2em] uppercase text-xs">Philosophie Green Mood</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
                  Le Bien-Être, <br />
                  <span className="italic text-zinc-500 font-light">Sans Compromis.</span>
                </h2>
                <p className="text-base md:text-lg text-zinc-400 leading-relaxed font-light">
                  Green Mood n'est pas qu'un CBD Shop. C'est un mouvement vers un mode de vie plus serein,
                  plus équilibré et intensément qualitatif.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    "Culture 100% Organique - Sans pesticides",
                    "Traçabilité totale de la graine au produit fini",
                    "Conseils personnalisés par des experts passionnés",
                    "Conditionnement hermétique préservant les arômes"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-green-neon/10 border border-green-neon/25 flex items-center justify-center shrink-0 group-hover:bg-green-neon transition-colors">
                        <CheckCircle2 className="w-3 h-3 text-green-neon group-hover:text-black" />
                      </div>
                      <span className="text-zinc-300 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/qualite"
                className="inline-flex items-center gap-3 bg-white/[0.06] border border-white/[0.1] text-white px-6 py-3.5 rounded-2xl font-semibold hover:bg-white/[0.1] transition-all text-sm"
              >
                Notre Charte Qualité
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────── BudTender CTA ────────── */}
      <section className="py-16 md:py-24 px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-green-950 to-zinc-900 rounded-3xl p-8 md:p-14 relative overflow-hidden border border-green-neon/15 shadow-2xl"
        >
          {/* Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-green-neon/10 rounded-full blur-[100px] animate-pulse" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-green-neon/15 text-green-neon font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                BudTender IA Expérientiel
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
                Besoin de conseils <br />
                <span className="text-green-neon italic">Sur-Mesure ?</span>
              </h2>
              <p className="text-base md:text-lg text-zinc-400 font-light max-w-xl">
                Notre intelligence artificielle analyse vos besoins (sommeil, stress, douleurs)
                pour vous proposer la routine CBD parfaitement adaptée à votre profil.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 justify-center md:justify-start">
                <button
                  onClick={() => {
                    const btn = document.querySelector('[aria-label="Toggle BudTender"]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="bg-green-neon text-black px-8 py-4 rounded-2xl font-semibold hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all flex items-center gap-3"
                >
                  Démarrer le Quiz IA
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-36 h-36 md:w-48 md:h-48 relative shrink-0">
              <div className="absolute inset-0 bg-green-neon opacity-15 blur-[50px] animate-pulse" />
              <div className="relative w-full h-full bg-zinc-900 rounded-full border border-green-neon/30 flex items-center justify-center p-6">
                <div className="w-full h-full rounded-full border border-green-neon/15 animate-[spin_10s_linear_infinite]" />
                <Sparkles className="absolute w-14 h-14 md:w-16 md:h-16 text-green-neon animate-bounce" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ────────── Testimonials ────────── */}
      <section className="py-16 md:py-24 px-5 max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">Vécus & <span className="text-green-neon">Partages</span></h2>
          <p className="text-zinc-500 text-base">Ils ont choisi Green Mood pour leur bien-être quotidien.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="p-6 md:p-8 rounded-2xl bg-zinc-900/50 border border-white/[0.06] hover:border-white/[0.1] transition-all"
            >
              <div className="flex gap-1 mb-5">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 text-green-neon fill-green-neon" />
                ))}
              </div>
              <p className="text-base text-zinc-300 font-light leading-relaxed italic mb-6">"{t.text}"</p>
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-5">
                <span className="font-semibold text-white text-sm">{t.name}</span>
                <span className="text-zinc-600 text-xs">{t.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ────────── Trust Bar ────────── */}
      <section className="py-16 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { value: "98%", label: "Clients Satisfaits", accent: true },
            { value: "24H", label: "Expédition moy.", accent: false },
            { value: "100%", label: "Biologique & Traçable", accent: false },
            { value: "+50", label: "Références Premium", accent: false },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1.5">
              <p className={`text-3xl md:text-4xl font-bold tracking-tight ${stat.accent ? "text-green-neon" : "text-white"}`}>{stat.value}</p>
              <p className="text-zinc-500 font-medium uppercase tracking-wider text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────── FAQ ────────── */}
      <FAQ />

      {/* ────────── Final CTA ────────── */}
      <section className="py-16 md:py-24 text-center px-5 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-green-neon/25 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
            RESSENTEZ <br />
            <span className="text-green-neon">LA DIFFÉRENCE.</span>
          </h2>
          <Link
            to="/boutique"
            className="inline-flex items-center gap-3 px-8 py-4 bg-green-neon text-black font-semibold rounded-2xl hover:shadow-[0_0_24px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all"
          >
            Accéder à la boutique
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
