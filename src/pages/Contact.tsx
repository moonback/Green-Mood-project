import { motion } from "motion/react";
import { MapPin, Phone, Clock, Mail, MessageCircle, Send, Sparkles, Globe, ShieldCheck } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import { Link } from "react-router-dom";
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
      "email": "contact@greenMood-cbd.fr",
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
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      <SEO
        title="Conciergerie & Contact — Green Mood Paris"
        description="Une question ? Besoin d'un conseil ? Contactez l'expertise Green Mood ou rendez-vous dans notre écrin parisien."
        keywords="contact CBD Paris, horaires Green Mood, adresse CBD Paris, téléphone CBD shop"
        schema={contactSchema}
      />

      {/* Hero Header */}
      <section className="relative pt-40 pb-24 px-4 overflow-hidden">
        {/* Background Layer with Lifestyle Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/lifestyle-relax.png"
            alt="Wellness & Care"
            className="w-full h-full object-cover opacity-20 filter grayscale blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/60 to-zinc-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950 opacity-40" />
        </div>

        {/* Decorative Gradients Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] bg-green-neon/5 rounded-full blur-[120px] z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-green-neon text-xs font-black uppercase tracking-[0.2em]"
          >
            <Sparkles className="w-4 h-4" />
            Service Client d'Elite
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tighter leading-none mb-8"
          >
            ENTRONS EN <br />
            <span className="text-green-neon italic glow-green">RÉSONANCE.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Que vous soyez néophyte ou connaisseur averti, notre équipe
            est à votre entière disposition pour un accompagnement sur-mesure.
          </motion.p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Contact Methods (Left) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="grid grid-cols-1 gap-4">
              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-neon/10 flex items-center justify-center group-hover:bg-green-neon/20 transition-colors">
                    <MapPin className="w-7 h-7 text-green-neon" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Notre Écrin</h3>
                    <p className="text-lg font-bold text-white leading-snug">
                      {settings.store_address.split(',')[0]}<br />
                      {settings.store_address.split(',').slice(1).join(',').trim()}
                    </p>
                    <button className="text-xs text-green-neon font-black uppercase tracking-widest pt-2 hover:underline">
                      Itinéraire Expert
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Communication Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col items-center text-center space-y-4"
                >
                  <Phone className="w-6 h-6 text-green-neon" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Appel Direct</h4>
                    <p className="font-bold text-white text-sm">{settings.store_phone}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col items-center text-center space-y-4"
                >
                  <MessageCircle className="w-6 h-6 text-green-neon" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">WhatsApp</h4>
                    <p className="font-bold text-white text-sm">06 12 34 56 78</p>
                  </div>
                </motion.div>
              </div>

              {/* Hours Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6"
              >
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5 text-green-neon" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Horaires d'Exception</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">Lundi — Samedi</span>
                    <span className="font-bold text-white">{settings.store_hours.split(' ').slice(1).join(' ')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm opacity-50">
                    <span className="text-zinc-500 font-medium">Dimanche</span>
                    <span className="font-bold">Privatisé / Fermé</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Contact Form (Right) */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 lg:p-16 space-y-10"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-serif font-black">Laissez un <br /><span className="text-green-neon italic">Message.</span></h2>
                <p className="text-zinc-500 text-sm font-light">Réponse sous 24h par un expert Green Mood.</p>
              </div>

              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Votre Identité</label>
                    <input
                      type="text"
                      placeholder="Nom complet"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-zinc-700 focus:outline-none focus:border-green-neon transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Courriel Personnel</label>
                    <input
                      type="email"
                      placeholder="votre@email.fr"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-zinc-700 focus:outline-none focus:border-green-neon transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Objet de la Demande</label>
                  <select className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-zinc-400 focus:outline-none focus:border-green-neon transition-all appearance-none cursor-pointer">
                    <option>Conseil Personnalisé</option>
                    <option>Question Commande</option>
                    <option>Demande Partenariat</option>
                    <option>Autre</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Votre Message</label>
                  <textarea
                    rows={5}
                    placeholder="Comment pouvons-nous vous aider ?"
                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-6 py-6 text-white placeholder-zinc-700 focus:outline-none focus:border-green-neon transition-all resize-none"
                  ></textarea>
                </div>

                <button className="w-full bg-white text-black font-black uppercase tracking-widest py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-green-neon transition-all group overflow-hidden relative">
                  <span className="relative z-10 flex items-center gap-2">
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Envoyer au Concierge
                  </span>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Decorative Brand Bar */}
      <section className="mt-32 border-y border-white/5 py-12 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-30 grayscale">
          <div className="flex items-center gap-3 font-serif font-black italic text-2xl">
            <Globe className="w-6 h-6" /> GREEN MOOD PARIS
          </div>
          <div className="flex items-center gap-3 font-serif font-black italic text-2xl">
            <Sparkles className="w-6 h-6" /> LUXURY CANNABINOIDS
          </div>
          <div className="flex items-center gap-3 font-serif font-black italic text-2xl">
            <ShieldCheck className="w-6 h-6" /> SUPREME QUALITY
          </div>
        </div>
      </section>
    </div>
  );
}
