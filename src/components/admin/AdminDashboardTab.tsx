import { Package, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { motion } from 'motion/react';
import type { Order } from '../../lib/types';

export interface DashboardStats {
    totalRevenue: number;
    revenueThisMonth: number;
    ordersTotal: number;
    ordersToday: number;
    ordersPending: number;
    productsLowStock: number;
    productsOutOfStock: number;
    totalCustomers: number;
    recentOrders: Order[];
}

const ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: 'En attente', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800' },
    { value: 'paid', label: 'Payé', color: 'text-blue-400 bg-blue-900/30 border-blue-800' },
    { value: 'processing', label: 'En préparation', color: 'text-purple-400 bg-purple-900/30 border-purple-800' },
    { value: 'ready', label: 'Prêt à retirer', color: 'text-green-400 bg-green-900/30 border-green-800' },
    { value: 'shipped', label: 'En livraison', color: 'text-sky-400 bg-sky-900/30 border-sky-800' },
    { value: 'delivered', label: 'Livré', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-800' },
    { value: 'cancelled', label: 'Annulé', color: 'text-red-400 bg-red-900/30 border-red-800' },
];

interface AdminDashboardTabProps {
    stats: DashboardStats;
    onViewOrders: () => void;
    onViewStock: () => void;
}

export default function AdminDashboardTab({ stats, onViewOrders, onViewStock }: AdminDashboardTabProps) {
    return (
        <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Chiffre d\'affaires total',
                        value: `${stats.totalRevenue.toFixed(2)} €`,
                        sub: `${stats.revenueThisMonth.toFixed(2)} € ce mois`,
                        color: 'text-green-400',
                        accent: 'bg-green-400',
                        iconBg: 'bg-green-400/10 border-green-400/20',
                        icon: TrendingUp,
                    },
                    {
                        label: 'Commandes totales',
                        value: stats.ordersTotal,
                        sub: `${stats.ordersToday} aujourd'hui`,
                        color: 'text-blue-400',
                        accent: 'bg-blue-400',
                        iconBg: 'bg-blue-400/10 border-blue-400/20',
                        icon: Package,
                    },
                    {
                        label: 'En attente de traitement',
                        value: stats.ordersPending,
                        sub: 'à traiter en priorité',
                        color: stats.ordersPending > 0 ? 'text-orange-400' : 'text-zinc-400',
                        accent: stats.ordersPending > 0 ? 'bg-orange-400' : 'bg-zinc-700',
                        iconBg: stats.ordersPending > 0 ? 'bg-orange-400/10 border-orange-400/20' : 'bg-zinc-800 border-zinc-700',
                        icon: AlertTriangle,
                    },
                    {
                        label: 'Clients inscrits',
                        value: stats.totalCustomers,
                        sub: 'comptes créés',
                        color: 'text-purple-400',
                        accent: 'bg-purple-400',
                        iconBg: 'bg-purple-400/10 border-purple-400/20',
                        icon: Users,
                    },
                ].map(({ label, value, sub, color, accent, iconBg, icon: Icon }) => (
                    <div
                        key={label}
                        className="relative bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-colors overflow-hidden"
                    >
                        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${accent}`} />
                        <div className="pl-3">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider leading-tight pr-2">{label}</p>
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
                                    <Icon className={`w-4 h-4 ${color}`} />
                                </div>
                            </div>
                            <p className={`text-3xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-zinc-500 mt-1.5">{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stock alerts */}
            {(stats.productsOutOfStock > 0 || stats.productsLowStock > 0) && (
                <div className="flex flex-wrap gap-3">
                    {stats.productsOutOfStock > 0 && (
                        <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-xl text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>
                                <strong>{stats.productsOutOfStock}</strong> produit{stats.productsOutOfStock > 1 ? 's' : ''} en rupture de stock
                            </span>
                            <button onClick={onViewStock} className="underline hover:no-underline ml-1">
                                Voir →
                            </button>
                        </div>
                    )}
                    {stats.productsLowStock > 0 && (
                        <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-800 text-orange-400 px-4 py-3 rounded-xl text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>
                                <strong>{stats.productsLowStock}</strong> produit{stats.productsLowStock > 1 ? 's' : ''} avec stock faible (≤ 5)
                            </span>
                            <button onClick={onViewStock} className="underline hover:no-underline ml-1">
                                Voir →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Recent orders */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="font-serif font-semibold text-lg">Dernières commandes</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Les {stats.recentOrders.length} commandes les plus récentes</p>
                    </div>
                    <button
                        onClick={onViewOrders}
                        className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Voir tout
                    </button>
                </div>
                {stats.recentOrders.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-10">Aucune commande pour l'instant.</p>
                ) : (
                    <div className="divide-y divide-zinc-800/60">
                        {stats.recentOrders.map((order) => {
                            const st = ORDER_STATUS_OPTIONS.find((s) => s.value === order.status);
                            return (
                                <div key={order.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                            <Package className="w-3.5 h-3.5 text-zinc-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white font-mono">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-[10px] text-green-neon font-bold uppercase tracking-tight">
                                                {order.profile?.full_name ?? 'Client inconnu'}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                {' · '}
                                                {order.delivery_type === 'click_collect' ? 'Click & Collect' : 'Livraison'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-auto">
                                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st?.color ?? ''}`}>
                                            {st?.label ?? order.status}
                                        </span>
                                        <span className="font-bold text-white text-sm min-w-[60px] text-right">{order.total.toFixed(2)} €</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
