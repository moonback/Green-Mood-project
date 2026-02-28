import { motion } from "motion/react";
import { Leaf, Droplet, Coffee, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function Products() {
  const categories = [
    {
      id: "fleurs",
      title: "Fleurs CBD",
      icon: <Leaf className="h-8 w-8 text-green-primary" />,
      description:
        "Des fleurs cultivées en intérieur, sous serre ou en extérieur. Sélectionnées pour leurs profils terpéniques uniques et leur qualité irréprochable.",
      image:
        "https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=1974&auto=format&fit=crop",
      items: ["Amnesia Haze", "Gelato", "White Widow", "Strawberry"],
    },
    {
      id: "resines",
      title: "Résines & Pollens",
      icon: (
        <div className="h-8 w-8 rounded-full bg-green-primary/20 border border-green-primary flex items-center justify-center">
          <span className="text-green-primary font-bold text-xs">R</span>
        </div>
      ),
      description:
        "Des extractions traditionnelles et modernes offrant des textures variées (mousseux, gras, filtré) et des arômes puissants.",
      image:
        "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop",
      items: ["Afghan", "Jaune Mousseux", "Filtré x3", "Ice O Lator"],
    },
    {
      id: "huiles",
      title: "Huiles & Infusions",
      icon: <Droplet className="h-8 w-8 text-green-primary" />,
      description:
        "Des huiles Full Spectrum et Broad Spectrum pressées à froid pour conserver tous les bienfaits de la plante. Infusions relaxantes pour le soir.",
      image:
        "https://images.unsplash.com/photo-1611078716898-1e4281f9b19e?q=80&w=1974&auto=format&fit=crop",
      items: [
        "Huile 10% Full Spectrum",
        "Huile 20% Sommeil",
        "Infusion Détente",
        "Infusion Digestion",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      {/* Header */}
      <section className="py-24 text-center px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
        >
          Nos <span className="text-green-primary">Produits</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-zinc-400 max-w-2xl mx-auto font-light"
        >
          Une sélection rigoureuse pour vous offrir le meilleur du chanvre.
          Disponibles exclusivement dans notre boutique.
        </motion.p>
      </section>

      {/* Categories */}
      <section className="py-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col ${index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-12 items-center`}
            >
              <div className="w-full lg:w-1/2 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  {category.icon}
                  <h2 className="text-3xl font-serif font-bold text-white">
                    {category.title}
                  </h2>
                </div>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  {category.description}
                </p>

                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 mt-8">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-green-primary" />
                    Aperçu de la gamme
                  </h3>
                  <ul className="grid grid-cols-2 gap-3">
                    {category.items.map((item, i) => (
                      <li
                        key={i}
                        className="text-zinc-300 flex items-center gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-primary/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden group">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Info Banner */}
      <section className="py-16 bg-green-primary/10 border-y border-green-primary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Info className="h-12 w-12 text-green-primary mx-auto mb-6" />
          <h2 className="text-2xl font-serif font-bold text-white mb-4">
            Vente en boutique uniquement
          </h2>
          <p className="text-zinc-300 mb-8">
            Pour vous garantir le meilleur conseil et respecter la législation
            en vigueur, nos produits sont disponibles exclusivement dans notre
            boutique physique.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 hover:bg-zinc-200 rounded-full font-medium transition-all"
          >
            Voir nos horaires et accès
          </Link>
        </div>
      </section>
    </div>
  );
}
