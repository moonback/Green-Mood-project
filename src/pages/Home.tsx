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

  // 1. Enrichissement des données pour plus de crédibilité
  const stats = [
    { value: "4.9/5", label: "Avis vérifiés", icon: <Star className="w-4 h-4" /> },
    { value: "24h", label: "Expédition Paris", icon: <Truck className="w-4 h-4" /> },
    { value: "Laboratoire", label: "Tests certifiés", icon: <ShieldCheck className="w-4 h-4" /> },
    { value: "100% Légal", label: "THC < 0.3%", icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

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
        title="Green Mood | N10 : L'Innovation CBD Premium à Paris"
        description="Découvrez le N10, la molécule exclusive Green Mood. Plus intense que le CBNO, 100% légal. Livraison express de fleurs, huiles et résines CBD bio à Paris."
        keywords="CBD Paris, acheter CBD, boutique CBD, fleurs CBD, résine CBD, huile CBD, CBD légal, Green Mood, N10"
        schema={homeSchema}
      />

      {/* ────────── Hero Section : Plus Immersive ────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Effet de grain pour le côté "premium/organique" */}
        <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <div className="absolute inset-0 z-0">
          <img
            src="/images/N10.png"
            className="w-full h-full object-cover opacity-60 scale-105"
            alt="N10 Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/60 to-zinc-950" />
        </div>

        <div className="relative z-20 max-w-6xl mx-auto text-center px-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <span className="inline-block py-1 px-3 rounded-full border border-green-neon/30 bg-green-neon/10 text-green-neon text-[10px] font-bold tracking-[0.3em] mb-6">
              EXCLUSIVITÉ GREEN MOOD
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tighter leading-none mb-8">
              L'EXPÉRIENCE <br />
              <span className="text-green-neon italic glow-green">ULTIME.</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-10">
              Le N10 n'est pas une simple évolution. C'est une révolution sensorielle conçue pour surpasser les limites du CBD classique.
              <span className="text-white font-medium block mt-2 underline decoration-green-neon/40 underline-offset-4">Puissance absolue. Pureté garantie.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link to="/catalogue?search=N10" className="group relative px-10 py-5 bg-green-neon text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105">
                <span className="relative z-10 flex items-center gap-2">
                  DÉCOUVRIR LE N10 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────── Trust Bar : Nouvelle Version ────────── */}
      <div className="border-y border-white/[0.05] bg-zinc-900/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-green-neon mb-1">
                  {s.icon}
                  <span className="text-xl font-bold text-white">{s.value}</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────────── N10 Deep Dive : Focus "Science & Bien-être" ────────── */}
      <section className="py-24 px-5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-green-neon/20 blur-[80px]" />
            <img
              src="/images/presentation-cbd2.png"
              className="rounded-3xl border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
              alt="Expertise Green Mood"
            />
          </div>
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
              Pourquoi choisir <br />
              <span className="text-green-neon">la molécule N10 ?</span>
            </h2>
            <div className="space-y-6">
              {[
                { t: "Biodisponibilité Accrue", d: "Une absorption par l'organisme 3x plus rapide que les huiles classiques." },
                { t: "Effet d'Entourage Optimisé", d: "Une synergie complexe de terpènes pour une relaxation profonde et durable." },
                { t: "Zéro Résidu Chimique", d: "Extraction au CO2 supercritique, la méthode la plus pure au monde." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1"><Zap className="w-5 h-5 text-green-neon" /></div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{item.t}</h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
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
