import { useState, useEffect } from 'react';
import { User, MapPin, Package, X, Star, Calendar, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';
import { Profile, Order } from '../../../lib/types';

interface POSCustomerDetailModalProps {
    customer: Profile;
    onClose: () => void;
}

export default function POSCustomerDetailModal({ customer, onClose }: POSCustomerDetailModalProps) {
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-green-400">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">{customer.full_name}</h2>
                            <p className="text-sm text-zinc-500">{customer.phone || 'Aucun numéro'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <Star className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-500/70 uppercase tracking-wider">Points Fidélité</p>
                                <p className="text-2xl font-black text-amber-500">{customer.loyalty_points}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Client depuis</p>
                                <p className="text-lg font-bold text-white">
                                    {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-green-400" />
                            Dernières Commandes
                        </h3>
                        {isLoadingOrders ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 bg-zinc-800/50 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="text-center py-8 bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-700">
                                <p className="text-sm text-zinc-500 font-bold">Aucune commande précédente</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="bg-zinc-800/30 border border-zinc-800 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                                    <span className="text-[10px] text-zinc-500 font-normal">
                                                        {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                                    {order.order_items?.length || 0} article(s) • {order.delivery_type === 'in_store' ? 'Retrait/Sur place' : 'Livraison'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-black text-green-400">{order.total.toFixed(2)} €</p>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${order.status === 'delivered'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : 'bg-zinc-700 text-zinc-400'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                {expandedOrderId === order.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {expandedOrderId === order.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-zinc-800 bg-zinc-900/50"
                                                >
                                                    <div className="p-4 space-y-2">
                                                        {order.order_items?.map(item => (
                                                            <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-zinc-800/30 rounded-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <Tag className="w-3 h-3 text-zinc-500" />
                                                                    <span className="text-zinc-300 font-bold">{item.quantity}x</span>
                                                                    <span className="text-white">{item.product_name}</span>
                                                                </div>
                                                                <span className="text-zinc-400 font-bold">{item.total_price.toFixed(2)} €</span>
                                                            </div>
                                                        ))}
                                                        {order.notes && (
                                                            <div className="mt-2 text-[10px] text-zinc-500 italic p-2 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
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
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
