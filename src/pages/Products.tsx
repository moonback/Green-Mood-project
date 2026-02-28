import { motion } from "motion/react";
import {
  Leaf,
  Droplet,
  Coffee,
  Info,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Zap,
  Moon,
  Wind
} from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function Products() {
  const productsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Product",
          "name": "Fleurs CBD",
          "description": "Des fleurs cultivées en intérieur, sous serre ou en extérieur. Sélectionnées pour leurs profils terpéniques uniques et leur qualité irréprochable."
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Product",
          "name": "Résines & Pollens CBD",
          "description": "Des extractions traditionnelles et modernes offrant des textures variées et des arômes puissants."
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Product",
          "name": "Huiles & Infusions CBD",
          "description": "Des huiles Full Spectrum et Broad Spectrum pressées à froid pour conserver tous les bienfaits de la plante."
        }
      }
    ]
  };

  const categories = [
    {
      id: "fleurs",
      title: "Fleurs CBD Premium",
      subtitle: "Culture d'Excellence",
      icon: <Leaf className="h-6 w-6 text-green-neon" />,
      description:
        "Nos fleurs sont le fruit d'une sélection rigoureuse parmi les meilleurs producteurs européens. Cultivées sans pesticides ni métaux lourds, elles offrent des arômes complexes et des effets équilibrés.",
      image: "/images/products-flower.png",
      tag: "Indoor & Greenhouse",
      features: [
        { icon: <Zap className="w-4 h-4" />, text: "Arômes Exceptionnels" },
        { icon: <ShieldCheck className="w-4 h-4" />, text: "Tests Labo Systématiques" },
      ],
      items: ["Amnesia Haze", "Gelato", "White Widow", "Purple Punch", "Orange Bud", "Strawberry"],
    },
    {
      id: "resines",
      title: "Résines & Pollens",
      subtitle: "Extractions Millénaires",
      icon: <Sparkles className="h-6 w-6 text-green-neon" />,
      description:
        "Découvrez des textures variées allant de la mousse aérienne au gras onctueux. Nos extractions préservent l'intégralité du profil terpénique pour une puissance aromatique décuplée.",
      image: "/images/products-resin.png",
      tag: "Tradition & Innovation",
      features: [
        { icon: <Wind className="w-4 h-4" />, text: "Textures Uniques" },
        { icon: <Sparkles className="w-4 h-4" />, text: "Haute Concentration" },
      ],
      items: ["Afghan Gold", "Jaune Mousseux", "Filtré x3", "Ice O Lator", "Caramelo", "Moonrock"],
    },
    {
      id: "huiles",
      title: "Huiles & Élixirs",
      subtitle: "Bien-être Holistique",
      icon: <Droplet className="h-6 w-6 text-green-neon" />,
      description:
        "Pressées à froid et enrichies en terpènes, nos huiles Full Spectrum vous accompagnent au quotidien pour apaiser l'esprit et revitaliser le corps.",
      image: "/images/products-oil.png",
      tag: "Full & Broad Spectrum",
      features: [
        { icon: <Moon className="w-4 h-4" />, text: "Qualité Sommeil" },
        { icon: <ShieldCheck className="w-4 h-4" />, text: "Hautement Bio-assimilable" },
      ],
      items: [
        "Huile 10% Quotidienne",
        "Huile 20% Sommeil Profond",
        "Huile 30% Récupération",
        "Infusion Détente Soirée",
        "Élixir Focus & Énergie",
        "Baume Apaisant"
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden pb-32">
      <SEO
        title="Collections CBD Premium — Green Mood Shop"
        description="Explorez l'univers Green Mood : fleurs d'exception, résines artisanales et huiles de bien-être. Une qualité supérieure pour une expérience sans compromis."
        keywords="produits CBD, fleurs CBD, résine CBD, huile CBD, infusion CBD, achat CBD, qualité premium"
        schema={productsSchema}
      />

      {/* Hero Header - Sleek Architecture */}
      <section className="relative pt-40 pb-32 overflow-hidden px-4">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-green-neon/5 rounded-full blur-[150px] -z-10" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <span className="text-green-neon font-black tracking-[0.4em] uppercase text-xs">Notre Savoir-Faire</span>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black tracking-tighter leading-[0.85]">
              L'ART DU <br />
              <span className="text-green-neon italic glow-green">CHANVRE.</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed pt-6">
              Une gamme structurée pour répondre à chaque besoin, chaque palais
              et chaque moment de votre journée.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Collections */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-40">
          {categories.map((cat, index) => (
            <div key={cat.id} className="relative">
              {/* Background text for depth */}
              <div className={`absolute -top-20 hidden lg:block text-[150px] font-black text-white/5 select-none pointer-events-none ${index % 2 === 1 ? '-left-20' : '-right-20'}`}>
                {cat.tag.split(' ')[0]}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`flex flex-col lg:flex-row gap-20 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Image Content */}
                <div className="w-full lg:w-[45%]">
                  <div className="relative group perspective-1000">
                    <div className="absolute -inset-4 bg-green-neon/10 rounded-[4rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative aspect-[3/4] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 transform group-hover:scale-[1.02] group-hover:rotate-1">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                      <div className="absolute top-8 left-8 flex flex-col gap-2">
                        <span className="px-5 py-2 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white text-xs font-black tracking-widest uppercase">
                          {cat.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="w-full lg:w-[55%] space-y-10">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-4 text-green-neon">
                      {cat.icon}
                      <span className="font-bold tracking-[0.2em] uppercase text-sm">{cat.subtitle}</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-serif font-black text-white">
                      {cat.title}
                    </h2>
                    <p className="text-xl text-zinc-400 leading-relaxed font-light font-sans">
                      {cat.description}
                    </p>
                  </div>

                  {/* Feature badges */}
                  <div className="flex flex-wrap gap-4">
                    {cat.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium">
                        {feat.icon}
                        {feat.text}
                      </div>
                    ))}
                  </div>

                  {/* Gamme Preview */}
                  <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-10 space-y-6">
                    <h3 className="text-zinc-500 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-8 h-[1px] bg-green-neon" />
                      Les incontournables
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-white group cursor-default">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-neon transition-transform group-hover:scale-150" />
                          <span className="font-medium text-sm lg:text-base group-hover:text-green-neon transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={`/catalogue?category=${cat.id}`}
                    className="inline-flex items-center gap-4 bg-white text-black px-10 py-5 rounded-2xl font-black hover:bg-green-neon transition-all group"
                  >
                    Acheter cette gamme
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                  </Link>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Global Commitment Bar */}
      <section className="mt-40 py-20 bg-zinc-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-around gap-12 text-center">
          {[
            { icon: <ShieldCheck className="w-8 h-8 text-green-neon mx-auto mb-4" />, title: "Légalité", text: "Taux THC < 0.3%" },
            { icon: <Leaf className="h-8 w-8 text-green-neon mx-auto mb-4" />, title: "Naturel", text: "Culture organique" },
            { icon: <Droplet className="h-8 w-8 text-green-neon mx-auto mb-4" />, title: "Pureté", text: "Sans additifs" },
            { icon: <Info className="h-8 w-8 text-green-neon mx-auto mb-4" />, title: "Conseil", text: "Expertise locale" },
          ].map((item, i) => (
            <div key={i} className="space-y-1">
              {item.icon}
              <p className="font-bold text-white text-lg">{item.title}</p>
              <p className="text-zinc-500 text-sm uppercase tracking-widest">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Online Experience CTA */}
      <section className="py-40 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto relative rounded-[4rem] p-12 md:p-24 overflow-hidden border border-white/10 group"
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-green-neon/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="relative z-10 text-center space-y-10">
            <ShoppingBag className="w-16 h-16 text-green-neon mx-auto animate-bounce-slow" />
            <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl font-serif font-black text-white italic">
                L'expérience <br /> Green Mood <span className="text-green-neon not-italic font-sans">Online.</span>
              </h2>
              <p className="text-xl text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
                Profitez du Click & Collect rapide à Paris ou de la livraison
                discrète partout en France. Tous nos produits sont expédiés
                dans des emballages neutres et hermétiques.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/catalogue"
                className="px-12 py-6 bg-green-neon text-black font-black rounded-2xl hover:glow-box-green transition-all transform hover:scale-105"
              >
                Explorer le Catalogue
              </Link>
              <Link
                to="/contact"
                className="px-12 py-6 bg-white/5 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                Horaires de la Boutique
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
