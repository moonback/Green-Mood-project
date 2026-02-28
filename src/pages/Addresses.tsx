import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Plus, Trash2, Star, ArrowLeft, Home, Building2, Compass } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Address } from '../lib/types';
import { useAuthStore } from '../store/authStore';
import SEO from '../components/SEO';

export default function Addresses() {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: 'Domicile', street: '', city: '', postal_code: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        setAddresses((data as Address[]) ?? []);
        setIsLoading(false);
      });
  }, [user]);

  const handleAdd = async () => {
    if (!user || !form.street || !form.city || !form.postal_code) return;
    setIsSaving(true);
    const { data } = await supabase
      .from('addresses')
      .insert({ ...form, user_id: user.id, country: 'France', is_default: addresses.length === 0 })
      .select()
      .single();
    if (data) {
      setAddresses((prev) => [...prev, data as Address]);
      setForm({ label: 'Domicile', street: '', city: '', postal_code: '' });
      setShowForm(false);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
      <SEO title="Mes Adresses — L'Excellence Green Mood" description="Gérez vos adresses de livraison." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-black uppercase tracking-widest transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au Hub
            </Link>
            <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight leading-none">
              MES <br /><span className="text-green-neon italic">DESTINATIONS.</span>
            </h1>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="group flex items-center gap-3 bg-white text-black font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-green-neon transition-all shadow-xl"
          >
            {showForm ? 'Masquer le Formulaire' : (
              <>
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                Nouvelle Destination
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Grid */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="overflow-hidden mb-12"
                >
                  <div className="bg-white/[0.02] backdrop-blur-3xl border border-green-neon/20 rounded-[3rem] p-10 space-y-8 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-neon/5 blur-[80px] -z-10" />
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">DÉFINIR COORDONNÉES</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest px-4">TYPE DE LIEU</label>
                        <input
                          placeholder="Domicile, Bureau..."
                          value={form.label}
                          onChange={(e) => setForm({ ...form, label: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest px-4">ADRESSE COMPLÈTE</label>
                        <input
                          placeholder="Numéro et rue"
                          value={form.street}
                          onChange={(e) => setForm({ ...form, street: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest px-4">CODE POSTAL</label>
                        <input
                          placeholder="Code postal"
                          value={form.postal_code}
                          onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest px-4">VILLE</label>
                        <input
                          placeholder="Ville"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleAdd}
                        disabled={isSaving}
                        className="flex-1 bg-white text-black font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-green-neon transition-all shadow-xl text-sm"
                      >
                        {isSaving ? 'ENREGISTREMENT…' : 'ENREGISTRER LA DESTINATION'}
                      </button>
                      <button
                        onClick={() => setShowForm(false)}
                        className="px-10 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                [1, 2].map((i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 animate-pulse h-48" />
                ))
              ) : addresses.length === 0 && !showForm ? (
                <div className="col-span-full py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] text-center space-y-6">
                  <Compass className="w-16 h-16 mx-auto text-zinc-800" />
                  <p className="text-zinc-500 font-serif italic text-xl">Aucune destination privilégiée n'est encore définie.</p>
                </div>
              ) : (
                addresses.map((addr, i) => (
                  <motion.div
                    key={addr.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`group relative bg-white/[0.02] backdrop-blur-3xl border rounded-[3rem] p-10 transition-all duration-500 h-full flex flex-col justify-between ${addr.is_default ? 'border-green-neon/30 shadow-[0_0_50px_rgba(0,255,163,0.05)]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${addr.is_default ? 'bg-green-neon text-black' : 'bg-white/5 text-zinc-500'}`}>
                          {addr.label.toLowerCase().includes('domicile') ? <Home className="w-6 h-6" /> : (addr.label.toLowerCase().includes('bureau') ? <Building2 className="w-6 h-6" /> : <MapPin className="w-6 h-6" />)}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(addr.id)}
                            className="p-3 rounded-xl bg-white/5 hover:bg-red-950/20 text-zinc-700 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-serif font-black text-white">{addr.label}</h4>
                          {addr.is_default && (
                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-green-neon bg-green-neon/5 px-2 py-1 rounded-full border border-green-neon/20">
                              <Star className="w-3 h-3" />
                              Favori
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed font-medium">
                          {addr.street}
                        </p>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mt-2">
                          {addr.postal_code} {addr.city}, {addr.country}
                        </p>
                      </div>
                    </div>

                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="mt-8 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-green-neon transition-all"
                      >
                        Définir par Défaut.
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Right Area: Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">CONSEIL LOGISTIQUE</h4>
              <p className="text-sm text-zinc-500 italic leading-relaxed font-serif">
                "Une adresse parfaitement renseignée assure une expérience de réception optimale et préserve l'intégrité de vos produits d'exception."
              </p>
            </div>

            <div className="bg-green-neon/5 border border-green-neon/10 rounded-[2.5rem] p-8 space-y-4">
              <div className="flex items-center gap-3 text-green-neon">
                <Building2 className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">SÉCURITÉ MAXIMALE</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-widest leading-relaxed">
                TOUTES VOS DONNÉES SONT CHIFFRÉES ET TRAITÉES AVEC LA PLUS GRANDE CONFIDENTIALITÉ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
