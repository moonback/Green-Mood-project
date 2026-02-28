import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ShieldCheck, Leaf, HeartHandshake, ArrowRight } from "lucide-react";
import FAQ from "../components/FAQ";
import SEO from "../components/SEO";

export default function Home() {
  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Green Moon CBD Shop",
    "image": "https://images.unsplash.com/photo-1603908064973-206e23114d59?q=80&w=2070&auto=format&fit=crop",
    "@id": "https://greenmoon-cbd.fr",
    "url": "https://greenmoon-cbd.fr",
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

  return (
    <div className="flex flex-col min-h-screen">
      <SEO
        title="Acheter CBD à Paris - Green Moon Shop | Fleurs, Résines, Huiles"
        description="Découvrez Green Moon, votre CBD Shop premium à Paris. Fleurs, résines et huiles 100% légales. Qualité supérieure, traçabilité et conseils d'experts."
        keywords="CBD Paris, acheter CBD, boutique CBD, fleurs CBD, résine CBD, huile CBD, CBD légal, Green Moon"
        schema={homeSchema}
      />
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        ```tsx
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg.png"
            alt="Intérieur de la boutique Green Moon"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/40 to-zinc-950/80"></div>
        </div>
        ```

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tighter text-white">
              L'Excellence du <span className="text-green-primary">CBD</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto font-light leading-relaxed">
              Découvrez une sélection premium de fleurs, résines et huiles.
              Naturel, légal et rigoureusement contrôlé.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link
                to="/boutique"
                className="w-full sm:w-auto px-8 py-4 bg-green-primary hover:bg-green-600 text-white rounded-full font-medium transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-green-primary/20 flex items-center justify-center gap-2"
              >
                Découvrir la boutique
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/produits"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium backdrop-blur-sm transition-all transform hover:scale-105 flex items-center justify-center"
              >
                Voir nos produits
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Presentation */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
                Bienvenue chez Green Moon
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed">
                Plus qu'une simple boutique, Green Moon est un espace dédié à
                votre bien-être. Nous sélectionnons minutieusement chaque
                produit pour vous garantir une expérience authentique, sûre et
                de la plus haute qualité.
              </p>
              <p className="text-lg text-zinc-400 leading-relaxed">
                Notre équipe de passionnés est là pour vous écouter, vous
                conseiller et vous guider vers les produits les plus adaptés à
                vos besoins.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-green-primary hover:text-green-400 font-medium transition-all hover:translate-x-2 pt-4"
              >
                Nous rendre visite
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden"
            >
              <img
                src="/images/presentation-cbd2.png"
                alt="Produits CBD"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Strengths */}
      <section className="py-24 bg-black border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              Nos Engagements
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              La qualité et la transparence sont au cœur de notre démarche.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <ShieldCheck className="h-10 w-10 text-green-primary" />,
                title: "100% Légal & Conforme",
                description:
                  "Tous nos produits respectent strictement la législation française avec un taux de THC inférieur à 0.3%. Analyses laboratoires disponibles en boutique.",
              },
              {
                icon: <Leaf className="h-10 w-10 text-green-primary" />,
                title: "Qualité Premium",
                description:
                  "Des fleurs cultivées avec soin, des extractions propres et des huiles pressées à froid. Nous ne faisons aucun compromis sur la qualité.",
              },
              {
                icon: (
                  <HeartHandshake className="h-10 w-10 text-green-primary" />
                ),
                title: "Conseil Personnalisé",
                description:
                  "Chaque personne est unique. Nos experts prennent le temps de comprendre vos besoins pour vous orienter vers le produit idéal.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-green-primary/30 transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-green-primary/5"
              >
                <div className="mb-6 bg-zinc-950 w-16 h-16 rounded-xl flex items-center justify-center border border-white/10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
}
