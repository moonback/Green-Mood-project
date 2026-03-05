import { AlertTriangle, Package, TrendingUp, Users } from 'lucide-react';
import type { Order } from '../../lib/types';

interface DashboardStats {
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

export default function AdminDashboardTab({
  stats,
  orderStatusOptions,
  onOpenOrders,
  onOpenStock,
}: {
  stats: DashboardStats;
  orderStatusOptions: { value: string; label: string; color: string }[];
  onOpenOrders: () => void;
  onOpenStock: () => void;
}) {
  return <div className="space-y-6">Dashboard: {stats.ordersTotal}
    <button onClick={onOpenOrders}>Voir commandes</button>
    {(stats.productsOutOfStock > 0 || stats.productsLowStock > 0) && <button onClick={onOpenStock}>Voir stock</button>}
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      {stats.recentOrders.map((order) => {
        const st = orderStatusOptions.find((s) => s.value === order.status);
        return (
          <div key={order.id} className="px-4 py-2 flex justify-between">
            <span className="text-xs">#{order.id.slice(0, 8)}</span>
            <span className={`text-xs px-2 rounded ${st?.color ?? ''}`}>{st?.label ?? order.status}</span>
          </div>
        );
      })}
    </div>
  </div>;
}
