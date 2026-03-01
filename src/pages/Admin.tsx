import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import type { ElementType } from 'react';
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
  Plus,
  Edit3,
  Trash2,
  Leaf,
  MapPin,
  Phone,
  Clock,
  Save,
  X,
  ArrowUpDown,
  AlertTriangle,
  Star,
  Search,
  ChevronDown,
  ChevronUp,
  Coins,
  ShieldCheck,
  ShieldOff,
  Truck,
  Store,
  Eye,
  TrendingUp,
  Instagram,
  MessageSquare,
  LineChart,
  ArrowLeft,
  Award,
  ShoppingCart,
  Hash,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Category, Order, OrderItem, StockMovement, Profile } from '../lib/types';
import { useSettingsStore } from '../store/settingsStore';
import SEO from '../components/SEO';
import AdminAnalyticsTab from '../components/admin/AdminAnalyticsTab';
import AdminReferralsTab from '../components/admin/AdminReferralsTab';
import AdminSubscriptionsTab from '../components/admin/AdminSubscriptionsTab';
import AdminReviewsTab from '../components/admin/AdminReviewsTab';
import AdminPromoCodesTab from '../components/admin/AdminPromoCodesTab';
import AdminRecommendationsTab from '../components/admin/AdminRecommendationsTab';
import AdminBudTenderTab from '../components/admin/AdminBudTenderTab';
import AdminPOSTab from '../components/admin/AdminPOSTab';
import ProductImageUpload from '../components/admin/ProductImageUpload';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'products' | 'categories' | 'orders' | 'stock' | 'customers' | 'settings' | 'subscriptions' | 'reviews' | 'analytics' | 'promo_codes' | 'recommendations' | 'budtender' | 'referrals' | 'pos';

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

interface StoreSettings {
  delivery_fee: number;
  delivery_free_threshold: number;
  store_name: string;
  store_address: string;
  store_phone: string;
  store_hours: string;
  banner_text: string;
  banner_enabled: boolean;
  social_instagram: string;
  social_facebook: string;
  budtender_enabled: boolean;
  subscriptions_enabled: boolean;
  referral_reward_points: number;
  referral_welcome_bonus: number;
  referral_program_enabled: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: StoreSettings = {
  delivery_fee: 5.9,
  delivery_free_threshold: 50,
  store_name: 'Green Mood CBD',
  store_address: '123 Rue de la Nature, 75000 Paris',
  store_phone: '01 23 45 67 89',
  store_hours: 'Lun–Sam 10h00–19h30',
  banner_text: '🌿 Offre de bienvenue : -10% avec le code GREENMood !',
  banner_enabled: true,
  social_instagram: 'https://instagram.com/greenMood_cbd',
  social_facebook: 'https://facebook.com/greenMood_cbd',
  budtender_enabled: true,
  subscriptions_enabled: true,
  referral_reward_points: 500,
  referral_welcome_bonus: 0,
  referral_program_enabled: true,
};

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800' },
  { value: 'paid', label: 'Payé', color: 'text-blue-400 bg-blue-900/30 border-blue-800' },
  { value: 'processing', label: 'En préparation', color: 'text-purple-400 bg-purple-900/30 border-purple-800' },
  { value: 'ready', label: 'Prêt à retirer', color: 'text-green-400 bg-green-900/30 border-green-800' },
  { value: 'shipped', label: 'En livraison', color: 'text-sky-400 bg-sky-900/30 border-sky-800' },
  { value: 'delivered', label: 'Livré', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-800' },
  { value: 'cancelled', label: 'Annulé', color: 'text-red-400 bg-red-900/30 border-red-800' },
];

const EMPTY_PRODUCT = {
  category_id: '',
  slug: '',
  name: '',
  sku: null as string | null,
  description: null as string | null,
  cbd_percentage: null as number | null,
  thc_max: 0.2 as number | null,
  weight_grams: null as number | null,
  price: 0,
  original_value: null as number | null,
  image_url: null as string | null,
  stock_quantity: 0,
  is_available: true,
  is_featured: false,
  is_active: true,
  is_bundle: false,
  is_subscribable: false,
  attributes: {
    benefits: [] as string[],
    aromas: [] as string[],
  },
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT =
  'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors';
const LABEL = 'block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wider';

// ─── Component ───────────────────────────────────────────────────────────────

export default function Admin() {
  const [tab, setTab] = useState<Tab>('dashboard');

  // ── Data ──
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const { settings, fetchSettings: refreshGlobalSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<StoreSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // ── UI ──
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // ── Product modal ──
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  // Bundle items editor (list of {product_id, quantity})
  const [bundleItemsEditor, setBundleItemsEditor] = useState<{ product_id: string; quantity: number }[]>([]);

  // ── Category modal ──
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // ── Stock adjustment ──
  const [stockAdjust, setStockAdjust] = useState<{ id: string; qty: string; note: string } | null>(null);

  // ── Tabs ──
  const tabs: { key: Tab; label: string; icon: ElementType }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Produits', icon: ShoppingBag },
    { key: 'categories', label: 'Catégories', icon: Tag },
    { key: 'orders', label: 'Commandes', icon: Package },
    { key: 'stock', label: 'Stock', icon: BarChart3 },
    { key: 'customers', label: 'Clients', icon: Users },
    { key: 'referrals', label: 'Parrainages', icon: Award },
    { key: 'settings', label: 'Paramètres', icon: Settings },
    { key: 'subscriptions', label: 'Abonnements', icon: RefreshCw },
    { key: 'reviews', label: 'Avis', icon: MessageSquare },
    { key: 'analytics', label: 'Analytique', icon: LineChart },
    { key: 'promo_codes', label: 'Codes Promo', icon: Coins },
    { key: 'recommendations', label: 'Recommandations', icon: TrendingUp },
    { key: 'budtender', label: 'BudTender IA', icon: Leaf },
    { key: 'pos', label: 'Caisse (POS)', icon: ShoppingCart },
  ] as { key: Tab; label: string; icon: ElementType }[];

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setSearchQuery('');
    setStockAdjust(null);
    switch (tab) {
      case 'dashboard': await loadDashboard(); break;
      case 'products': await loadProducts(); break;
      case 'categories': await loadCategories(); break;
      case 'orders': await loadOrders(); break;
      case 'stock': await loadStock(); break;
      case 'customers': await loadCustomers(); break;
      case 'settings': await loadSettings(); break;
      case 'subscriptions': break; // handled by AdminSubscriptionsTab
      case 'reviews': break; // handled by AdminReviewsTab
      case 'analytics': break; // handled by AdminAnalyticsTab
      case 'promo_codes': break; // handled by AdminPromoCodesTab
      case 'recommendations': break; // handled by AdminRecommendationsTab
      case 'budtender': break; // handled by AdminBudTenderTab
    }
    setIsLoading(false);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  // Load categories in background when opening product modal
  useEffect(() => {
    if (tab === 'products' && categories.length === 0) {
      supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
        if (data) setCategories(data as Category[]);
      });
    }
  }, [tab, categories.length]);

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
    const { data } = await supabase.from('products').select('*, category:categories(*)').order('name');
    setProducts((data as Product[]) ?? []);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
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

