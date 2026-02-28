import { motion } from "motion/react";
import { ShieldCheck, FileText, CheckCircle, Search } from "lucide-react";
import SEO from "../components/SEO";

export default function Quality() {
  const qualitySchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Qualité et Légalité du CBD - Green Mood Shop",
    "description": "Tous nos produits respectent la législation française avec un taux de THC inférieur à 0.3%. Analyses laboratoires disponibles en boutique."
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      <SEO
        title="Qualité, Légalité et Analyses CBD - Green Mood Shop"
        description="Votre sécurité est notre priorité. Nos produits CBD respectent la législation française (THC < 0.3%). Traçabilité et analyses laboratoires garanties."
        keywords="légalité CBD, CBD légal France, analyses CBD, qualité CBD, THC inférieur 0.3, traçabilité CBD"
        schema={qualitySchema}
      />
      {/* Header */}
      <section className="py-24 text-center px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
        >
          Qualité & <span className="text-green-neon">Légalité</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-zinc-400 max-w-2xl mx-auto font-light"
        >
          Votre sécurité et votre satisfaction sont nos priorités absolues.
          Découvrez nos engagements.
        </motion.p>
      </section>

      {/* Main Content */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Legal Compliance */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-neon/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-green-neon" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-white">
                  Conformité Légale
                </h2>
              </div>

              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Tous les produits proposés par Green Mood CBD Shop respectent
                  scrupuleusement la législation française et européenne en
                  vigueur.
                </p>
                <ul className="space-y-4 mt-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-neon shrink-0 mt-0.5" />
                    <span className="text-zinc-300">
                      Taux de THC inférieur à 0.3% garanti.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-neon shrink-0 mt-0.5" />
                    <span className="text-zinc-300">
                      Produits issus de variétés de chanvre autorisées par
                      l'Union Européenne.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-neon shrink-0 mt-0.5" />
                    <span className="text-zinc-300">
                      Aucun effet psychotrope ni risque de dépendance.
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Quality & Traceability */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-neon/20 flex items-center justify-center">
                  <Search className="h-6 w-6 text-green-neon" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-white">
                  Traçabilité & Analyses
                </h2>
              </div>

              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Nous sélectionnons nos fournisseurs avec la plus grande
                  exigence pour vous garantir des produits sains, naturels et
                  efficaces.
                </p>

                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-5 w-5 text-green-neon" />
                    <h3 className="text-xl font-bold text-white m-0">
                      Analyses Laboratoire
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-sm mb-0">
                    Chaque lot de fleurs, résines ou huiles est testé par un
                    laboratoire indépendant. Les certificats d'analyse (COA)
                    détaillant les taux de cannabinoïdes (CBD, CBG, THC...) sont
                    disponibles en libre consultation dans notre boutique.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-xl font-bold text-white">
                    Origine de nos produits
                  </h3>
                  <p className="text-zinc-400">
                    Nous privilégions les cultures européennes (France, Italie,
                    Suisse) respectueuses de l'environnement, sans pesticides ni
                    métaux lourds.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
