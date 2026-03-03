import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
import { MessageSquare, TrendingUp, ShoppingBag, Users } from 'lucide-react';

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
  const [aovData, setAovData] = useState<{ date: string; aov: number }[]>([]);
  const [categoryPerf, setCategoryPerf] = useState<{ name: string; value: number }[]>([]);
  const [budtenderStats, setBudtenderStats] = useState<{ type: string; count: number }[]>([]);
  const [topQuestions, setTopQuestions] = useState<{ question: string; count: number }[]>([]);
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    aov: 0,
    conversionRate: 0,
    totalOrders: 0
  });
  const [feedbackStats, setFeedbackStats] = useState({ positive: 0, negative: 0 });

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
      { data: interactions },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total, created_at, user_id')
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
      supabase
        .from('budtender_interactions')
        .select('*')
        .gte('created_at', sinceISO),
    ]);

    // Revenue & AOV by day
    const revenueByDay = new Map<string, number>();
    const ordersByDay = new Map<string, number>();
    let totalRev = 0;
    (paidOrders ?? []).forEach((o: any) => {
      const day = o.created_at.slice(0, 10);
      revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(o.total));
      ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1);
      totalRev += Number(o.total);
    });

    const revData: RevenueDataPoint[] = [];
    const aovs: { date: string; aov: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRev = revenueByDay.get(key) ?? 0;
      const dayOrders = ordersByDay.get(key) ?? 0;
      revData.push({ date: key, revenue: dayRev });
      aovs.push({ date: key, aov: dayOrders > 0 ? dayRev / dayOrders : 0 });
    }
    setRevenueData(revData);
    setAovData(aovs);

    // Top products & Category performance
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, total_price, order_id, product:products(category:categories(name))')
      .in(
        'order_id',
        (paidOrders ?? []).map((o: any) => o.id)
      );

    const productMap = new Map<string, TopProduct>();
    const catMap = new Map<string, number>();
    (orderItems ?? []).forEach(
      (item: any) => {
        const existing = productMap.get(item.product_id) ?? {
          product_id: item.product_id,
          product_name: item.product_name,
          total_quantity: 0,
          total_revenue: 0,
        };
        existing.total_quantity += item.quantity;
        existing.total_revenue += Number(item.total_price);
        productMap.set(item.product_id, existing);

        const catName = item.product?.category?.name || 'Inconnu';
        catMap.set(catName, (catMap.get(catName) ?? 0) + Number(item.total_price));
      }
    );
    setTopProducts(
      Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5)
    );
    setCategoryPerf(
      Array.from(catMap.entries()).map(([name, value]) => ({ name, value }))
    );

    // BudTender Stats
    const interactionCounts = new Map<string, number>();
    const questionsMap = new Map<string, number>();
    let quizCount = 0;
    let posFeed = 0;
    let negFeed = 0;

    interactions?.forEach(i => {
      interactionCounts.set(i.interaction_type, (interactionCounts.get(i.interaction_type) ?? 0) + 1);

      if (i.interaction_type === 'question' && i.quiz_answers?.question) {
        const q = (i.quiz_answers.question as string).trim();
        questionsMap.set(q, (questionsMap.get(q) ?? 0) + 1);
      }

      if (i.interaction_type === 'feedback') {
        if (i.feedback === 'positive') posFeed++;
        if (i.feedback === 'negative') negFeed++;
      }

      // Consider both chat_session started AND recommendation given as "intent"
      if (i.interaction_type === 'chat_session' || i.interaction_type === 'recommendation') quizCount++;
    });

    setFeedbackStats({ positive: posFeed, negative: negFeed });

    setBudtenderStats(
      Array.from(interactionCounts.entries()).map(([type, count]) => ({ type, count }))
    );
    setTopQuestions(
      Array.from(questionsMap.entries())
        .map(([question, count]) => ({ question, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    );

    // Conversion: Buyers who used BudTender
    const usersWithQuiz = new Set(interactions?.filter((i: any) => i.interaction_type === 'chat_session' || i.interaction_type === 'recommendation').map((i: any) => i.user_id));
    const usersWithOrder = new Set(paidOrders?.map((o: any) => o.user_id));
    const buyersWhoDidQuiz = Array.from(usersWithQuiz).filter(uid => usersWithOrder.has(uid)).length;

    const totalOrders = paidOrders?.length ?? 0;
    setKpis({
      totalRevenue: totalRev,
      totalOrders,
      aov: totalOrders > 0 ? totalRev / totalOrders : 0,
      conversionRate: quizCount > 0 ? (buyersWhoDidQuiz / quizCount) * 100 : 0
    });

    // Status distribution
    const statusMap = new Map<string, number>();
    (allOrders ?? []).forEach((o: any) => {
      statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
    });
    setStatusDist(
      Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))
    );

    // Acquisition
    const acqByDay = new Map<string, number>();
    (newProfiles ?? []).forEach((p: any) => {
      const day = p.created_at.slice(0, 10);
      acqByDay.set(day, (acqByDay.get(day) ?? 0) + 1);
    });
    const acqDataArr: CustomerAcquisitionPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      acqDataArr.push({ date: key, new_customers: acqByDay.get(key) ?? 0 });
    }
    setAcqData(acqDataArr);

    setIsLoading(false);
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

  return (
    <div className="space-y-8">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight italic uppercase">Tableau de Performance</h1>
          <p className="text-sm text-zinc-500 font-medium">Analyse des ventes & Insights BudTender IA.</p>
        </div>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 self-start">
          {(Object.keys(RANGE_LABELS) as AnalyticsRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${range === r
                ? 'bg-green-neon text-black shadow-lg shadow-green-neon/10'
                : 'text-zinc-500 hover:text-white'
                }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 animate-pulse h-32" />
          ))}
          <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 animate-pulse h-96" />
        </div>
      ) : (
        <>
          {/* KPI Mini-Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm group hover:border-green-neon/30 transition-all">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Revenus
              </p>
              <h3 className="text-2xl font-black text-white">{kpis.totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</h3>
              <p className="text-xs text-green-neon mt-1 font-bold">CA {range === '7d' ? 'hebdo' : range === '30d' ? 'mensuel' : 'trimestriel'}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm group hover:border-blue-500/30 transition-all">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
                <ShoppingBag className="w-3 h-3" /> Panier Moyen
              </p>
              <h3 className="text-2xl font-black text-white">{kpis.aov.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</h3>
              <p className="text-xs text-zinc-500 mt-1">Sur {kpis.totalOrders} commandes</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm group hover:border-purple-500/30 transition-all">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
                <Users className="w-3 h-3" /> Conversion Quiz
              </p>
              <h3 className="text-2xl font-black text-white">{kpis.conversionRate.toFixed(1)}%</h3>
              <p className="text-xs text-zinc-500 mt-1">Ventes après conseil IA</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm group hover:border-amber-500/30 transition-all">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Intéractions IA
              </p>
              <h3 className="text-2xl font-black text-white">{(budtenderStats.reduce((s, d) => s + d.count, 0)).toLocaleString()}</h3>
              <p className="text-xs text-purple-500 mt-1">Points de contact BudTender</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Revenue Chart */}
            <div className="lg:col-span-2">
              <ChartCard title="Progression des revenus">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      tickFormatter={formatDate}
                      interval={range === '7d' ? 0 : range === '30d' ? 4 : 10}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(v: number) => `${v}€`}
                      axisLine={false}
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
                      strokeWidth={3}
                      dot={{ r: 0 }}
                      activeDot={{ r: 6, fill: '#22c55e', stroke: '#000', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Category Performance */}
            <ChartCard title="Revenus par Catégorie">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryPerf}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                  >
                    {categoryPerf.map((_, index) => (
                      <Cell key={index} fill={PIE_FALLBACK_COLORS[index % PIE_FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} €`, 'CA']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                {categoryPerf.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_FALLBACK_COLORS[i % PIE_FALLBACK_COLORS.length] }} />
                    <span className="text-[10px] font-black uppercase text-zinc-500">{entry.name}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Questions - NEW */}
            <ChartCard title="Insight SEO/FAQ">
              <div className="space-y-4 h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                {topQuestions.length > 0 ? (
                  topQuestions.map((q, i) => (
                    <div key={i} className="bg-zinc-800/30 border border-zinc-700/50 p-4 rounded-xl flex items-start gap-3 group hover:border-green-neon/20 transition-all">
                      <div className="w-6 h-6 rounded-lg bg-green-neon/10 flex items-center justify-center text-green-neon text-xs font-black shrink-0">
                        {q.count}
                      </div>
                      <p className="text-xs text-white font-medium leading-relaxed italic">
                        "{q.question}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                    Aucune question enregistrée.
                  </div>
                )}
              </div>
            </ChartCard>

            {/* Satisfaction / Feedback - NEW */}
            <ChartCard title="Satisfaction Recommandations">
              <div className="h-[240px] flex flex-col justify-center gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/20 border border-zinc-800 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Positifs</p>
                    <p className="text-2xl font-black text-green-neon">{feedbackStats.positive}</p>
                  </div>
                  <div className="bg-zinc-800/20 border border-zinc-800 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Négatifs</p>
                    <p className="text-2xl font-black text-red-400">{feedbackStats.negative}</p>
                  </div>
                </div>
                <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
                  {feedbackStats.positive + feedbackStats.negative > 0 ? (
                    <div
                      className="absolute h-full bg-green-neon"
                      style={{ width: `${(feedbackStats.positive / (feedbackStats.positive + feedbackStats.negative)) * 100}%` }}
                    />
                  ) : (
                    <div className="absolute h-full w-full bg-zinc-700" />
                  )}
                </div>
                <p className="text-[10px] text-center text-zinc-500 uppercase font-bold tracking-tighter">
                  {feedbackStats.positive + feedbackStats.negative > 0
                    ? `${Math.round((feedbackStats.positive / (feedbackStats.positive + feedbackStats.negative)) * 100)}% de satisfaction sur les conseils`
                    : "En attente de feedbacks"}
                </p>
              </div>
            </ChartCard>

            {/* BudTender Types Distribution */}
            <ChartCard title="Intéractions BudTender">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={budtenderStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="type"
                    stroke="#71717a"
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    width={100}
                    axisLine={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {/* Top Products Table-like Bar Chart */}
            <ChartCard title="Top Produits">
              <div className="space-y-4">
                {topProducts.map((p) => (
                  <div key={p.product_id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white">{p.product_name}</span>
                      <span className="text-green-neon">{p.total_revenue.toLocaleString('fr-FR')}€</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(p.total_revenue / (topProducts[0]?.total_revenue || 1)) * 100}%` }}
                        className="h-full bg-green-neon/50"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{p.total_quantity} vendus</p>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Status Distribution compact */}
            <ChartCard title="Statuts des Commandes">
              <div className="flex items-center justify-between h-full min-h-[160px]">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={statusDist} dataKey="count" nameKey="status" innerRadius={40} outerRadius={60}>
                      {statusDist.map((entry, index) => (
                        <Cell key={index} fill={STATUS_COLORS[entry.status] || PIE_FALLBACK_COLORS[index % PIE_FALLBACK_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-[45%] space-y-2">
                  {statusDist.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.status] || PIE_FALLBACK_COLORS[i % PIE_FALLBACK_COLORS.length] }} />
                        <span className="text-zinc-400 font-bold uppercase">{STATUS_LABELS[s.status] || s.status}</span>
                      </div>
                      <span className="text-white font-black">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
