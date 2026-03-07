import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Package,
  BarChart3,
  Users,
  Settings,
  RefreshCw,
  Award,
  MessageSquare,
  LineChart,
  Coins,
  TrendingUp,
  Leaf,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Home,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Category, Order, StockMovement, Profile } from '../lib/types';
import { useSettingsStore } from '../store/settingsStore';
import SEO from '../components/SEO';

// Tab Components
import AdminDashboardTab, { DashboardStats } from '../components/admin/AdminDashboardTab';
import AdminProductsTab from '../components/admin/AdminProductsTab';
import AdminCategoriesTab from '../components/admin/AdminCategoriesTab';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import AdminStockTab from '../components/admin/AdminStockTab';
import AdminCustomersTab from '../components/admin/AdminCustomersTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import AdminAnalyticsTab from '../components/admin/AdminAnalyticsTab';
import AdminReferralsTab from '../components/admin/AdminReferralsTab';
import AdminSubscriptionsTab from '../components/admin/AdminSubscriptionsTab';
import AdminReviewsTab from '../components/admin/AdminReviewsTab';
import AdminPromoCodesTab from '../components/admin/AdminPromoCodesTab';
import AdminRecommendationsTab from '../components/admin/AdminRecommendationsTab';
import AdminBudTenderTab from '../components/admin/AdminBudTenderTab';
import AdminPOSTab from '../components/admin/AdminPOSTab';

