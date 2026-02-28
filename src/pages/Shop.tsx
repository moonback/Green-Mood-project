import { motion } from "motion/react";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function Shop() {
  const shopSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "La Boutique Green Mood",
    "description": "Un espace pensé pour la détente, la découverte et le conseil personnalisé autour du CBD.",
    "image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop"
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      <SEO
        title="Notre Boutique CBD à Paris - Green Mood Shop"
        description="Plongez dans l'univers Green Mood. Découvrez notre histoire, nos valeurs de transparence et d'exigence, et venez nous rencontrer dans notre boutique à Paris."
        keywords="boutique CBD Paris, magasin CBD, histoire Green Mood, valeurs CBD, achat CBD en boutique"
        schema={shopSchema}
      />
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop"
            alt="Intérieur de la boutique"
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 to-zinc-950"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            La Boutique <span className="text-green-primary">Green Mood</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto font-light"
          >
            Un espace pensé pour la détente, la découverte et le conseil
            personnalisé.
          </motion.p>
        </div>
      </section>

      {/* History & Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-white mb-4">
                  Notre Histoire
                </h2>
                <p className="text-zinc-400 leading-relaxed">
                  Née de la passion pour les bienfaits naturels du chanvre,
                  Green Mood a ouvert ses portes avec une mission simple :
                  démocratiser l'accès à un CBD de haute qualité, dans un cadre
                  rassurant et professionnel.
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-serif font-bold text-white mb-4">
                  Nos Valeurs
                </h2>
                <ul className="space-y-4">
                  {[
                    {
                      title: "Transparence",
                      desc: "Des analyses claires pour chaque produit.",
                    },
                    {
                      title: "Exigence",
                      desc: "Une sélection rigoureuse des meilleurs producteurs européens.",
                    },
                    {
                      title: "Écoute",
                      desc: "Un accompagnement sur-mesure pour chaque client.",
                    },
                  ].map((value, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="w-2 h-2 mt-2 rounded-full bg-green-primary shrink-0" />
                      <div>
                        <strong className="text-white block">
                          {value.title}
                        </strong>
                        <span className="text-zinc-400 text-sm">
                          {value.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <img
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop"
                alt="Détail boutique"
                className="rounded-2xl w-full h-64 object-cover"
                referrerPolicy="no-referrer"
              />
              <img
                src="https://images.unsplash.com/photo-1611078716898-1e4281f9b19e?q=80&w=1974&auto=format&fit=crop"
                alt="Produits en rayon"
                className="rounded-2xl w-full h-64 object-cover mt-8"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visit Us CTA */}
      <section className="py-24 bg-black border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-8">
            Venez nous rencontrer
          </h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12">
            <div className="flex items-center gap-3 text-zinc-300">
              <MapPin className="h-6 w-6 text-green-primary" />
              <span className="text-lg">123 Rue de la Nature, 75000 Paris</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/20"></div>
            <div className="flex items-center gap-3 text-zinc-300">
              <Clock className="h-6 w-6 text-green-primary" />
              <span className="text-lg">Lun-Sam : 10h00 - 19h30</span>
            </div>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-primary hover:bg-green-600 text-white rounded-full font-medium transition-all transform hover:scale-105"
          >
            Voir sur la carte
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
