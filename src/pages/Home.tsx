import { motion, useMotionValue, useSpring } from "motion/react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
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
  Zap,
  Microscope,
  Info
} from "lucide-react";
import FAQ from "../components/FAQ";
import SEO from "../components/SEO";
import { useSettingsStore } from "../store/settingsStore";

export default function Home() {
  const settings = useSettingsStore((s) => s.settings);

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
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const stats = [
    { value: "0,05 €/mg", label: "Prix imbattable", icon: <Zap className="w-4 h-4" /> },
    { value: "24h", label: "Livraison Paris", icon: <Truck className="w-4 h-4" /> },
    { value: "Laboratoire", label: "Tests certifiés", icon: <Microscope className="w-4 h-4" /> },
    { value: "100% Bio", label: "Naturel & Organique", icon: <Leaf className="w-4 h-4" /> },
  ];

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "N10 CBD Shop",
    "image": "https://images.unsplash.com/photo-1603908064973-206e23114d59?q=80&w=2070&auto=format&fit=crop",
    "@id": "https://n10-cbd.fr",
    "url": "https://n10-cbd.fr",
    "telephone": "0123456789",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Paris",
      "addressLocality": "Paris",
      "postalCode": "75000",
      "addressCountry": "FR"
    }
  };

  const categories = [
    { name: "Fleurs", slug: "fleurs", img: "/images/products-flower.png", count: "18 varietés" },
    { name: "Huiles", slug: "huiles", img: "/images/cbd-oil.png", count: "8 concentrés" },
    { name: "Résines", slug: "resines", img: "/images/products-resin.png", count: "12 textures" },
    { name: "Cosmétiques", slug: "cosmetiques", img: "/images/lifestyle-relax.png", count: "6 produits" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white overflow-hidden">
      <SEO
        title="N10 | L'Expérience CBD Ultime - Boutique Premium"
        description="Découvrez le N10, une révolution CBD conçue pour surpasser les limites du bien-être classique. Puissance absolue, pureté garantie et livraison 24h à Paris."
        keywords="N10, CBD Paris, CBD Premium, Huile N10, Fleurs CBD bio, Livraison CBD express"
        schema={homeSchema}
      />

      {/* ────────── Hero Section ────────── */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Floating Mouse-Following Glow */}
        <motion.div
          style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
          className="absolute z-0 w-[500px] h-[500px] bg-green-neon/10 rounded-full blur-[120px] pointer-events-none opacity-40 mix-blend-screen"
        />

        {/* Static Background Glows */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-neon/10 rounded-full blur-[100px] pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-neon/5 rounded-full blur-[120px] pointer-events-none"
        />

        <div className="absolute inset-0 z-0">
          <img
            src="/images/N10.png"
            className="w-full h-full object-cover opacity-100 scale-105"
            alt="N10 Experience"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />
        </div>

        <div className="relative z-20 max-w-6xl mx-auto text-center px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full border border-green-neon/30 bg-green-neon/10 text-green-neon text-[11px] font-bold tracking-[0.4em] mb-8 uppercase backdrop-blur-sm">
              Révolution Bien-être
            </span>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold tracking-tighter leading-none mb-10">
              L'EXPÉRIENCE <br />
              <span className="text-green-neon italic glow-green filter hue-rotate-[15deg] brightness-125">ULTIME.</span>
            </h1>
            <p className="text-zinc-300 text-lg md:text-2xl max-w-3xl mx-auto font-light leading-relaxed mb-12">
              Le N10 n'est pas une simple évolution. C'est une révolution conçue pour surpasser les limites du CBD classique.
              <span className="text-white font-semibold block mt-4 text-2xl">Puissance absolue. Pureté garantie.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/catalogue"
                className="group relative px-12 py-5 bg-green-neon text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(57,255,20,0.6)] active:scale-95"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2 text-lg">
                  Découvrez le N10 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────── Atouts : Trust Bar ────────── */}
      <div className="border-y border-white/[0.05] bg-zinc-950/50 backdrop-blur-xl relative z-30">
        <div className="max-w-7xl mx-auto px-5 py-12 md:py-16">
          <h3 className="text-center text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold mb-10">Nos atouts en un coup d'œil</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-green-neon mb-2">
                  {s.icon}
                </div>
                <div className="space-y-1">
                  <span className="text-xl md:text-2xl font-bold text-white block">{s.value}</span>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────────── N10 Deep Dive : Pourquoi choisir ────────── */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-neon/10 blur-[100px] rounded-full" />
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="/images/presentation-cbd.png"
                className="w-full grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                alt="Technologie N10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] opacity-20" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-zinc-900 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-xl group-hover:border-green-neon/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-neon/20 rounded-2xl flex items-center justify-center text-green-neon">
                  <Microscope className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Innovation</p>
                  <p className="text-white font-bold text-lg">Lab-Certified</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-green-neon font-bold tracking-[0.3em] text-[11px] uppercase">L'excellence moléculaire</span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight text-white">
                Pourquoi choisir <br />
                <span className="text-green-neon italic">la molécule N10 ?</span>
              </h2>
            </div>

            <div className="space-y-8">
              {[
                {
                  t: "Biodisponibilité optimisée",
                  d: "Une absorption rapide et efficace pour des effets durables jusqu'à 24 heures, grâce à notre technologie d'encapsulation nanométrique."
                },
                {
                  t: "Effet liftant et relaxant",
                  d: "Notre formulation unique offre une sensation de bien-être profond et durable, idéale pour relâcher les tensions."
                },
                {
                  t: "Extraction au CO₂ supercritique",
                  d: "Un procédé propre et écologique qui préserve l'intégrité des cannabinoïdes tout en réduisant l'empreinte énergétique."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex gap-6 p-6 rounded-3xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all"
                >
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-green-neon group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white text-xl font-bold mb-2">{item.t}</h4>
                    <p className="text-zinc-400 leading-relaxed font-light">{item.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────────── Nos Essentiels ────────── */}
      <section className="py-24 md:py-32 bg-zinc-900/20 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
                Nos <span className="text-green-neon italic">Essentiels</span>
              </h2>
              <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed">
                Découvrez notre gamme de produits soigneusement sélectionnés pour répondre à tous vos besoins :
                <span className="text-white"> huiles, fleurs, résines, infusions et cosmétiques au CBD.</span>
              </p>
            </div>
            <Link to="/catalogue" className="group inline-flex items-center gap-3 bg-white/[0.03] border border-white/10 px-8 py-4 rounded-2xl text-white font-semibold hover:bg-green-neon hover:text-black transition-all">
              Boutique complète <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
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
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/[0.05] hover:border-green-neon/30 transition-all shadow-2xl"
                >
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />
                  <div className="absolute bottom-0 inset-x-0 p-8">
                    <p className="text-green-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{cat.count}</p>
                    <h3 className="text-2xl md:text-3xl font-bold font-serif text-white">{cat.name}</h3>
                  </div>
                  <div className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-2 group-hover:translate-y-0 group-hover:bg-green-neon group-hover:border-green-neon">
                    <ArrowRight className="w-5 h-5 text-white group-hover:text-black" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── Brand Values : Le bien-être ────────── */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 space-y-12">
            <div className="space-y-6">
              <span className="text-green-neon font-bold tracking-[0.3em] text-[11px] uppercase">L'art de vivre N10</span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
                Le bien-être, <br />
                <span className="italic text-zinc-500 font-light">une compétence à cultiver.</span>
              </h2>
              <p className="text-lg md:text-xl text-zinc-400 leading-relaxed font-light">
                Chez N10, nous ne sommes pas qu'un simple magasin de CBD. Nous vous accompagnons vers un mode de vie plus serein et équilibré.
              </p>
            </div>

            <div className="grid gap-6">
              {[
                {
                  title: "Culture N10 : organisation et sens pratique",
                  desc: "Des conseils personnalisés pour intégrer le CBD dans votre quotidien."
                },
                {
                  title: "Compétences personnelles",
                  desc: "Des formations et ateliers pour apprendre à gérer le stress et améliorer votre concentration."
                },
                {
                  title: "Notre charte qualité",
                  desc: "Un engagement rigoureux pour des produits irréprochables, de la culture à la vente."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="mt-1 w-6 h-6 rounded-full bg-green-neon/10 border border-green-neon/30 flex items-center justify-center shrink-0 group-hover:bg-green-neon transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-neon group-hover:text-black" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-bold text-lg">{item.title}</p>
                    <p className="text-zinc-500 font-light">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <img
              src="/images/lifestyle-relax.png"
              alt="Lifestyle CBD"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-green-neon/20 to-transparent mix-blend-overlay" />
          </motion.div>
        </div>
      </section>

      {/* ────────── BudTender CTA : Conseil sur-mesure ────────── */}
      <section className="py-24 md:py-32 px-5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-zinc-900 border border-white/[0.05] rounded-[3rem] p-8 md:p-20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-green-neon/5 blur-[120px] rounded-full translate-x-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-green-neon/10 text-green-neon font-bold text-[10px] uppercase tracking-[0.2em]">
                <Sparkles className="w-4 h-4" />
                Conseil personnalisé
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
                Besoin de conseils <br />
                <span className="text-green-neon italic">sur-mesure ?</span>
              </h2>
              <p className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl mx-auto lg:mx-0">
                Notre équipe est à votre écoute pour vous guider vers le produit le mieux adapté à vos attentes.
                Contactez-nous dès maintenant pour une consultation personnalisée.
              </p>
              <div className="pt-4 flex flex-wrap gap-5 justify-center lg:justify-start">
                <button
                  onClick={() => {
                    const btn = document.querySelector('[aria-label="Toggle BudTender"]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="bg-green-neon text-black px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl"
                >
                  Démarrer la consultation
                </button>
              </div>
            </div>

            <div className="hidden lg:flex w-64 h-64 relative shrink-0">
              <div className="absolute inset-0 bg-green-neon opacity-20 blur-[60px] animate-pulse" />
              <div className="relative w-full h-full bg-zinc-800 rounded-full border border-white/10 flex items-center justify-center">
                <div className="w-[80%] h-[80%] rounded-full border border-green-neon/20 animate-[spin_15s_linear_infinite]" />
                <MessageCircle className="absolute w-20 h-20 text-green-neon" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ────────── Testimonials ────────── */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white">Témoignages & <br /><span className="text-green-neon italic">expériences</span></h2>
            <p className="text-zinc-500 text-lg md:text-xl font-light max-w-2xl mx-auto">
              Découvrez ce que nos clients disent de leurs expériences avec le N10 et comment il a amélioré leur bien-être au quotidien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sébastien L.", text: "Le N10 a radicalement changé ma routine de sommeil. Une pureté exemplaire.", rating: 5 },
              { name: "Marie-Sophie T.", text: "Enfin un CBD qui tient ses promesses sur la durée. Effet relaxant profond.", rating: 5 },
              { name: "Julien R.", text: "La livraison en 24h à Paris est un vrai plus. Service client ultra réactif.", rating: 5 }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2rem] bg-zinc-900/40 border border-white/[0.05] hover:border-green-neon/20 transition-all"
              >
                <div className="flex gap-1 mb-8">
                  {[...Array(t.rating)].map((_, idx) => (
                    <Star key={idx} className="w-5 h-5 text-green-neon fill-green-neon" />
                  ))}
                </div>
                <p className="text-xl text-zinc-300 font-light leading-relaxed italic mb-8">"{t.text}"</p>
                <div className="pt-6 border-t border-white/5 font-bold text-white uppercase tracking-widest text-xs">{t.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── Latest News ────────── */}
      <section className="py-24 md:py-32 px-5 bg-zinc-900/10 border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-px bg-green-neon/40" />
            <h2 className="text-xl font-bold uppercase tracking-[0.3em] text-white">Dernières actualités</h2>
          </div>

          <Link to="/catalogue" className="group block p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-zinc-900/50 hover:border-green-neon/30 transition-all relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-full md:w-1/3 aspect-square rounded-[2rem] overflow-hidden">
                <img src="/images/cbd-oil.png" alt="Nouveau produit" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex-1 space-y-6">
                <span className="inline-block px-4 py-1.5 bg-green-neon text-black text-[10px] font-bold uppercase tracking-widest rounded-full">Nouveau</span>
                <h3 className="text-3xl md:text-5xl font-serif font-bold text-white">L'huile N10 Full Spectrum</h3>
                <p className="text-xl text-zinc-400 font-light">Découvrez notre dernière innovation pour un bien-être optimal au quotidien.</p>
                <div className="pt-4 flex items-center gap-3 text-green-neon font-bold uppercase tracking-[0.2em] text-xs">
                  Explorer l'innovation <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ────────── FAQ ────────── */}
      <FAQ />

      {/* ────────── Final CTA ────────── */}
      <section className="py-32 md:py-48 text-center px-5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-green-neon/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-green-neon/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-green-neon/10 blur-[160px] rounded-full pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10 space-y-12"
        >
          <h2 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-white tracking-tighter leading-none uppercase">
            RESSENTEZ <br />
            <span className="text-green-neon italic glow-green">LA DIFFÉRENCE.</span>
          </h2>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-4 px-12 py-6 bg-green-neon text-black font-bold rounded-full text-xl hover:shadow-[0_0_40px_rgba(57,255,20,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            Accédez à la boutique
            <ArrowRight className="w-6 h-6" />
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
