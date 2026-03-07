import { useState, useEffect } from 'react';
import { User, Package, X, Star, Calendar, ChevronDown, ChevronUp, Tag, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';
import { Profile, Order } from '../../../lib/types';
import LoyaltyCard from '../../LoyaltyCard';

interface POSCustomerDetailModalProps {
    customer: Profile;
    onClose: () => void;
    isLightTheme?: boolean;
}

export default function POSCustomerDetailModal({ customer, onClose, isLightTheme }: POSCustomerDetailModalProps) {
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'card' | 'orders'>('card');

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoadingOrders(true);
            const { data } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('user_id', customer.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentOrders((data as Order[]) || []);
            setIsLoadingOrders(false);
        };

        fetchOrders();
    }, [customer.id]);

    const tabs = [
        { id: 'card' as const, label: 'Carte Fidélité', icon: QrCode },
        { id: 'orders' as const, label: 'Commandes', icon: Package },
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-4xl border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border border-zinc-800'}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b shrink-0 transition-all ${isLightTheme ? 'bg-emerald-50/50 border-emerald-100' : 'bg-zinc-900 border-zinc-800'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isLightTheme ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-800 text-green-400'}`}>
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>{customer.full_name}</h2>
                            <p className={`text-sm transition-colors ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>{customer.phone || 'Aucun numéro'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isLightTheme ? 'hover:bg-emerald-50 text-emerald-400' : 'hover:bg-zinc-800 text-zinc-500 hover:text-white'}`}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b px-6 pt-2 gap-1 shrink-0 transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border-zinc-800'}`}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all -mb-px ${activeTab === tab.id
                                    ? (isLightTheme ? 'border-emerald-600 text-emerald-700' : 'border-green-500 text-white')
                                    : (isLightTheme ? 'border-transparent text-emerald-400/50 hover:text-emerald-700' : 'border-transparent text-zinc-600 hover:text-zinc-300')
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === 'card' ? (
                            <motion.div
                                key="card"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="p-6 space-y-6"
                            >
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-all ${isLightTheme ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                            <Star className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-wider ${isLightTheme ? 'text-emerald-700/60' : 'text-amber-500/70'}`}>Points Fidélité</p>
                                            <p className={`text-2xl font-black ${isLightTheme ? 'text-emerald-950' : 'text-amber-500'}`}>{customer.loyalty_points}</p>
                                        </div>
                                    </div>
                                    <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-800/50 border border-zinc-700/50'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLightTheme ? 'bg-emerald-50 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-wider ${isLightTheme ? 'text-emerald-600/40' : 'text-zinc-500'}`}>Client depuis</p>
                                            <p className={`text-lg font-bold ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                                {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Loyalty Card with QR */}
                                <div className={`rounded-3xl p-6 transition-all ${isLightTheme ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-zinc-950/50 border border-zinc-800'}`}>
                                    <LoyaltyCard
                                        userId={customer.id}
                                        fullName={customer.full_name || 'Client'}
                                        points={customer.loyalty_points}
                                        referralCode={customer.referral_code}
                                        compact
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="orders"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="p-6"
                            >
                                {/* Recent Orders */}
                                <h3 className={`text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                    <Package className={`w-4 h-4 ${isLightTheme ? 'text-emerald-500' : 'text-green-400'}`} />
                                    Dernières Commandes
                                </h3>
                                {isLoadingOrders ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className={`h-16 animate-pulse rounded-xl ${isLightTheme ? 'bg-emerald-50' : 'bg-zinc-800/50'}`} />
                                        ))}
                                    </div>
                                ) : recentOrders.length === 0 ? (
                                    <div className={`text-center py-8 rounded-2xl border border-dashed transition-all ${isLightTheme ? 'border-emerald-200' : 'border-zinc-700'}`}>
                                        <p className={`text-sm font-bold ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`}>Aucune commande précédente</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {recentOrders.map((order) => (
                                            <div key={order.id} className={`rounded-xl overflow-hidden border transition-all ${isLightTheme ? 'bg-white border-emerald-100 shadow-sm' : 'bg-zinc-800/30 border-zinc-800'}`}>
                                                <button
                                                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                    className={`w-full flex items-center justify-between p-4 transition-colors text-left ${isLightTheme ? 'hover:bg-emerald-50/50' : 'hover:bg-zinc-800/50'}`}
                                                >
                                                    <div>
                                                        <p className={`text-sm font-bold flex items-center gap-2 ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                                            {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                                            <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${isLightTheme ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-700 text-zinc-400'}`}>
                                                                {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </p>
                                                        <p className={`text-xs mt-1 flex items-center gap-1 ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>
                                                            {order.order_items?.length || 0} article(s) • {order.delivery_type === 'in_store' ? 'Retrait/Sur place' : 'Livraison'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className={`font-black ${isLightTheme ? 'text-emerald-600' : 'text-green-400'}`}>
                                                                {order.total.toFixed(2)} €
                                                            </p>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${order.status === 'delivered'
                                                                    ? (isLightTheme ? 'bg-emerald-100 text-emerald-600' : 'bg-green-500/10 text-green-400')
                                                                    : (isLightTheme ? 'bg-emerald-50 text-emerald-400' : 'bg-zinc-700 text-zinc-400')
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        {expandedOrderId === order.id
                                                            ? <ChevronUp className={`w-4 h-4 ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                                            : <ChevronDown className={`w-4 h-4 ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                                        }
                                                    </div>
                                                </button>

                                                <AnimatePresence>
                                                    {expandedOrderId === order.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className={`border-t transition-colors ${isLightTheme ? 'border-emerald-100 bg-emerald-50/50' : 'border-zinc-800 bg-zinc-900/50'}`}
                                                        >
                                                            <div className="p-4 space-y-2">
                                                                {order.order_items?.map(item => (
                                                                    <div key={item.id} className={`flex items-center justify-between text-xs p-2 rounded-lg transition-colors ${isLightTheme ? 'bg-emerald-50/50 text-emerald-900' : 'bg-zinc-800/30 text-zinc-300'}`}>
                                                                        <div className="flex items-center gap-2">
                                                                            <Tag className={`w-3 h-3 ${isLightTheme ? 'text-emerald-500' : 'text-green-400'}`} />
                                                                            <span className={`font-bold ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>{item.quantity}x</span>
                                                                            <span className={isLightTheme ? 'text-emerald-900' : 'text-white'}>{item.product_name}</span>
                                                                        </div>
                                                                        <span className={`font-bold ${isLightTheme ? 'text-emerald-600' : 'text-green-400'}`}>{item.total_price.toFixed(2)} €</span>
                                                                    </div>
                                                                ))}
                                                                {order.notes && (
                                                                    <div className={`mt-2 text-[10px] italic p-2 rounded-lg border transition-colors ${isLightTheme ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-500'}`}>
                                                                        Note : {order.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
