import { motion } from "motion/react";
import SEO from "../components/SEO";

export default function Legal() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      <SEO
        title="Mentions Légales - Green Mood CBD Shop"
        description="Consultez les mentions légales, conditions générales d'utilisation et avertissements légaux de Green Mood CBD Shop."
        keywords="mentions légales CBD, CGU Green Mood"
      />
      {/* Header */}
      <section className="py-24 text-center px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-serif font-bold text-white mb-6"
        >
          Mentions <span className="text-green-neon">Légales</span>
        </motion.h1>
      </section>

      {/* Main Content */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-invert prose-zinc max-w-none space-y-12"
          >
            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                1. Éditeur du site
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                Le site Green Mood CBD Shop est édité par :<br />
                <strong>Raison sociale :</strong> Green Mood SAS
                <br />
                <strong>Siège social :</strong> 123 Rue de la Nature, 75000
                Paris
                <br />
                <strong>Numéro SIRET :</strong> 123 456 789 00012
                <br />
                <strong>Directeur de la publication :</strong> [Nom du
                Directeur]
                <br />
                <strong>Contact :</strong> contact@greenMood-cbd.fr
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                2. Hébergement
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                Le site est hébergé par :<br />
                <strong>Nom de l'hébergeur :</strong> OVH (ou Hostinger /
                o2switch)
                <br />
                <strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix,
                France
                <br />
                <strong>Téléphone :</strong> 1007
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                3. Avertissement Légal N10 & CBD
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                Les produits proposés sur ce site et en boutique, incluant nos
                gammes exclusives N10 et CBD, sont strictement conformes à la
                législation européenne et française en vigueur. Leur taux de
                Delta-9-THC est rigoureusement inférieur à 0.3%.
              </p>
              <p className="text-zinc-400 leading-relaxed mt-4">
                <strong>Ces produits ne sont pas des médicaments.</strong> Ils
                ne peuvent en aucun cas se substituer à un traitement médical.
                En cas de doute, consultez un professionnel de santé.
              </p>
              <p className="text-zinc-400 leading-relaxed mt-4">
                <strong>Interdit aux mineurs.</strong> La vente de produits à
                base de CBD est interdite aux personnes de moins de 18 ans.
                Déconseillé aux femmes enceintes ou allaitantes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                4. Propriété Intellectuelle
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                L'ensemble du contenu de ce site (textes, images, logos, etc.)
                est la propriété exclusive de Green Mood SAS, sauf mention
                contraire. Toute reproduction, distribution, modification,
                adaptation, retransmission ou publication de ces différents
                éléments est strictement interdite sans l'accord exprès par
                écrit de Green Mood SAS.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                5. Données Personnelles
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                Ce site vitrine ne collecte pas de données personnelles à des
                fins commerciales. Aucun cookie de traçage publicitaire n'est
                utilisé.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
