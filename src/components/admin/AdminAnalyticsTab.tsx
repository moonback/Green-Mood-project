import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import type {
  RevenueDataPoint,
  TopProduct,
  OrderStatusDistribution,
  CustomerAcquisitionPoint,
} from '../../lib/types';

type AnalyticsRange = '7d' | '30d' | '90d';

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  '7d': '7 jours',
  '30d': '30 jours',
  '90d': '90 jours',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#3b82f6',
  processing: '#a855f7',
  ready: '#22c55e',
  shipped: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const PIE_FALLBACK_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#06b6d4', '#10b981', '#ef4444'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payé',
  processing: 'En préparation',
  ready: 'Prêt',
  shipped: 'En livraison',
  delivered: 'Livré',
  cancelled: 'Annulé',
};

const tooltipStyle = {
  contentStyle: {
    background: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: 12,
    color: '#fff',
  },
  labelStyle: { color: '#a1a1aa' },
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
      <h2 className="font-serif font-semibold text-lg mb-6">{title}</h2>
      {children}
    </div>
  );
}

export default function AdminAnalyticsTab() {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statusDist, setStatusDist] = useState<OrderStatusDistribution[]>([]);
  const [acqData, setAcqData] = useState<CustomerAcquisitionPoint[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  async function loadAnalytics() {
    setIsLoading(true);
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const [
      { data: paidOrders },
      { data: allOrders },
      { data: newProfiles },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', sinceISO)
        .order('created_at'),
      supabase
        .from('orders')
        .select('status, created_at')
        .gte('created_at', sinceISO),
      supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', sinceISO),
    ]);

    // Revenue by day
    const revenueByDay = new Map<string, number>();
    (paidOrders ?? []).forEach((o: { created_at: string; total: number }) => {
      const day = o.created_at.slice(0, 10);
      revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(o.total));
    });
    const revData: RevenueDataPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      revData.push({ date: key, revenue: revenueByDay.get(key) ?? 0 });
    }
    setRevenueData(revData);

    // Top products from order_items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, total_price, order_id')
      .in(
        'order_id',
        (paidOrders ?? []).map((o: { id: string }) => o.id)
      );

    const productMap = new Map<string, TopProduct>();
    (orderItems ?? []).forEach(
      (item: { product_id: string; product_name: string; quantity: number; total_price: number }) => {
        const existing = productMap.get(item.product_id) ?? {
          product_id: item.product_id,
          product_name: item.product_name,
          total_quantity: 0,
          total_revenue: 0,
        };
        existing.total_quantity += item.quantity;
        existing.total_revenue += Number(item.total_price);
        productMap.set(item.product_id, existing);
      }
    );
    setTopProducts(
      Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10)
    );

    // Status distribution
    const statusMap = new Map<string, number>();
    (allOrders ?? []).forEach((o: { status: string }) => {
      statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
    });
    setStatusDist(
      Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))
    );

    // Customer acquisition by day
    const acqByDay = new Map<string, number>();
    (newProfiles ?? []).forEach((p: { created_at: string }) => {
      const day = p.created_at.slice(0, 10);
      acqByDay.set(day, (acqByDay.get(day) ?? 0) + 1);
    });
    const acq: CustomerAcquisitionPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      acq.push({ date: key, new_customers: acqByDay.get(key) ?? 0 });
    }
    setAcqData(acq);

    setIsLoading(false);
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex gap-2">
        {(Object.keys(RANGE_LABELS) as AnalyticsRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${range === r
                ? 'bg-green-neon text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <>
          {/* Revenue chart */}
          <ChartCard title="Chiffre d'affaires">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatDate}
                  interval={range === '7d' ? 0 : range === '30d' ? 4 : 10}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}€`}
                />
                <Tooltip
                  {...tooltipStyle}
                  labelFormatter={formatDate}
                  formatter={(v: number) => [`${v.toFixed(2)} €`, 'Revenus']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top products */}
          {topProducts.length > 0 && (
            <ChartCard title="Top produits (par revenus)">
              <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 36)}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#71717a"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}€`}
                  />
                  <YAxis
                    type="category"
                    dataKey="product_name"
                    stroke="#71717a"
                    tick={{ fontSize: 11 }}
                    width={160}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: number) => [`${v.toFixed(2)} €`, 'Revenus']}
                  />
                  <Bar dataKey="total_revenue" fill="#22c55e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Two-column: status + acquisition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status distribution */}
            <ChartCard title="Répartition des statuts">
              {statusDist.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-8">Aucune commande sur cette période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusDist}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                    >
                      {statusDist.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={STATUS_COLORS[entry.status] ?? PIE_FALLBACK_COLORS[index % PIE_FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v: number, name: string) => [v, STATUS_LABELS[name] ?? name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-2">
                {statusDist.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: STATUS_COLORS[entry.status] ?? PIE_FALLBACK_COLORS[i % PIE_FALLBACK_COLORS.length] }}
                    />
                    {STATUS_LABELS[entry.status] ?? entry.status} ({entry.count})
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Customer acquisition */}
            <ChartCard title="Nouveaux clients">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={acqData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatDate}
                    interval={range === '7d' ? 0 : range === '30d' ? 4 : 10}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    labelFormatter={formatDate}
                    formatter={(v: number) => [v, 'Nouveaux clients']}
                  />
                  <Line
                    type="monotone"
                    dataKey="new_customers"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#a855f7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
