import { useState, useEffect } from 'react';
import { Search, UserPlus, User, ArrowRight, RotateCcw, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../../lib/supabase';
import { Profile } from '../../../lib/types';

interface POSCustomerSelectionProps {
    onSelectCustomer: (customer: Profile) => void;
    onSkip: () => void;
}

export default function POSCustomerSelection({ onSelectCustomer, onSkip }: POSCustomerSelectionProps) {
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<Profile[]>([]);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

    // Create customer
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (customerSearch.length < 2) {
                setCustomerResults([]);
                return;
            }
            setIsSearchingCustomer(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .or(`full_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
                .limit(5);
            setCustomerResults((data as Profile[]) ?? []);
            setIsSearchingCustomer(false);
        }, 300);
        return () => clearTimeout(handler);
    }, [customerSearch]);

    const handleCreateCustomer = async () => {
        if (!newCustomerName.trim()) return;
        setIsCreatingCustomer(true);
        try {
            const { data: userId, error } = await supabase
                .rpc('create_pos_customer', {
                    p_full_name: newCustomerName.trim(),
                    p_phone: newCustomerPhone.trim() || null,
                });
            if (error || !userId) throw error ?? new Error('Création échouée');

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profile) {
                onSelectCustomer(profile as Profile);
            }
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la création du client.');
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 max-w-2xl mx-auto w-full pt-10">
            <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-[2rem] bg-zinc-800 mx-auto flex items-center justify-center mb-6 shadow-2xl">
                    <User className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">1. Compte Client</h2>
                <p className="text-zinc-500 font-medium mt-2">Identifiez le client ou passez pour une vente rapide</p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                {!showCreateCustomer ? (
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
                            <input
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                placeholder="Rechercher par nom ou numéro..."
                                className="w-full bg-black/40 border border-zinc-800 rounded-[2rem] pl-16 pr-6 py-6 text-lg text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50 focus:bg-black/60 transition-all shadow-inner"
                            />
                            {isSearchingCustomer && (
                                <RotateCcw className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-spin" />
                            )}
                        </div>

                        {customerResults.length > 0 && (
                            <div className="grid gap-3">
                                {customerResults.map((c) => (
                                    <motion.button
                                        key={c.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onSelectCustomer(c)}
                                        className="flex items-center justify-between p-4 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/50 hover:border-green-500/30 rounded-[1.5rem] transition-all group text-left"
                                    >
                                        <div>
                                            <p className="font-black text-white text-lg group-hover:text-green-400 transition-colors">{c.full_name}</p>
                                            <p className="text-zinc-500 text-sm">{c.phone || 'Pas de numéro'}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <p className="text-amber-500 font-black flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full text-xs">
                                                ★ {c.loyalty_points} pts
                                            </p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {customerSearch.trim().length >= 2 && !isSearchingCustomer && customerResults.length === 0 && (
                            <div className="text-center py-8 bg-black/20 rounded-[1.5rem] border border-dashed border-zinc-800">
                                <p className="text-zinc-500 mb-4 font-bold">Aucun client trouvé</p>
                                <button
                                    onClick={() => {
                                        setShowCreateCustomer(true);
                                        setNewCustomerName(customerSearch.trim());
                                    }}
                                    className="px-6 py-3 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black font-black rounded-xl transition-all inline-flex items-center gap-2"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Créer "{customerSearch.trim()}"
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <UserPlus className="w-6 h-6 text-green-400" />
                                Nouveau Client
                            </h3>
                            <button onClick={() => setShowCreateCustomer(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nom complet *</label>
                                <input
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    placeholder="Ex: Jean Dupont"
                                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Téléphone (Optionnel)</label>
                                <input
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    placeholder="Ex: 06 12 34 56 78"
                                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCreateCustomer}
                            disabled={!newCustomerName.trim() || isCreatingCustomer}
                            className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            {isCreatingCustomer ? <RotateCcw className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                            {isCreatingCustomer ? 'Création en cours...' : 'Créer et Sélectionner'}
                        </button>
                    </motion.div>
                )}
            </div>

            <div className="text-center pt-4">
                <button
                    onClick={onSkip}
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-white font-black tracking-widest uppercase text-sm group transition-all"
                >
                    Passer sans identifier de client
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
