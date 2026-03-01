import { motion } from "motion/react";
import {
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Eye,
  Users,
  Sparkles,
  Award,
  CalendarCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { useSettingsStore } from "../store/settingsStore";

export default function Shop() {
  const settings = useSettingsStore((s) => s.settings);

  const shopSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "La Boutique Green Mood",
    "description": "Un espace pensé pour la détente, la découverte et le conseil personnalisé autour du CBD.",
    "image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop"
  };

  const values = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-green-neon" />,
      title: "Transparence",
      desc: "Nous publions les certificats d'analyse de chaque lot pour garantir pureté et conformité."
    },
    {
      icon: <Award className="w-8 h-8 text-green-neon" />,
      title: "Exigence",
      desc: "Une sélection drastique des producteurs européens les plus qualifiés."
    },
    {
      icon: <Users className="w-8 h-8 text-green-neon" />,
      title: "Accompagnement",
      desc: "Nos conseillers sont formés pour vous guider vers la routine adaptée à vos besoins."
    },
    {
      icon: <Leaf className="w-8 h-8 text-green-neon" />,
      title: "Éthique",
      desc: "Des cultures 100% organiques, sans pesticides ni agents chimiques."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden pb-32">
      <SEO
        title="L'ADN Green Mood — Notre Boutique & Nos Valeurs"
        description="Plongez dans l'univers Green Mood. Découvrez notre histoire, nos valeurs de transparence et d'exigence, et venez nous rencontrer dans notre boutique à Paris."
        keywords="boutique CBD Paris, magasin CBD, histoire Green Mood, valeurs CBD, achat CBD en boutique"
        schema={shopSchema}
      />

      {/* Hero Header */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-24 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop"
            alt="Intérieur de la boutique Green Mood"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/60 to-zinc-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-green-neon text-xs font-black uppercase tracking-[0.3em]">
              <Eye className="w-4 h-4" />
              Vision & ADN
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tighter leading-none mb-8">
              L'EXPERIENCE <br />
              <span className="not-italic text-green-neon glow-green">GREEN MOOD.</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed pt-6">
              Plus qu'un point de vente, un sanctuaire dédié à la sérénité
              et à l'excellence naturelle au cœur de Paris.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brand Story Layout */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <h2 className="text-5xl md:text-6xl font-serif font-black text-white leading-[1.1]">
                  Une histoire de <br />
                  <span className="text-green-neon">Passion Purifiée.</span>
                </h2>
                <div className="w-20 h-1 bg-green-neon" />
                <p className="text-xl text-zinc-400 leading-relaxed font-light">
                  Née de la volonté d'offrir une alternative authentique et exigeante,
                  Green Mood a été fondée par des experts passionnés par les multiples
                  facettes du chanvre. Notre mission : démocratiser les bienfaits du CBD
                  tout en élevant les standards de qualité du marché français.
                </p>
                <p className="text-lg text-zinc-500 leading-relaxed italic">
                  "Nous croyons qu'un bien-être durable ne peut naître que d'une
                  transparence totale et d'un respect absolu de la plante."
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
                  <p className="text-4xl font-black text-green-neon tracking-tighter">2019</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Naissance de Green Mood</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
                  <p className="text-4xl font-black text-white tracking-tighter">50+</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Références Premium</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square"
            >
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-neon/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-green-neon/10 rounded-full blur-[100px]" />

              <div className="relative h-full w-full rounded-[4rem] overflow-hidden border border-white/10 shadow-3xl">
                <img
                  src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop"
                  alt="Détails de notre boutique"
                  className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/60 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Grid - Cards */}
      <section className="py-32 bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-4xl md:text-6xl font-serif font-black text-white">Nos <span className="text-green-neon">Piliers</span></h2>
            <p className="text-zinc-500 text-lg">La charte qui définit chaque décision chez Green Mood.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2.5rem] bg-zinc-950 border border-white/5 hover:border-green-neon/30 transition-all group"
              >
                <div className="mb-8 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {v.icon}
                </div>
                <h3 className="text-2xl font-bold font-serif mb-4">{v.title}</h3>
                <p className="text-zinc-400 font-light leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit Experience CTA */}
      <section className="py-40 relative px-4">
        {/* Background Visual */}
        <div className="absolute inset-x-0 top-0 h-full -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-zinc-950" />
          <img
            src="/images/lifestyle-relax.png"
            alt="Wellness"
            className="w-full h-full object-cover opacity-10"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          <h2 className="text-5xl md:text-8xl font-serif font-black text-white tracking-tight">
            PASSEZ NOUS <br />
            <span className="text-green-neon italic">VOIR À PARIS.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-neon/10 flex items-center justify-center">
                <MapPin className="text-green-neon w-6 h-6" />
              </div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Notre Adresse</p>
              <p className="text-white font-medium">{settings.store_address || '123 Rue de la Nature, 75000 Paris'}</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-neon/10 flex items-center justify-center">
                <Clock className="text-green-neon w-6 h-6" />
              </div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Horaires d'ouverture</p>
              <p className="text-white font-medium whitespace-pre-line">{settings.store_hours || 'Lun-Sam : 10h00 - 19h30'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link
              to="/contact"
              className="px-10 py-5 bg-green-neon text-black font-black rounded-2xl transition-all transform hover:scale-105 hover:glow-box-green flex items-center justify-center gap-3"
            >
              Calculer l'itinéraire
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/catalogue"
              className="px-10 py-5 bg-white/5 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              <CalendarCheck className="w-5 h-5 text-zinc-500" />
              Commander en ligne
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Expert Quote Bar */}
      <section className="py-24 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Sparkles className="w-10 h-10 text-green-neon mx-auto mb-8 animate-pulse" />
          <p className="text-2xl md:text-3xl font-serif font-light text-zinc-300 italic leading-relaxed">
            "L'essence de Green Mood réside dans l'équilibre parfait entre la rigueur de la science
            et la bienveillance de la nature."
          </p>
        </div>
      </section>
    </div>
  );
}
