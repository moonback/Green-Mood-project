import { motion } from "motion/react";
import { ShieldCheck, FileText, CheckCircle, Search, Beaker, Globe, Lock, Microscope } from "lucide-react";
import SEO from "../components/SEO";

export default function Quality() {
  const qualitySchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Qualité, Légalité & Innovation N10 - Green Mood Shop",
    "description": "Découvrez l'excellence de la molécule N10 et de notre CBD. Tous nos produits respectent la législation française avec un taux de THC inférieur à 0.3%."
  };

  const certificates = [
    { title: "Taux de THC < 0.3%", icon: ShieldCheck, detail: "Conformité totale avec la loi française et les réglementations européennes." },
    { title: "Standard Bio-Éthique", icon: Lock, detail: "Culture sans pesticides, métaux lourds ou additifs chimiques nocifs." },
    { title: "Traçabilité Source", icon: Globe, detail: "Suivi complet de la graine au produit fini pour chaque lot commercialisé." },
    { title: "Expertise Lab", icon: Microscope, detail: "Validation par des laboratoires européens indépendants et certifiés." },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SEO
        title="Qualité & Innovation — L'Excellence N10 & CBD"
        description="Votre sécurité est une priorité absolue. Nos produits N10 et CBD respectent la législation française (THC < 0.3%). Purity standards et analyses labo."
        keywords="qualité N10, légalité CBD, N10 puissant, CBD premium, THC inférieur 0.3, traçabilité cannabinoïdes"
        schema={qualitySchema}
      />

      {/* Hero Header */}
      <section className="relative pt-40 pb-32 px-4 overflow-hidden">
        {/* L'image de fond doit avoir une opacité contrôlée pour laisser ressortir le texte */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/cbd-oil.png"
            alt="Pure CBD Gold"
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-green-neon/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-green-neon text-xs font-black uppercase tracking-widest mb-8"
          >
            <Beaker className="w-4 h-4" />
            Standard de Pureté Master
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tighter leading-none mb-8"
          >
            L'INNOVATION <br />
            <span className="text-green-neon italic glow-green">MOLÉCULAIRE.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Dans un marché en quête d'identité, Green Mood s'impose par une exigence
            scientifique et une transparence radicale pour votre sérénité.
          </motion.p>
        </div>
      </section>

      {/* Main Pillars Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {certificates.map((cert, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.04] transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-neon/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-neon/20 transition-all duration-500">
                <cert.icon className="w-7 h-7 text-green-neon" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider mb-3">{cert.title}</h3>
              <p className="text-sm text-zinc-500 font-light leading-relaxed">
                {cert.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Content Deep Dive */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-40">

          {/* Legal Compliance Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-serif font-black">Conformité <br /> <span className="text-green-neon italic">Légale Totale.</span></h2>
              </div>
              <div className="space-y-8">
                <p className="text-lg text-zinc-400 leading-relaxed font-light italic">
                  "La légalité n'est pas une option, c'est le socle sur lequel nous bâtissons
                  la confiance de nos clients exigeants."
                </p>
                <div className="grid gap-6">
                  <div className="flex gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <CheckCircle className="w-6 h-6 text-green-neon shrink-0" />
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-2">Molécule N10 & CBD</h4>
                      <p className="text-sm text-zinc-500 leading-relaxed font-light">
                        Le N10 est un dérivé du THC avec un taux <span className="text-green-neon font-bold">&lt; 0.3%</span>,
                        alliant puissance légale et pureté moléculaire absolue.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <CheckCircle className="w-6 h-6 text-green-neon shrink-0" />
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-2">Passeport Labo</h4>
                      <p className="text-sm text-zinc-500 leading-relaxed font-light">
                        Chaque extraction N10 et chaque fleur CBD subit un triple test indépendant pour garantir
                        l'absence de résidus et une concentration exacte.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[4rem] overflow-hidden border border-white/10"
            >
              <img src="/images/hero-bg.png" alt="Legal Compliance" className="w-full h-full object-cover grayscale opacity-40 hover:grayscale-0 transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10">
                <span className="px-6 py-3 rounded-full bg-green-neon text-black font-black text-xs uppercase tracking-widest shadow-2xl">
                  100% Légal & Certifié
                </span>
              </div>
            </motion.div>
          </div>

          {/* Traceability Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, order: 2 }}
              whileInView={{ opacity: 1, order: 2 }}
              viewport={{ once: true }}
              className="space-y-10 lg:order-2"
            >
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-serif font-black">L'Origine <br /> <span className="text-green-neon italic">Garantie.</span></h2>
              </div>
              <div className="space-y-8">
                <p className="text-lg text-zinc-400 leading-relaxed font-light">
                  Nous travaillons directement avec des maîtres-producteurs en Europe
                  (France, Italie, Suisse) qui respectent des cycles de culture lents
                  et durables.
                </p>

                <div className="bg-zinc-900 border border-white/5 p-10 rounded-[3rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-neon/10 blur-[60px] group-hover:bg-green-neon/20 transition-all duration-1000" />
                  <div className="flex items-center gap-6 mb-6">
                    <FileText className="w-10 h-10 text-green-neon" />
                    <h3 className="text-xl font-black uppercase tracking-widest">COA - Certificat d'Analyse</h3>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed font-light mb-8">
                    Chaque lot dispose de son propre passeport d'analyse détaillant le profil
                    complet des cannabinoïdes. Ces documents sont consultables librement
                    dans notre boutique à Paris.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      CBD %
                    </span>
                    <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      CBN %
                    </span>
                    <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      CBG %
                    </span>
                    <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-green-neon">
                      THC &lt; 0.3%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, order: 1 }}
              whileInView={{ opacity: 1, scale: 1, order: 1 }}
              viewport={{ once: true }}
              className="relative aspect-[4/5] rounded-[4rem] overflow-hidden border border-white/10 lg:order-1"
            >
              <img src="/images/products-flower.png" alt="Pure Flowers" className="w-full h-full object-cover scale-110 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-transparent to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Warning Footer Banner */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-12 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] text-center space-y-8">
          <Search className="w-12 h-12 text-zinc-700 mx-auto" />
          <div className="space-y-4">
            <h3 className="text-2xl font-serif font-black">Une Transparence Totale</h3>
            <p className="text-zinc-500 max-w-xl mx-auto font-light leading-relaxed">
              Nous vous accueillons en boutique pour échanger sur nos méthodes de sélection,
              nos origines et vous présenter les derniers certificats officiels de chaque variété en rayon.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
