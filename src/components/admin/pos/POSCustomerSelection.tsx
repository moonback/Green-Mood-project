import { useState, useEffect } from 'react';
import { Search, UserPlus, User, ArrowRight, RotateCcw, CheckCircle2, X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';
import { Profile } from '../../../lib/types';
import POSQRScanner from './POSQRScanner';

interface POSCustomerSelectionProps {
    onSelectCustomer: (customer: Profile) => void;
    onSkip: () => void;
    isLightTheme?: boolean;
}

export default function POSCustomerSelection({ onSelectCustomer, onSkip, isLightTheme }: POSCustomerSelectionProps) {
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<Profile[]>([]);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [isListView, setIsListView] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);

    // Create customer
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    const performSearch = async (query: string, full = false) => {
        setIsSearchingCustomer(true);
        try {
            let qStr = supabase.from('profiles').select('*');
            if (query.trim()) {
                qStr = qStr.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`);
            }
            const { data } = await qStr
                .order('full_name')
                .limit(full ? 50 : 5);
            setCustomerResults((data as Profile[]) ?? []);
            if (full) setIsListView(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearchingCustomer(false);
        }
    };

    useEffect(() => {
        if (isListView) return; // Don't auto-search in list mode to avoid flickering with manual typing vs enter
        const handler = setTimeout(() => {
            performSearch(customerSearch);
        }, 350);
        return () => clearTimeout(handler);
    }, [customerSearch, isListView]);

    const handleCreateCustomer = async () => {
        if (!newCustomerName.trim() || isCreatingCustomer) return;
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

    if (isListView) {
        return (
            <div className={`fixed inset-0 z-50 flex flex-col transition-all ${isLightTheme ? 'bg-emerald-50' : 'bg-[#0a0a0b]'}`}>
                {/* Header Section */}
                <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md ${isLightTheme ? 'bg-white/80 border-emerald-100' : 'bg-zinc-900/80 border-zinc-800'}`}>
                    <div className="flex items-center gap-6 flex-1 max-w-4xl mx-auto w-full">
                        <button
                            onClick={() => {
                                setIsListView(false);
                                performSearch(customerSearch);
                            }}
                            className={`p-3 rounded-2xl transition-all ${isLightTheme ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>

                        <div className="relative flex-1">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`} />
                            <input
                                autoFocus
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    performSearch(e.target.value, true);
                                }}
                                placeholder="Rechercher un client..."
                                className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-green-500/10 ${isLightTheme
                                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-950 placeholder-emerald-300'
                                    : 'bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600'
                                    }`}
                            />
                        </div>

                        <button
                            onClick={() => setShowCreateCustomer(true)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isLightTheme
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                                : 'bg-green-500 text-black hover:bg-green-400 shadow-lg shadow-green-500/20'
                                }`}
                        >
                            <UserPlus className="w-4 h-4" />
                            Nouveau
                        </button>
                    </div>

                    <button
                        onClick={onSkip}
                        className={`ml-6 p-3 rounded-2xl transition-all ${isLightTheme ? 'text-emerald-400 hover:text-emerald-600' : 'text-zinc-600 hover:text-white'}`}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Grid Section */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {customerResults.map((c) => (
                                <motion.button
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => onSelectCustomer(c)}
                                    className={`p-6 rounded-[2rem] border text-left flex flex-col justify-between group transition-all h-[140px] ${isLightTheme
                                        ? 'bg-white border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-200/40'
                                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLightTheme ? 'bg-emerald-50 text-emerald-500' : 'bg-zinc-800 text-zinc-500 group-hover:text-green-400'}`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${isLightTheme ? 'bg-emerald-50 text-emerald-600' : 'bg-green-500/10 text-green-500'}`}>
                                            ★ {c.loyalty_points}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className={`font-black tracking-tight truncate leading-tight ${isLightTheme ? 'text-emerald-950 text-base' : 'text-white text-base'}`}>
                                            {c.full_name}
                                        </p>
                                        <p className={`text-[10px] font-bold mt-0.5 tracking-wide ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>
                                            {c.phone || 'Sans téléphone'}
                                        </p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {customerResults.length === 0 && !isSearchingCustomer && (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                <Search className={`w-16 h-16 mb-4 ${isLightTheme ? 'text-emerald-200' : 'text-zinc-800'}`} />
                                <h3 className={`text-xl font-black uppercase tracking-widest ${isLightTheme ? 'text-emerald-900' : 'text-zinc-500'}`}>Aucun résultat</h3>
                                <p className="text-sm font-bold">Essayez une autre recherche ou créez un compte.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sync Overlay for Create Modal */}
                {showCreateCustomer && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-lg p-8 rounded-[3rem] border shadow-2xl ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border-zinc-800'}`}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className={`text-2xl font-black flex items-center gap-3 ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                    <UserPlus className="w-7 h-7 text-green-500" />
                                    Nouveau Client
                                </h3>
                                <button onClick={() => setShowCreateCustomer(false)} className={`p-3 rounded-2xl transition-all ${isLightTheme ? 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}>
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6 mb-8">
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Nom complet *</label>
                                    <input
                                        autoFocus
                                        value={newCustomerName}
                                        onChange={(e) => setNewCustomerName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCustomer()}
                                        placeholder="Ex: Jean Dupont"
                                        className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-green-500/10 ${isLightTheme ? 'bg-emerald-50 border-emerald-100 text-emerald-950 placeholder-emerald-300' : 'bg-black/40 border-zinc-800 text-white placeholder-zinc-700'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Téléphone</label>
                                    <input
                                        value={newCustomerPhone}
                                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCustomer()}
                                        placeholder="Ex: 06..."
                                        className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-green-500/10 ${isLightTheme ? 'bg-emerald-50 border-emerald-100 text-emerald-950 placeholder-emerald-300' : 'bg-black/40 border-zinc-800 text-white placeholder-zinc-700'}`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateCustomer}
                                disabled={!newCustomerName.trim() || isCreatingCustomer}
                                className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 ${isLightTheme
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200'
                                    : 'bg-green-500 text-black hover:bg-green-400 shadow-xl shadow-green-500/20'
                                    }`}
                            >
                                {isCreatingCustomer ? <RotateCcw className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                                Créer le compte
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`relative flex flex-col items-center justify-center h-full w-full rounded-3xl overflow-hidden border shadow-2xl transition-all ${isLightTheme ? 'border-emerald-100' : 'border-zinc-800'}`}>
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('/images/hero-bg-shop.png')` }}
            />
            {/* Dark/Light Overlay Layer */}
            <div className={`absolute inset-0 backdrop-blur-10 transition-colors ${isLightTheme ? 'bg-emerald-50/40' : 'bg-black/20'}`} />

            {/* Content Container */}
            <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full relative z-10 p-8">
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`w-24 h-24 rounded-[2rem] border mx-auto flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md transition-all ${isLightTheme ? 'bg-white/80 border-emerald-100' : 'bg-zinc-900/80 border-zinc-700/50'}`}
                    >
                        <User className="w-12 h-12 text-green-500" />
                    </motion.div>
                    <h2 className={`text-4xl font-black uppercase tracking-tight drop-shadow-lg transition-all ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Compte Client</h2>
                    <p className={`font-medium mt-3 text-lg drop-shadow transition-all ${isLightTheme ? 'text-emerald-800/60' : 'text-zinc-400'}`}>Identifiez le client ou passez pour une vente rapide</p>
                </div>

                <div className="  relative overflow-hidden">
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 transition-all ${isLightTheme ? 'text-emerald-400' : 'text-white'}`} />
                            <input
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        performSearch(customerSearch, true);
                                    }
                                }}
                                placeholder="Nom, email ou téléphone…"
                                className={`w-full border rounded-[2rem] pl-16 pr-20 py-5 text-xl font-bold transition-all focus:outline-none focus:ring-4 focus:ring-green-500/20 ${isLightTheme
                                    ? 'bg-white/90 border-emerald-100 text-emerald-950 placeholder-emerald-300'
                                    : 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500'
                                    }`}
                            />
                            <button
                                onClick={() => setShowQRScanner(true)}
                                title="Scanner une carte fidélité QR"
                                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isLightTheme ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white'}`}
                            >
                                <QrCode className="w-5 h-5" />
                            </button>
                        </div>

                        {customerResults.length > 0 && (
                            <div className="grid gap-3">
                                {customerResults.map((c) => (
                                    <motion.button
                                        key={c.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onSelectCustomer(c)}
                                        className={`flex items-center justify-between p-4 border rounded-[1.5rem] transition-all group text-left ${isLightTheme
                                            ? 'bg-white/80 hover:bg-white border-emerald-100 hover:border-green-500/30'
                                            : 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-700/50 hover:border-green-500/30'
                                            }`}
                                    >
                                        <div>
                                            <p className={`font-black text-lg group-hover:text-green-500 transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>{c.full_name}</p>
                                            <p className={`text-sm ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>{c.phone || 'Pas de numéro'}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <p className="text-amber-500 font-black flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full text-xs">
                                                ★ {c.loyalty_points} pts
                                            </p>
                                        </div>
                                    </motion.button>
                                ))}

                                <button
                                    onClick={() => performSearch(customerSearch, true)}
                                    className={`w-full py-4 rounded-[1.5rem] border border-dashed text-xs font-black uppercase tracking-widest transition-all ${isLightTheme ? 'border-emerald-200 text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800/50 hover:text-white'}`}
                                >
                                    Voir tous les résultats
                                </button>
                            </div>
                        )}

                        {customerSearch.trim().length >= 2 && !isSearchingCustomer && customerResults.length === 0 && (
                            <div className={`text-center py-8 rounded-[1.5rem] border border-dashed transition-all ${isLightTheme ? 'bg-white/50 border-emerald-200' : 'bg-black/20 border-zinc-800'}`}>
                                <p className={`mb-4 font-bold ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Aucun client trouvé</p>
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
                </div>

                <div className="text-center pt-4">
                    <button
                        onClick={onSkip}
                        className={`inline-flex items-center gap-2 font-black tracking-widest uppercase text-sm group transition-all ${isLightTheme ? 'text-emerald-400/60 hover:text-emerald-900' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Passer sans identifier de client
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Float Create Modal for initial view */}
            {showCreateCustomer && !isListView && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-lg p-8 rounded-[3rem] border shadow-2xl ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border-zinc-800'}`}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className={`text-2xl font-black flex items-center gap-3 ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                <UserPlus className="w-7 h-7 text-green-500" />
                                Nouveau Client
                            </h3>
                            <button onClick={() => setShowCreateCustomer(false)} className={`p-3 rounded-2xl transition-all ${isLightTheme ? 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Nom complet *</label>
                                <input
                                    autoFocus
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCustomer()}
                                    placeholder="Ex: Jean Dupont"
                                    className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-green-500/10 ${isLightTheme ? 'bg-emerald-50 border-emerald-100 text-emerald-950 placeholder-emerald-300' : 'bg-black/40 border-zinc-800 text-white placeholder-zinc-700'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Téléphone</label>
                                <input
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCustomer()}
                                    placeholder="Ex: 06..."
                                    className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-green-500/10 ${isLightTheme ? 'bg-emerald-50 border-emerald-100 text-emerald-950 placeholder-emerald-300' : 'bg-black/40 border-zinc-800 text-white placeholder-zinc-700'}`}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCreateCustomer}
                            disabled={!newCustomerName.trim() || isCreatingCustomer}
                            className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 ${isLightTheme
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200'
                                : 'bg-green-500 text-black hover:bg-green-400 shadow-xl shadow-green-500/20'
                                }`}
                        >
                            {isCreatingCustomer ? <RotateCcw className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                            Créer le compte
                        </button>
                    </motion.div>
                </div>
            )}

            {/* QR Scanner Modal */}
            <AnimatePresence>
                {showQRScanner && (
                    <POSQRScanner
                        onCustomerFound={(customer) => {
                            setShowQRScanner(false);
                            onSelectCustomer(customer);
                        }}
                        onClose={() => setShowQRScanner(false)}
                        isLightTheme={isLightTheme}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