type Tab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'stock'
  | 'customers'
  | 'settings'
  | 'subscriptions'
  | 'reviews'
  | 'analytics'
  | 'promo_codes'
  | 'recommendations'
  | 'budtender'
  | 'referrals'
  | 'pos';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { fetchSettings, settings } = useSettingsStore();

  const loadDashboard = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const [
      { data: allOrders },
      { data: todayOrders },
      { data: pendingOrders },
      { data: lowStock },
      { data: outOfStock },
      { data: profileCount },
      { data: recentOrders },
      { data: monthOrders },
    ] = await Promise.all([
      supabase.from('orders').select('total').eq('payment_status', 'paid'),
      supabase.from('orders').select('id').gte('created_at', startOfToday),
      supabase.from('orders').select('id').in('status', ['pending', 'paid', 'processing']),
      supabase.from('products').select('id').gt('stock_quantity', 0).lte('stock_quantity', 5),
      supabase.from('products').select('id').eq('stock_quantity', 0),
      supabase.from('profiles').select('id'),
      supabase.from('orders').select('*, order_items(*), profile:profiles(*, addresses(*)), address:addresses(*)').order('created_at', { ascending: false }).limit(8),
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', startOfMonth),
    ]);
    setStats({
      totalRevenue: (allOrders ?? []).reduce((s, o) => s + Number(o.total), 0),
      revenueThisMonth: (monthOrders ?? []).reduce((s, o) => s + Number(o.total), 0),
      ordersTotal: allOrders?.length ?? 0,
      ordersToday: todayOrders?.length ?? 0,
      ordersPending: pendingOrders?.length ?? 0,
      productsLowStock: lowStock?.length ?? 0,
      productsOutOfStock: outOfStock?.length ?? 0,
      totalCustomers: profileCount?.length ?? 0,
      recentOrders: (recentOrders as Order[]) ?? [],
    });
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, embedding, category:categories(*)')
      .order('name');
    setProducts((data as Product[]) ?? []);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*, products(count)').order('sort_order');
    setCategories((data as Category[]) ?? []);
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), profile:profiles(*, addresses(*)), address:addresses(*)')
      .order('created_at', { ascending: false })
      .limit(200);
    setOrders((data as Order[]) ?? []);
  };

  const loadStock = async () => {
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from('products').select('id, name, stock_quantity, is_available').order('name'),
      supabase
        .from('stock_movements')
        .select('*, product:products(name)')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);
    setProducts((prods as Product[]) ?? []);
    setMovements((movs as StockMovement[]) ?? []);
  };

  const loadCustomers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setCustomers((data as Profile[]) ?? []);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    switch (tab) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'products':
        await Promise.all([loadProducts(), loadCategories()]);
        break;
      case 'categories':
        await loadCategories();
        break;
      case 'orders':
        await loadOrders();
        break;
      case 'stock':
        await loadStock();
        break;
      case 'customers':
        await loadCustomers();
        break;
    }
    setIsLoading(false);
  }, [tab]);

  useEffect(() => {
    loadData();
    fetchSettings();
  }, [loadData, fetchSettings]);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Produits', icon: ShoppingBag },
    { key: 'categories', label: 'Catégories', icon: Tag },
    { key: 'orders', label: 'Commandes', icon: Package },
    { key: 'stock', label: 'Stock', icon: BarChart3 },
    { key: 'customers', label: 'Clients', icon: Users },
    { key: 'referrals', label: 'Parrainages', icon: Award },
    { key: 'subscriptions', label: 'Abonnements', icon: RefreshCw },
    { key: 'reviews', label: 'Avis', icon: MessageSquare },
    { key: 'promo_codes', label: 'Codes Promo', icon: Coins },
    { key: 'recommendations', label: 'Recommandations', icon: TrendingUp },
    { key: 'budtender', label: 'BudTender IA', icon: Leaf },
    { key: 'analytics', label: 'Analytique', icon: LineChart },
    { key: 'pos', label: 'Caisse (POS)', icon: ShoppingCart },
    { key: 'settings', label: 'Paramètres', icon: Settings },
  ] as const;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex overflow-hidden">
      <SEO title="Administration | Green Mood" description="Panel d'administration pour gérer la boutique Green Mood." />

      {/* Sidebar Desktop */}
      {tab !== 'pos' && (
        <aside
          className={`hidden md:flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
            }`}
        >
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
              <span className="text-xl font-serif font-bold text-green-neon">Admin</span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${tab === t.key
                  ? 'bg-green-neon text-white shadow-lg shadow-green-neon/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
              >
                <t.icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="text-sm font-medium">{t.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-800 space-y-2">
            <a
              href="/"
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-green-neon hover:bg-green-neon/10 rounded-xl transition-all"
            >
              <Home className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-sm font-medium">Voir le site</span>}
              {isSidebarOpen && <ExternalLink className="w-3 h-3 ml-auto opacity-50" />}
            </a>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-all">
              <LogOut className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Top Nav */}
      {tab !== 'pos' && (
        <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between z-40">
          <span className="text-lg font-serif font-bold text-green-neon">Green Mood Admin</span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-400"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-zinc-900 z-50 md:hidden flex flex-col pt-20"
            >
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setTab(t.key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${tab === t.key
                      ? 'bg-green-neon text-white'
                      : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-zinc-800 space-y-2">
                <a
                  href="/"
                  className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-green-neon hover:bg-green-neon/10 rounded-xl transition-all"
                >
                  <Home className="w-5 h-5" />
                  <span className="text-sm font-medium">Voir le site</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`flex-1 bg-zinc-950 ${tab === 'pos' ? 'h-screen overflow-hidden' : 'overflow-y-auto pt-20 md:pt-0'}`}>
        <div className={tab === 'pos' ? 'h-full p-2' : 'max-w-[1600px] mx-auto p-6 md:p-10'}>
          {tab !== 'pos' && (
            <header className="mb-10">
              <h1 className="text-3xl font-serif font-extrabold text-white tracking-tight">
                {tabs.find((t) => t.key === tab)?.label}
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Gérez efficacement votre boutique Green Mood CBD.
              </p>
            </header>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={tab === 'pos' ? undefined : { opacity: 0, y: 10 }}
              animate={tab === 'pos' ? undefined : { opacity: 1, y: 0 }}
              exit={tab === 'pos' ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={tab === 'pos' ? 'h-full' : ''}
            >
              {tab === 'dashboard' && stats && (
                <AdminDashboardTab
                  stats={stats}
                  onViewOrders={() => setTab('orders')}
                  onViewStock={() => setTab('stock')}
                />
              )}
              {tab === 'products' && (
                <AdminProductsTab
                  products={products}
                  categories={categories}
                  onRefresh={loadProducts}
                />
              )}
              {tab === 'categories' && (
                <AdminCategoriesTab categories={categories} onRefresh={loadCategories} />
              )}
              {tab === 'orders' && (
                <AdminOrdersTab
                  orders={orders}
                  onRefresh={loadOrders}
                  storeName={settings.store_name}
                  storeAddress={settings.store_address}
                />
              )}
              {tab === 'stock' && (
                <AdminStockTab products={products} movements={movements} onRefresh={loadStock} />
              )}
              {tab === 'customers' && (
                <AdminCustomersTab customers={customers} onRefresh={loadCustomers} />
              )}
              {tab === 'referrals' && <AdminReferralsTab />}
              {tab === 'subscriptions' && <AdminSubscriptionsTab />}
              {tab === 'reviews' && <AdminReviewsTab />}
              {tab === 'analytics' && <AdminAnalyticsTab />}
              {tab === 'promo_codes' && <AdminPromoCodesTab />}
              {tab === 'recommendations' && <AdminRecommendationsTab />}
              {tab === 'budtender' && <AdminBudTenderTab />}
              {tab === 'pos' && <AdminPOSTab onExit={() => setTab('dashboard')} />}
              {tab === 'settings' && <AdminSettingsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
