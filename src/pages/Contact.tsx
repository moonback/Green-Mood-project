import { motion } from "motion/react";
import { MapPin, Phone, Clock, Mail, MessageCircle } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import SEO from "../components/SEO";

export default function Contact() {
  const { settings } = useSettingsStore();

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": settings.store_name,
      "telephone": settings.store_phone,
      "email": "contact@greenmoon-cbd.fr",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": settings.store_address.split(',')[0],
        "addressLocality": settings.store_address.split(',')[1]?.trim() ?? "Paris",
        "postalCode": settings.store_address.match(/\d{5}/)?.[0] ?? "75000",
        "addressCountry": "FR"
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      <SEO
        title="Contactez notre CBD Shop à Paris - Green Moon Shop"
        description="Une question ? Besoin d'un conseil ? Contactez Green Moon CBD Shop ou venez nous rendre visite dans notre boutique à Paris. Horaires et accès."
        keywords="contact CBD Paris, horaires Green Moon, adresse CBD Paris, téléphone CBD shop"
        schema={contactSchema}
      />
      {/* Header */}
      <section className="py-24 text-center px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
        >
          Nous <span className="text-green-primary">Contacter</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-zinc-400 max-w-2xl mx-auto font-light"
        >
          Une question ? Besoin d'un conseil ? N'hésitez pas à nous joindre ou à
          passer en boutique.
        </motion.p>
      </section>

      {/* Main Content */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-white mb-8">
                  Coordonnées
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group cursor-default">
                    <div className="w-12 h-12 rounded-full bg-green-primary/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                      <MapPin className="h-6 w-6 text-green-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-primary transition-colors">Adresse</h3>
                      <p className="text-zinc-400">
                        {settings.store_address.split(',')[0]}
                        <br />
                        {settings.store_address.split(',').slice(1).join(',').trim()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group cursor-default">
                    <div className="w-12 h-12 rounded-full bg-green-primary/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                      <Phone className="h-6 w-6 text-green-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-primary transition-colors">Téléphone</h3>
                      <p className="text-zinc-400">{settings.store_phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group cursor-default">
                    <div className="w-12 h-12 rounded-full bg-green-primary/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                      <MessageCircle className="h-6 w-6 text-green-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-primary transition-colors">WhatsApp</h3>
                      <p className="text-zinc-400">06 12 34 56 78</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group cursor-default">
                    <div className="w-12 h-12 rounded-full bg-green-primary/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                      <Mail className="h-6 w-6 text-green-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-primary transition-colors">Email</h3>
                      <p className="text-zinc-400">contact@greenmoon-cbd.fr</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-serif font-bold text-white mb-8">
                  Horaires d'ouverture
                </h2>
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center text-zinc-300">
                      <span className="font-medium">Lundi - Samedi</span>
                      <span>{settings.store_hours.split(' ').slice(1).join(' ')}</span>
                    </li>
                    <li className="flex justify-between items-center text-zinc-500">
                      <span className="font-medium">Dimanche</span>
                      <span>Fermé</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Google Maps Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="h-full min-h-[400px] bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 relative"
            >
              {/* Replace with actual Google Maps iframe in production */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                <MapPin className="h-16 w-16 text-zinc-700 mb-4" />
                <p className="text-lg font-medium text-zinc-400 mb-2">
                  Carte Interactive
                </p>
                <p className="text-sm">
                  Intégration Google Maps à configurer avec l'adresse exacte de
                  la boutique.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
