import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Plus, Trash2, Star, ArrowLeft } from 'lucide-react';
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
    <>
      <SEO title="Mes Adresses — Green Mood CBD" description="Gérez vos adresses de livraison." />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/compte" className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-serif text-3xl font-bold">Mes adresses</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-primary hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-2xl p-6 border border-zinc-700 mb-4 space-y-3"
          >
            <h3 className="font-semibold text-white mb-2">Nouvelle adresse</h3>
            <input
              placeholder="Libellé (ex: Domicile, Bureau)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
            />
            <input
              placeholder="Adresse (numéro et rue)"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Code postal"
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                required
              />
              <input
                placeholder="Ville"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={isSaving}
                className="flex-1 bg-green-primary hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 animate-pulse h-20" />
            ))}
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-center py-12 text-zinc-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
            <p>Aucune adresse enregistrée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr, i) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-zinc-900 rounded-2xl p-5 border transition-colors ${addr.is_default ? 'border-green-primary/50' : 'border-zinc-800'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-neon flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{addr.label}</p>
                        {addr.is_default && (
                          <span className="flex items-center gap-1 text-xs text-green-neon bg-green-primary/10 px-2 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5" />
                            Par défaut
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-0.5">
                        {addr.street}
                        <br />
                        {addr.postal_code} {addr.city}, {addr.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs text-zinc-500 hover:text-green-neon transition-colors"
                      >
                        Par défaut
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