  const loadSettings = async () => {
    await refreshGlobalSettings();
  };

  // ─── Product CRUD ─────────────────────────────────────────────────────────

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProductId(product.id);
      setProductForm({
        category_id: product.category_id,
        slug: product.slug,
        name: product.name,
        sku: product.sku ?? null,
        description: product.description,
        cbd_percentage: product.cbd_percentage,
        thc_max: product.thc_max,
        weight_grams: product.weight_grams,
        price: product.price,
        original_value: product.original_value ?? null,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
        is_available: product.is_available,
        is_featured: product.is_featured,
        is_active: product.is_active,
        is_bundle: product.is_bundle ?? false,
        is_subscribable: product.is_subscribable ?? false,
        attributes: {
          benefits: [],
          aromas: [],
          ...product.attributes,
        },
      });
      // Load existing bundle items
      if (product.is_bundle) {
        supabase
          .from('bundle_items')
          .select('product_id, quantity')
          .eq('bundle_id', product.id)
          .then(({ data }) => {
            setBundleItemsEditor((data ?? []) as { product_id: string; quantity: number }[]);
          });
      } else {
        setBundleItemsEditor([]);
      }
    } else {
      setEditingProductId(null);
      setProductForm({ ...EMPTY_PRODUCT, category_id: categories[0]?.id ?? '' });
      setBundleItemsEditor([]);
    }
    setShowProductModal(true);
  };

  const slugify = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { ...productForm, slug: productForm.slug || slugify(productForm.name) };
    let savedId = editingProductId;
    if (editingProductId) {
      await supabase.from('products').update(payload).eq('id', editingProductId);
    } else {
      const { data: newProd } = await supabase.from('products').insert(payload).select('id').single();
      if (newProd) savedId = newProd.id;
    }
    // Save bundle items if bundle
    if (productForm.is_bundle && savedId) {
      await supabase.from('bundle_items').delete().eq('bundle_id', savedId);
      if (bundleItemsEditor.length > 0) {
        await supabase.from('bundle_items').insert(
          bundleItemsEditor.filter((i) => i.product_id).map((i) => ({ bundle_id: savedId, ...i }))
        );
      }
      // Recalculate bundle stock
      await supabase.rpc('sync_bundle_stock', { p_bundle_id: savedId });
    }
    setShowProductModal(false);
    await loadProducts();
    setIsSaving(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Désactiver ce produit ? Il ne sera plus visible dans le catalogue.')) return;
    await supabase.from('products').update({ is_active: false }).eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };



  // ─── Category CRUD ────────────────────────────────────────────────────────

  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategoryId(cat.id);
      setCategoryForm({ ...cat });
    } else {
      setEditingCategoryId(null);
      setCategoryForm({ name: '', slug: '', description: '', is_active: true, sort_order: categories.length });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { ...categoryForm, slug: categoryForm.slug || slugify(categoryForm.name ?? '') };
    if (editingCategoryId) {
      await supabase.from('categories').update(payload).eq('id', editingCategoryId);
    } else {
      await supabase.from('categories').insert(payload);
    }
    setShowCategoryModal(false);
    await loadCategories();
    setIsSaving(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Désactiver cette catégorie ?')) return;
    await supabase.from('categories').update({ is_active: false }).eq('id', id);
    await loadCategories();
  };

  // ─── Stock ────────────────────────────────────────────────────────────────

  const handleStockAdjust = async () => {
    if (!stockAdjust) return;
    const qty = parseInt(stockAdjust.qty);
    if (isNaN(qty) || qty === 0) return;
    setIsSaving(true);
    const product = products.find((p) => p.id === stockAdjust.id);
    if (!product) { setIsSaving(false); return; }
    const newStock = Math.max(0, product.stock_quantity + qty);
    await supabase.from('products').update({ stock_quantity: newStock }).eq('id', stockAdjust.id);
    await supabase.from('stock_movements').insert({
      product_id: stockAdjust.id,
      quantity_change: qty,
      type: qty > 0 ? 'restock' : 'adjustment',
      note: stockAdjust.note || 'Ajustement manuel',
    });
    setProducts((prev) => prev.map((p) => (p.id === stockAdjust.id ? { ...p, stock_quantity: newStock } : p)));
    if (tab === 'stock') {
      const { data } = await supabase
        .from('stock_movements')
        .select('*, product:products(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      setMovements((data as StockMovement[]) ?? []);
    }
    setStockAdjust(null);
    setIsSaving(false);
  };

  // ─── Orders ───────────────────────────────────────────────────────────────

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as Order['status'] } : o)));
  };

  // ─── Customers ────────────────────────────────────────────────────────────

  const handleToggleAdmin = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', id);
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, is_admin: !current } : c)));
  };

  // ─── Settings ─────────────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = Object.entries(localSettings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('store_settings').upsert(payload, { onConflict: 'key' });

      if (error) throw error;

      await refreshGlobalSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Filtered lists ───────────────────────────────────────────────────────

  const filteredProducts = products.filter(
    (p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchSearch = !searchQuery || o.id.slice(0, 8).toUpperCase().includes(searchQuery.toUpperCase());
    return matchStatus && matchSearch;
  });

  const filteredCustomers = customers.filter(
    (c) => !searchQuery || (c.full_name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <SEO title="Administration — Green Mood CBD" description="Panel d'administration Green Mood CBD." />

      {/* ── Product Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProductModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
                <h2 className="font-serif text-xl font-bold">
                  {editingProductId ? 'Modifier le produit' : 'Nouveau produit'}
                </h2>
                <button onClick={() => setShowProductModal(false)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={LABEL}>Nom du produit *</label>
                    <input
                      required
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value, slug: slugify(e.target.value) })
                      }
                      className={INPUT}
                      placeholder="ex : Amnesia Haze"
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Slug (URL)</label>
                    <input
                      value={productForm.slug}
                      onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                      className={INPUT}
                      placeholder="amnesia-haze"
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Catégorie *</label>
                    <select
                      required
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                      className={INPUT}
                    >
                      <option value="">Choisir…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className={LABEL}>Code-barres / SKU</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        value={productForm.sku ?? ''}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value || null })}
                        className={`${INPUT} pl-10`}
                        placeholder="Scanner ou saisir un code (ex: 123456789)"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className={LABEL}>Description</label>
                    <textarea
                      rows={3}
                      value={productForm.description ?? ''}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value || null })}
                      className={INPUT}
                      placeholder="Description visible sur la fiche produit…"
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Prix (€) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Stock initial</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: parseInt(e.target.value) || 0 })}
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>CBD (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={productForm.cbd_percentage ?? ''}
                      onChange={(e) =>
                        setProductForm({ ...productForm, cbd_percentage: e.target.value ? parseFloat(e.target.value) : null })
                      }
                      className={INPUT}
                      placeholder="ex : 18.5"
                    />
                  </div>

                  <div>
                    <label className={LABEL}>THC max (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="0.3"
                      value={productForm.thc_max ?? ''}
                      onChange={(e) =>
                        setProductForm({ ...productForm, thc_max: e.target.value ? parseFloat(e.target.value) : null })
                      }
                      className={INPUT}
                      placeholder="0.20"
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Poids (g)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={productForm.weight_grams ?? ''}
                      onChange={(e) =>
                        setProductForm({ ...productForm, weight_grams: e.target.value ? parseFloat(e.target.value) : null })
                      }
                      className={INPUT}
                      placeholder="ex : 3"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className={LABEL}>Image du produit</label>
                    <ProductImageUpload
                      value={productForm.image_url}
                      onChange={(url) => setProductForm({ ...productForm, image_url: url })}
                    />
                  </div>

                  <div className="col-span-2 flex flex-wrap gap-5 pt-1">
                    {(
                      [
                        { key: 'is_available', label: 'Disponible à la vente' },
                        { key: 'is_featured', label: '⭐ Produit vedette' },
                        { key: 'is_active', label: 'Actif (visible dans le catalogue)' },
                        { key: 'is_bundle', label: '📦 Pack / Bundle' },
                        { key: 'is_subscribable', label: '🔄 Éligible à l\'abonnement' },
                      ] as { key: keyof typeof productForm; label: string }[]
                    ).map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(productForm[key])}
                          onChange={(e) => setProductForm({ ...productForm, [key]: e.target.checked })}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm text-zinc-300">{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Prix original (bundles) */}
                  {productForm.is_bundle && (
                    <div className="col-span-2">
                      <label className={LABEL}>Prix si achetés séparément (€) — valeur barrée</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.original_value ?? ''}
                        onChange={(e) => setProductForm({ ...productForm, original_value: e.target.value ? parseFloat(e.target.value) : null })}
                        className={INPUT}
                        placeholder="ex : 71.80"
                      />
                    </div>
                  )}

                  {/* Bundle items editor */}
                  {productForm.is_bundle && (
                    <div className="col-span-2">
                      <label className={LABEL}>Produits inclus dans le pack</label>
                      <div className="space-y-2">
                        {bundleItemsEditor.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={item.product_id}
                              onChange={(e) => {
                                const updated = [...bundleItemsEditor];
                                updated[idx] = { ...item, product_id: e.target.value };
                                setBundleItemsEditor(updated);
                              }}
                              className={INPUT + ' flex-1'}
                            >
                              <option value="">Choisir un produit…</option>
                              {products
                                .filter((p) => !p.is_bundle)
                                .map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const updated = [...bundleItemsEditor];
                                updated[idx] = { ...item, quantity: parseInt(e.target.value) || 1 };
                                setBundleItemsEditor(updated);
                              }}
                              className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-green-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setBundleItemsEditor(bundleItemsEditor.filter((_, i) => i !== idx))}
                              className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setBundleItemsEditor([...bundleItemsEditor, { product_id: '', quantity: 1 }])}
                          className="text-sm text-green-neon hover:text-green-400 font-medium flex items-center gap-1 transition-colors"
                        >
                          + Ajouter un produit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attributs (Bénéfices & Arômes) */}
                  <div className="col-span-2 border-t border-zinc-800 pt-5 mt-2">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-neon" />
                      Attributs & Filtres
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Bénéfices */}
                      <div className="space-y-3">
                        <label className={LABEL}>Bénéfices attendus (Multi-sélection)</label>
                        <div className="flex flex-wrap gap-2">
                          {['Détente Profonde', 'Focus & Énergie', 'Récupération Sportive', 'Sommeil Réparateur', 'Confort Digestif'].map((benefit) => {
                            const isSelected = (productForm.attributes?.benefits || []).includes(benefit);
                            return (
                              <button
                                key={benefit}
                                type="button"
                                onClick={() => {
                                  const current = productForm.attributes?.benefits || [];
                                  const next = isSelected ? current.filter(b => b !== benefit) : [...current, benefit];
                                  setProductForm({ ...productForm, attributes: { ...productForm.attributes, benefits: next } });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected
                                  ? 'bg-green-neon border-green-primary text-black font-bold'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                  }`}
                              >
                                {benefit}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Arômes */}
                      <div className="space-y-3">
                        <label className={LABEL}>Notes Aromatiques</label>
                        <div className="flex flex-wrap gap-2">
                          {['Fruité', 'Terreux', 'Épicé', 'Floral', 'Herbacé', 'Citronné', 'Boisé'].map((aroma) => {
                            const isSelected = (productForm.attributes?.aromas || []).includes(aroma);
                            return (
                              <button
                                key={aroma}
                                type="button"
                                onClick={() => {
                                  const current = productForm.attributes?.aromas || [];
                                  const next = isSelected ? current.filter(a => a !== aroma) : [...current, aroma];
                                  setProductForm({ ...productForm, attributes: { ...productForm.attributes, aromas: next } });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected
                                  ? 'bg-zinc-100 border-white text-black font-bold'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                  }`}
                              >
                                {aroma}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Enregistrement…' : editingProductId ? 'Mettre à jour' : 'Créer le produit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-6 text-zinc-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Category Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCategoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl z-50"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <h2 className="font-serif text-xl font-bold">
                  {editingCategoryId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </h2>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                <div>
                  <label className={LABEL}>Nom *</label>
                  <input
                    required
                    value={categoryForm.name ?? ''}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value, slug: slugify(e.target.value) })
                    }
                    className={INPUT}
                    placeholder="Fleurs CBD"
                  />
                </div>
                <div>
                  <label className={LABEL}>Slug</label>
                  <input
                    value={categoryForm.slug ?? ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className={INPUT}
                    placeholder="fleurs-cbd"
                  />
                </div>
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea
                    rows={2}
                    value={categoryForm.description ?? ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>URL Image</label>
                  <input
                    type="url"
                    value={categoryForm.image_url ?? ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value || null })}
                    className={INPUT}
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label className={LABEL}>Ordre d'affichage</label>
                  <input
                    type="number"
                    min="0"
                    value={categoryForm.sort_order ?? 0}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) })}
                    className={INPUT}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active ?? true}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm text-zinc-300">Catégorie active</span>
                </label>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    {isSaving ? 'Enregistrement…' : editingCategoryId ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-6 text-zinc-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Sidebar + Page Layout ─────────────────────────────────────────── */}
      <div className="flex min-h-screen">
        {/* Sidebar — desktop only */}
        {tab !== 'pos' && (
          <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-zinc-950 border-r border-zinc-800">
            {/* Brand */}
            <div className="px-4 py-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpeg"
                  alt="Green Mood"
                  className="h-10 w-auto object-contain"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(57,255,20,0.5))' }}
                />
                <div>
                  <p className="font-semibold text-sm text-white leading-tight">Green Mood</p>
                  <p className="text-[10px] text-green-neon/70 font-medium tracking-widest uppercase">Administration</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
              {[
                {
                  group: 'Aperçu',
                  items: [{ key: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard }],
                },
                {
                  group: 'Boutique',
                  items: [
                    { key: 'pos' as Tab, label: 'Caisse (POS)', icon: ShoppingBag },
                  ],
                },
                {
                  group: 'Catalogue',
                  items: [
                    { key: 'products' as Tab, label: 'Produits', icon: ShoppingBag },
                    { key: 'categories' as Tab, label: 'Catégories', icon: Tag },
                  ],
                },
                {
                  group: 'Commerce',
                  items: [
                    { key: 'orders' as Tab, label: 'Commandes', icon: Package },
                    { key: 'stock' as Tab, label: 'Stock', icon: BarChart3 },
                    { key: 'subscriptions' as Tab, label: 'Abonnements', icon: RefreshCw },
                    { key: 'promo_codes' as Tab, label: 'Codes Promo', icon: Tag },
                    { key: 'recommendations' as Tab, label: 'Cross-Selling', icon: Star },
                  ],
                },
                {
                  group: 'Clients',
                  items: [
                    { key: 'customers' as Tab, label: 'Clients', icon: Users },
                    { key: 'referrals' as Tab, label: 'Parrainages', icon: Award },
                    { key: 'reviews' as Tab, label: 'Avis', icon: MessageSquare },
                  ],
                },
                {
                  group: 'Analytique',
                  items: [{ key: 'analytics' as Tab, label: 'Analytique', icon: LineChart }],
                },
                {
                  group: 'Système',
                  items: [
                    { key: 'settings' as Tab, label: 'Paramètres', icon: Settings },
                    { key: 'budtender' as Tab, label: 'BudTender IA', icon: Leaf },
                  ],
                },
              ].map(({ group, items }) => (
                <div key={group}>
                  <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">
                    {group}
                  </p>
                  {items.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${tab === key
                        ? 'bg-green-neon/10 text-green-neon border border-green-neon/20 [text-shadow:0_0_8px_rgba(57,255,20,0.5)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                        }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                      {key === 'orders' && stats && stats.ordersPending > 0 && (
                        <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          {stats.ordersPending}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            {/* Sidebar footer */}
            <div className="px-3 py-4 border-t border-zinc-800 space-y-2">
              <Link
                to="/"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-green-neon hover:bg-green-neon/10 transition-all border border-green-neon/20"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au site
              </Link>
              <button
                onClick={loadData}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser les données
              </button>
            </div>
          </aside>
        )}

        {/* Main column */}
        <div className={`flex-1 flex flex-col min-w-0 ${tab === 'pos' ? 'h-screen' : 'min-h-screen'}`}>
          {/* Top header bar */}
          {tab !== 'pos' && (
            <div className="bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center gap-4 shrink-0">
              <div className="lg:hidden w-9 h-9 bg-green-neon/10 border border-green-neon/25 rounded-xl flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(57,255,20,0.2)' }}>
                <Store className="w-4 h-4 text-green-neon" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold hidden lg:block">
                  Administration
                </p>
                <h1 className="font-serif text-lg font-bold text-white leading-tight">
                  {tabs.find((t) => t.key === tab)?.label ?? 'Dashboard'}
                </h1>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-green-neon bg-zinc-900 border border-zinc-800 hover:border-green-neon/30 px-3 py-2 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Quitter l'admin</span>
                </Link>
                {stats && stats.ordersPending > 0 && (
                  <button
                    onClick={() => setTab('orders')}
                    className="hidden sm:flex items-center gap-2 bg-orange-900/30 border border-orange-800 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {stats.ordersPending} en attente
                  </button>
                )}
                <button
                  onClick={loadData}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-2 rounded-xl transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Actualiser</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile tab bar */}
          {tab !== 'pos' && (
            <div className="lg:hidden flex gap-1 px-3 py-2 bg-zinc-950 border-b border-zinc-800 overflow-x-auto shrink-0">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === key
                    ? 'bg-green-neon text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto bg-black/20">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-green-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ══════════════════════════════════ DASHBOARD ══════════════════ */}
                {tab === 'dashboard' && stats && (
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
                            <button onClick={() => setTab('stock')} className="underline hover:no-underline ml-1">
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
                            <button onClick={() => setTab('stock')} className="underline hover:no-underline ml-1">
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
                          onClick={() => setTab('orders')}
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
                )}

                {/* ══════════════════════════════════ PRODUCTS ═══════════════════ */}
                {tab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher un produit…"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                        />
                      </div>
                      <button
                        onClick={() => openProductModal()}
                        className="flex items-center gap-2 bg-green-neon hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Nouveau produit
                      </button>


                    </div>

                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-zinc-800/50">
                              <th className="px-4 py-3">Produit</th>
                              <th className="px-4 py-3">Catégorie</th>
                              <th className="px-4 py-3">Prix</th>
                              <th className="px-4 py-3">CBD</th>
                              <th className="px-4 py-3">Stock</th>
                              <th className="px-4 py-3">Statut</th>
                              <th className="px-4 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {filteredProducts.map((product) => (
                              <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={product.image_url ?? ''}
                                      alt={product.name}
                                      className="w-10 h-10 object-cover rounded-lg flex-shrink-0 bg-zinc-800"
                                    />
                                    <div>
                                      <p className="font-medium text-white text-sm">{product.name}</p>
                                      {product.is_featured && (
                                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                                          <Star className="w-3 h-3" />Vedette
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-zinc-400">
                                  {(product.category as Category | undefined)?.name ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-white">
                                  {product.price.toFixed(2)} €
                                </td>
                                <td className="px-4 py-3 text-sm text-zinc-300">
                                  {product.cbd_percentage != null ? `${product.cbd_percentage}%` : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`font-semibold text-sm ${product.stock_quantity === 0
                                      ? 'text-red-400'
                                      : product.stock_quantity <= 5
                                        ? 'text-orange-400'
                                        : 'text-white'
                                      }`}
                                  >
                                    {product.stock_quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1.5 flex-wrap">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full border ${product.is_active
                                        ? 'text-green-400 bg-green-900/30 border-green-800'
                                        : 'text-red-400 bg-red-900/30 border-red-800'
                                        }`}
                                    >
                                      {product.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                    {!product.is_available && (
                                      <span className="text-xs px-2 py-0.5 rounded-full border text-orange-400 bg-orange-900/30 border-orange-800">
                                        Indispo
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => openProductModal(product)}
                                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                                      title="Modifier"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setStockAdjust({ id: product.id, qty: '', note: '' })}
                                      className="p-1.5 text-zinc-400 hover:text-green-neon hover:bg-zinc-700 rounded-lg transition-colors"
                                      title="Ajuster le stock"
                                    >
                                      <ArrowUpDown className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                                      title="Désactiver"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {filteredProducts.length === 0 && (
                        <p className="text-zinc-500 text-center py-10">Aucun produit trouvé.</p>
                      )}
                    </div>

                    {/* Stock adjustment inline */}
                    <AnimatePresence>
                      {stockAdjust && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-zinc-900 border border-green-primary/40 rounded-2xl p-5"
                        >
                          <p className="text-sm font-medium text-white mb-3">
                            Ajustement —{' '}
                            <span className="text-green-neon">
                              {products.find((p) => p.id === stockAdjust.id)?.name}
                            </span>
                            <span className="ml-2 text-zinc-500 text-xs">
                              (stock actuel :{' '}
                              {products.find((p) => p.id === stockAdjust.id)?.stock_quantity})
                            </span>
                          </p>
                          <div className="flex gap-3 flex-wrap">
                            <input
                              type="number"
                              placeholder="+10 ou -5"
                              value={stockAdjust.qty}
                              onChange={(e) => setStockAdjust({ ...stockAdjust, qty: e.target.value })}
                              className="w-36 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-primary"
                            />
                            <input
                              type="text"
                              placeholder="Note (ex : réappro, retour, casse…)"
                              value={stockAdjust.note}
                              onChange={(e) => setStockAdjust({ ...stockAdjust, note: e.target.value })}
                              className="flex-1 min-w-40 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-primary"
                            />
                            <button
                              onClick={handleStockAdjust}
                              disabled={isSaving}
                              className="bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setStockAdjust(null)}
                              className="text-zinc-400 hover:text-white px-3 text-sm transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ══════════════════════════════════ CATEGORIES ═════════════════ */}
                {tab === 'categories' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => openCategoryModal()}
                        className="flex items-center gap-2 bg-green-neon hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Nouvelle catégorie
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map((cat) => (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
                        >
                          {cat.image_url && (
                            <div className="relative h-36 overflow-hidden">
                              <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-white">{cat.name}</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  /{cat.slug} · ordre {cat.sort_order}
                                </p>
                              </div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${cat.is_active
                                  ? 'text-green-400 bg-green-900/30 border-green-800'
                                  : 'text-red-400 bg-red-900/30 border-red-800'
                                  }`}
                              >
                                {cat.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {cat.description && (
                              <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{cat.description}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => openCategoryModal(cat)}
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {categories.length === 0 && (
                      <p className="text-zinc-500 text-center py-10">Aucune catégorie.</p>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════ ORDERS ═════════════════════ */}
                {tab === 'orders' && (
                  <div className="space-y-4">
                    <div className="flex gap-3 flex-wrap">
                      <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher par n° de commande…"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                        />
                      </div>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-primary"
                      >
                        <option value="all">Tous les statuts</option>
                        {ORDER_STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <span className="flex items-center text-sm text-zinc-500 px-2">
                        {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {filteredOrders.length === 0 && (
                        <p className="text-zinc-500 text-center py-10">Aucune commande.</p>
                      )}
                      {filteredOrders.map((order) => {
                        const st = ORDER_STATUS_OPTIONS.find((s) => s.value === order.status);
                        const isExpanded = expandedOrder === order.id;
                        const items = order.order_items as OrderItem[] | undefined;
                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/40 transition-colors text-left"
                            >
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="font-semibold text-white text-sm">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                  </p>
                                  <p className="text-sm font-medium text-green-neon mt-0.5">
                                    {order.profile?.full_name ?? 'Client ID: ' + (order.user_id?.slice(0, 8) ?? 'Inconnu')}
                                  </p>
                                  <p className="text-xs text-zinc-500 mt-0.5">
                                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border hidden sm:inline-flex ${order.delivery_type === 'click_collect'
                                    ? 'text-purple-400 bg-purple-900/20 border-purple-800'
                                    : order.delivery_type === 'in_store'
                                      ? 'text-orange-400 bg-orange-900/20 border-orange-800'
                                      : 'text-sky-400 bg-sky-900/20 border-sky-800'
                                    }`}
                                >
                                  {order.delivery_type === 'click_collect' ? (
                                    <span className="flex items-center gap-1"><Store className="w-3 h-3" />Click & Collect</span>
                                  ) : order.delivery_type === 'in_store' ? (
                                    <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />Vente Boutique</span>
                                  ) : (
                                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" />Livraison</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${st?.color ?? ''}`}>
                                  {st?.label ?? order.status}
                                </span>
                                <span className="font-bold text-white">{order.total.toFixed(2)} €</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-zinc-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                                )}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="border-t border-zinc-800 p-5 space-y-6">
                                {/* Informations Client */}
                                <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50">
                                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Users className="w-3 h-3 text-green-neon" />
                                    Informations Client
                                  </h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-[10px] text-zinc-500 uppercase">Nom Complet</p>
                                      <p className="text-sm font-semibold text-white">{order.profile?.full_name ?? 'Non renseigné'}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-zinc-500 uppercase">Téléphone / Contact</p>
                                      <p className="text-sm font-semibold text-white">{order.profile?.phone ?? 'Aucun numéro'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Adresse de Livraison */}
                                <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50">
                                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-green-neon" />
                                    {order.delivery_type === 'click_collect' ? 'Point de retrait' : 'Adresse de Livraison'}
                                  </h3>
                                  {(() => {
                                    const addr = order.address || (order.profile as any)?.addresses?.[0];

                                    if (order.delivery_type === 'in_store') {
                                      return (
                                        <div className="flex items-start gap-3">
                                          <ShoppingBag className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-semibold text-white">Vente Boutique — Direct</p>
                                            <p className="text-xs text-zinc-400">{localSettings.store_name} — {localSettings.store_address}</p>
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (order.delivery_type === 'click_collect') {
                                      return (
                                        <div className="flex items-start gap-3">
                                          <Store className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-semibold text-white">Click & Collect — Boutique Green Moon</p>
                                            <p className="text-xs text-zinc-400">{localSettings.store_address || '123 Rue de la Nature, 75000 Paris'}</p>
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (addr) {
                                      return (
                                        <div className="grid grid-cols-1 gap-1">
                                          <p className="text-sm font-semibold text-white">{addr.street}</p>
                                          <p className="text-sm text-zinc-300">
                                            {addr.postal_code} {addr.city}
                                          </p>
                                          <p className="text-xs text-zinc-500 uppercase tracking-tight">{addr.country || 'France'}</p>
                                          {!order.address && (
                                            <p className="text-[10px] text-orange-400 font-medium mt-1 italic">
                                              Affichage de l'adresse par défaut du profil utilisateur.
                                            </p>
                                          )}
                                        </div>
                                      );
                                    }

                                    return <p className="text-sm text-zinc-500 italic">Aucune adresse renseignée</p>;
                                  })()}
                                </div>

                                {/* Order lines */}
                                <div className="space-y-1.5">
                                  {(items ?? []).map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                      <span className="text-zinc-400">
                                        {item.product_name} ×{item.quantity}
                                      </span>
                                      <span className="text-white">{item.total_price.toFixed(2)} €</span>
                                    </div>
                                  ))}
                                  <div className="border-t border-zinc-700 pt-2 space-y-1">
                                    <div className="flex justify-between text-xs text-zinc-500">
                                      <span>Livraison</span>
                                      <span>{order.delivery_fee === 0 ? 'Gratuit' : `${order.delivery_fee.toFixed(2)} €`}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-white">
                                      <span>Total</span>
                                      <span>{order.total.toFixed(2)} €</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Status & metadata */}
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-zinc-400">Statut :</label>
                                    <select
                                      value={order.status}
                                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                      className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-green-primary"
                                    >
                                      {ORDER_STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-4 text-xs text-zinc-500 flex-wrap">
                                    <span>
                                      Paiement :{' '}
                                      <span className={order.payment_status === 'paid' ? 'text-green-400' : 'text-orange-400'}>
                                        {order.payment_status}
                                      </span>
                                    </span>
                                    {order.viva_order_code && <span>Réf : {order.viva_order_code}</span>}
                                    {order.loyalty_points_earned > 0 && (
                                      <span className="text-yellow-400">+{order.loyalty_points_earned} pts fidélité</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════ STOCK ══════════════════════ */}
                {tab === 'stock' && (
                  <div className="space-y-6">
                    {/* Alerts */}
                    {products.some((p) => p.stock_quantity <= 5) && (
                      <div className="bg-orange-900/10 border border-orange-800 rounded-2xl p-5">
                        <p className="text-orange-400 font-medium text-sm flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4" />
                          Produits à réapprovisionner en priorité
                        </p>
                        <div className="space-y-2">
                          {products
                            .filter((p) => p.stock_quantity <= 5)
                            .sort((a, b) => a.stock_quantity - b.stock_quantity)
                            .map((p) => (
                              <div key={p.id} className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">{p.name}</span>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`font-bold text-sm ${p.stock_quantity === 0 ? 'text-red-400' : 'text-orange-400'}`}
                                  >
                                    {p.stock_quantity === 0 ? 'Rupture' : `${p.stock_quantity} restant${p.stock_quantity > 1 ? 's' : ''}`}
                                  </span>
                                  <button
                                    onClick={() => setStockAdjust({ id: p.id, qty: '', note: 'Réapprovisionnement' })}
                                    className="text-xs bg-orange-900/40 hover:bg-orange-900/70 border border-orange-800 text-orange-400 px-3 py-1 rounded-lg transition-colors"
                                  >
                                    + Réappro
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Stock adjustment form */}
                    <AnimatePresence>
                      {stockAdjust && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-zinc-900 border border-green-primary/50 rounded-2xl p-5"
                        >
                          <p className="text-sm font-medium text-white mb-3">
                            Ajustement —{' '}
                            <span className="text-green-neon">
                              {products.find((p) => p.id === stockAdjust.id)?.name}
                            </span>
                            <span className="ml-2 text-zinc-500 text-xs">
                              (stock actuel : {products.find((p) => p.id === stockAdjust.id)?.stock_quantity})
                            </span>
                          </p>
                          <div className="flex gap-3 flex-wrap">
                            <input
                              type="number"
                              placeholder="+20 réappro ou -2 casse"
                              value={stockAdjust.qty}
                              onChange={(e) => setStockAdjust({ ...stockAdjust, qty: e.target.value })}
                              className="w-44 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-primary"
                            />
                            <input
                              type="text"
                              placeholder="Raison (réappro, retour client, casse…)"
                              value={stockAdjust.note}
                              onChange={(e) => setStockAdjust({ ...stockAdjust, note: e.target.value })}
                              className="flex-1 min-w-40 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-primary"
                            />
                            <button
                              onClick={handleStockAdjust}
                              disabled={isSaving}
                              className="bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                              {isSaving ? 'Confirmation…' : 'Confirmer'}
                            </button>
                            <button
                              onClick={() => setStockAdjust(null)}
                              className="text-zinc-400 hover:text-white px-3 text-sm transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* All products stock levels */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-800">
                        <h2 className="font-serif font-semibold">Niveaux de stock</h2>
                      </div>
                      <div className="divide-y divide-zinc-800">
                        {products.map((product) => {
                          const pct = Math.min(100, (product.stock_quantity / 50) * 100);
                          return (
                            <div key={product.id} className="px-5 py-3.5 flex items-center gap-4">
                              <div
                                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${product.stock_quantity === 0
                                  ? 'bg-red-400'
                                  : product.stock_quantity <= 5
                                    ? 'bg-orange-400'
                                    : 'bg-green-400'
                                  }`}
                              />
                              <span className="text-sm text-white flex-1">{product.name}</span>
                              <div className="hidden sm:flex items-center gap-2 w-32">
                                <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${product.stock_quantity === 0
                                      ? 'bg-red-500'
                                      : product.stock_quantity <= 5
                                        ? 'bg-orange-500'
                                        : 'bg-green-500'
                                      }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                              <span
                                className={`font-semibold text-sm w-16 text-right ${product.stock_quantity === 0
                                  ? 'text-red-400'
                                  : product.stock_quantity <= 5
                                    ? 'text-orange-400'
                                    : 'text-white'
                                  }`}
                              >
                                {product.stock_quantity}
                              </span>
                              <button
                                onClick={() => setStockAdjust({ id: product.id, qty: '', note: '' })}
                                className="p-1.5 text-zinc-500 hover:text-green-neon hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <ArrowUpDown className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Movements history */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-800">
                        <h2 className="font-serif font-semibold">Historique des mouvements</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-zinc-800/40">
                              <th className="px-5 py-3">Date & heure</th>
                              <th className="px-5 py-3">Produit</th>
                              <th className="px-5 py-3">Variation</th>
                              <th className="px-5 py-3">Type</th>
                              <th className="px-5 py-3">Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {movements.map((mv) => (
                              <tr key={mv.id} className="hover:bg-zinc-800/20 transition-colors">
                                <td className="px-5 py-3 text-xs text-zinc-500">
                                  {new Date(mv.created_at).toLocaleDateString('fr-FR')}{' '}
                                  {new Date(mv.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="px-5 py-3 text-sm text-white">
                                  {(mv.product as { name?: string })?.name ?? '—'}
                                </td>
                                <td
                                  className={`px-5 py-3 font-bold ${mv.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}`}
                                >
                                  {mv.quantity_change > 0 ? '+' : ''}
                                  {mv.quantity_change}
                                </td>
                                <td className="px-5 py-3">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full border ${mv.type === 'sale'
                                      ? 'text-blue-400 bg-blue-900/20 border-blue-800'
                                      : mv.type === 'restock'
                                        ? 'text-green-400 bg-green-900/20 border-green-800'
                                        : mv.type === 'return'
                                          ? 'text-purple-400 bg-purple-900/20 border-purple-800'
                                          : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                                      }`}
                                  >
                                    {mv.type}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-xs text-zinc-500">{mv.note ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {movements.length === 0 && (
                          <p className="text-zinc-500 text-center py-10">Aucun mouvement de stock.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════ CUSTOMERS ══════════════════ */}
                {tab === 'customers' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher un client…"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                        />
                      </div>
                      <span className="text-sm text-zinc-500">
                        {filteredCustomers.length} client{filteredCustomers.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-zinc-800/50">
                              <th className="px-5 py-3">Client</th>
                              <th className="px-5 py-3">Téléphone</th>
                              <th className="px-5 py-3">Inscrit le</th>
                              <th className="px-5 py-3">Points fidélité</th>
                              <th className="px-5 py-3">Rôle</th>
                              <th className="px-5 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {filteredCustomers.map((customer) => (
                              <tr key={customer.id} className="hover:bg-zinc-800/20 transition-colors">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-green-neon/20 flex items-center justify-center text-green-neon font-bold text-sm flex-shrink-0">
                                      {(customer.full_name ?? 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium text-white text-sm">
                                        {customer.full_name ?? 'Utilisateur'}
                                      </p>
                                      <p className="text-xs text-zinc-600 font-mono">
                                        {customer.id.slice(0, 12)}…
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-zinc-400">{customer.phone ?? '—'}</td>
                                <td className="px-5 py-3.5 text-sm text-zinc-400">
                                  {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                    <input
                                      type="number"
                                      min="0"
                                      defaultValue={customer.loyalty_points}
                                      onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val !== customer.loyalty_points) {
                                          supabase
                                            .from('profiles')
                                            .update({ loyalty_points: val })
                                            .eq('id', customer.id)
                                            .then(() => {
                                              setCustomers((prev) =>
                                                prev.map((c) =>
                                                  c.id === customer.id ? { ...c, loyalty_points: val } : c
                                                )
                                              );
                                            });
                                        }
                                      }}
                                      className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-yellow-400 font-semibold focus:outline-none focus:border-green-primary"
                                    />
                                    <span className="text-xs text-zinc-500">pts</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full border ${customer.is_admin
                                      ? 'text-green-400 bg-green-900/30 border-green-800'
                                      : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                                      }`}
                                  >
                                    {customer.is_admin ? 'Admin' : 'Client'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <button
                                    onClick={() => handleToggleAdmin(customer.id, customer.is_admin)}
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${customer.is_admin
                                      ? 'text-red-400 border-red-800 hover:bg-red-900/20'
                                      : 'text-green-400 border-green-800 hover:bg-green-900/20'
                                      }`}
                                  >
                                    {customer.is_admin ? (
                                      <><ShieldOff className="w-3 h-3" />Retirer admin</>
                                    ) : (
                                      <><ShieldCheck className="w-3 h-3" />Passer admin</>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {filteredCustomers.length === 0 && (
                        <p className="text-zinc-500 text-center py-10">Aucun client trouvé.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════ SETTINGS ═══════════════════ */}
                {tab === 'settings' && (
                  <div className="max-w-2xl space-y-6 pb-20">
                    {/* Delivery */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-5 h-5 text-green-neon" />
                        <h2 className="font-serif font-semibold text-lg">Livraison</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL}>Frais de livraison (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={localSettings.delivery_fee}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, delivery_fee: parseFloat(e.target.value) || 0 })
                            }
                            className={INPUT}
                          />
                        </div>
                        <div>
                          <label className={LABEL}>Seuil livraison gratuite (€)</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={localSettings.delivery_free_threshold}
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                delivery_free_threshold: parseInt(e.target.value) || 0,
                              })
                            }
                            className={INPUT}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Livraison offerte automatiquement dès {localSettings.delivery_free_threshold} € de commande.
                      </p>
                    </div>

                    {/* Store info */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="w-5 h-5 text-green-neon" />
                        <h2 className="font-serif font-semibold text-lg">Informations boutique</h2>
                      </div>
                      <div>
                        <label className={LABEL}>Nom de la boutique</label>
                        <input
                          value={localSettings.store_name}
                          onChange={(e) => setLocalSettings({ ...localSettings, store_name: e.target.value })}
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Adresse</label>
                        <input
                          value={localSettings.store_address}
                          onChange={(e) => setLocalSettings({ ...localSettings, store_address: e.target.value })}
                          className={INPUT}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL}>Téléphone</label>
                          <input
                            value={localSettings.store_phone}
                            onChange={(e) => setLocalSettings({ ...localSettings, store_phone: e.target.value })}
                            className={INPUT}
                          />
                        </div>
                        <div>
                          <label className={LABEL}>Horaires</label>
                          <input
                            value={localSettings.store_hours}
                            onChange={(e) => setLocalSettings({ ...localSettings, store_hours: e.target.value })}
                            className={INPUT}
                            placeholder="Lun–Sam 10h00–19h30"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Networks */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Instagram className="w-5 h-5 text-green-neon" />
                        <h2 className="font-serif font-semibold text-lg">Réseaux Sociaux</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL}>Instagram (URL)</label>
                          <input
                            type="url"
                            value={localSettings.social_instagram}
                            onChange={(e) => setLocalSettings({ ...localSettings, social_instagram: e.target.value })}
                            className={INPUT}
                            placeholder="https://instagram.com/…"
                          />
                        </div>
                        <div>
                          <label className={LABEL}>Facebook (URL)</label>
                          <input
                            type="url"
                            value={localSettings.social_facebook}
                            onChange={(e) => setLocalSettings({ ...localSettings, social_facebook: e.target.value })}
                            className={INPUT}
                            placeholder="https://facebook.com/…"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Banner */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-green-neon" />
                          <h2 className="font-serif font-semibold text-lg">Bannière promotionnelle</h2>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localSettings.banner_enabled}
                            onChange={(e) => setLocalSettings({ ...localSettings, banner_enabled: e.target.checked })}
                            className="w-4 h-4 accent-green-600"
                          />
                          <span className="text-sm text-zinc-300">Activée</span>
                        </label>
                      </div>
                      <div>
                        <label className={LABEL}>Texte de la bannière</label>
                        <input
                          value={localSettings.banner_text}
                          onChange={(e) => setLocalSettings({ ...localSettings, banner_text: e.target.value })}
                          className={INPUT}
                          placeholder="🌿 Offre de bienvenue…"
                        />
                      </div>
                      {localSettings.banner_enabled && (
                        <div className="bg-green-neon text-white px-4 py-3 rounded-xl text-sm text-center">
                          Aperçu : {localSettings.banner_text || '…'}
                        </div>
                      )}
                    </div>

                    {/* BudTender IA */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-5 h-5 text-green-neon" />
                          <h2 className="font-serif font-semibold text-lg">Conseiller BudTender IA</h2>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localSettings.budtender_enabled}
                            onChange={(e) => setLocalSettings({ ...localSettings, budtender_enabled: e.target.checked })}
                            className="w-4 h-4 accent-green-600"
                          />
                          <span className="text-sm text-zinc-300">Activé</span>
                        </label>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Affiche la bulle de chat flottante en bas à droite de l'écran pour conseiller les clients.
                      </p>
                    </div>

                    {/* Abonnements */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-green-neon" />
                          <h2 className="font-serif font-semibold text-lg">Système d'abonnements</h2>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localSettings.subscriptions_enabled}
                            onChange={(e) => setLocalSettings({ ...localSettings, subscriptions_enabled: e.target.checked })}
                            className="w-4 h-4 accent-green-600"
                          />
                          <span className="text-sm text-zinc-300">Activé</span>
                        </label>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Permet aux clients de s'abonner aux produits (huiles) pour recevoir des livraisons récurrentes.
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors"
                      >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Enregistrement…' : 'Sauvegarder les paramètres'}
                      </button>
                      {saveSuccess && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-green-400 text-sm font-medium"
                        >
                          Paramètres enregistrés !
                        </motion.span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Subscriptions tab ── */}
                {tab === 'subscriptions' && !isLoading && (
                  <AdminSubscriptionsTab />
                )}

                {/* ── Reviews tab ── */}
                {tab === 'reviews' && !isLoading && (
                  <AdminReviewsTab />
                )}

                {/* ── Analytics tab ── */}
                {tab === 'analytics' && !isLoading && (
                  <AdminAnalyticsTab />
                )}

                {/* ── Promo Codes tab ── */}
                {tab === 'promo_codes' && !isLoading && (
                  <AdminPromoCodesTab />
                )}

                {/* ── Recommendations tab ── */}
                {tab === 'recommendations' && !isLoading && (
                  <AdminRecommendationsTab />
                )}

                {/* ── BudTender IA tab ── */}
                {tab === 'budtender' && !isLoading && (
                  <AdminBudTenderTab />
                )}

                {/* ── Referrals tab ── */}
                {tab === 'referrals' && !isLoading && (
                  <AdminReferralsTab />
                )}

                {/* ── POS tab ── */}
                {tab === 'pos' && !isLoading && (
                  <div className="flex-1 p-0 overflow-hidden">
                    <AdminPOSTab
                      storeName={localSettings.store_name}
                      storeAddress={localSettings.store_address}
                      storePhone={localSettings.store_phone}
                      onExit={() => setTab('dashboard')}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div >
    </>
  );
}
