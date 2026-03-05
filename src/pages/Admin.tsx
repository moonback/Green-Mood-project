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
  Brain,
  LayoutGrid,
  List,
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
import AdminDashboardTab from '../components/admin/AdminDashboardTab';
import AdminProductsTab from '../components/admin/AdminProductsTab';
import AdminCategoriesTab from '../components/admin/AdminCategoriesTab';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import AdminStockTab from '../components/admin/AdminStockTab';
import AdminCustomersTab from '../components/admin/AdminCustomersTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import ProductImageUpload from '../components/admin/ProductImageUpload';
import CSVImporter from '../components/admin/CSVImporter';
import { generateEmbedding } from '../lib/embeddings';

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
  search_enabled: boolean;
  ticker_messages: string[];
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
  search_enabled: true,
  ticker_messages: [
    "✦ Livraison offerte dès 50€ d'achat ✦",
    "✦ Nouveau : Découvrez la gamme N10 ✦",
    "✦ -10% sur votre première commande avec GREENMOOD ✦"
  ],
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isSyncingVectors, setIsSyncingVectors] = useState(false);
  const [vectorSyncProgress, setVectorSyncProgress] = useState<{ done: number; total: number } | null>(null);

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
    // Explicitly listing columns to ensure embedding is included
    const { data } = await supabase
      .from('products')
      .select('*, embedding, category:categories(*)')
      .order('name');
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

  const hasEmbedding = (embedding: Product['embedding']) => {
    if (Array.isArray(embedding)) return embedding.length > 0;
    if (typeof embedding === 'string') return embedding.trim().length > 0 && embedding.trim() !== '[]';
    return false;
  };

  const productsWithoutVectors = products.filter((product) => !hasEmbedding(product.embedding));

  const buildProductEmbeddingText = (product: Product) => {
    const benefits = Array.isArray(product.attributes?.benefits)
      ? product.attributes.benefits.join(' ')
      : '';

    return [
      product.name,
      product.description ?? '',
      product.cbd_percentage ? `CBD ${product.cbd_percentage}%` : '',
      benefits,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  };

  const isQuotaError = (error: unknown) => {
    const errorText = `${(error as { message?: string })?.message ?? ''} ${JSON.stringify(error ?? '')}`.toLowerCase();
    return errorText.includes('quota exceeded')
      || errorText.includes('resource_exhausted')
      || errorText.includes('too many requests')
      || errorText.includes('rate limit')
      || errorText.includes('code":429');
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSyncMissingVectors = async () => {
    if (productsWithoutVectors.length === 0 || isSyncingVectors) return;

    setIsSyncingVectors(true);
    setVectorSyncProgress({ done: 0, total: productsWithoutVectors.length });

    let successCount = 0;
    let failedCount = 0;
    let stoppedByQuota = false;

    for (let i = 0; i < productsWithoutVectors.length; i += 1) {
      const product = productsWithoutVectors[i];
      try {
        const textToEmbed = buildProductEmbeddingText(product);
        if (!textToEmbed) throw new Error('Texte vide pour la génération du vecteur.');

        const embedding = await generateEmbedding(textToEmbed);
        if (!embedding.length) throw new Error('Vecteur vide reçu depuis OpenRouter.');

        const { error } = await supabase
          .from('products')
          .update({ embedding })
          .eq('id', product.id);

        if (error) throw error;

        successCount += 1;
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, embedding } : p))
        );
      } catch (error) {
        failedCount += 1;

        if (isQuotaError(error)) {
          stoppedByQuota = true;
          console.warn('Sync IA interrompue: quota/rate-limit OpenRouter atteint.', error);
          break;
        }

        console.error(`Erreur de vectorisation pour ${product.name}:`, error);
      } finally {
        setVectorSyncProgress({ done: i + 1, total: productsWithoutVectors.length });
      }

      // Limite les appels rapprochés pour réduire les 429.
      await sleep(700);
    }

    setIsSyncingVectors(false);
    setVectorSyncProgress(null);

    if (stoppedByQuota) {
      alert(
        `Quota OpenRouter atteint. Sync interrompue après ${successCount} succès et ${failedCount} échec(s). `
        + 'Réessayez plus tard ou utilisez un plan avec plus de quota.'
      );
      return;
    }

    alert(`Sync IA terminée: ${successCount}/${productsWithoutVectors.length} produit(s) vectorisé(s). Échecs: ${failedCount}.`);
  };

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
                {/* ── Core admin tabs ── */}
                {tab === 'dashboard' && stats && (
                  <AdminDashboardTab
                    stats={stats}
                    orderStatusOptions={ORDER_STATUS_OPTIONS}
                    onOpenOrders={() => setTab('orders')}
                    onOpenStock={() => setTab('stock')}
                  />
                )}

                {tab === 'products' && (
                  <AdminProductsTab
                    filteredProducts={filteredProducts}
                    products={products}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onOpenProductModal={openProductModal}
                    onDeleteProduct={handleDeleteProduct}
                    onSyncMissingVectors={handleSyncMissingVectors}
                    isSyncingVectors={isSyncingVectors}
                    vectorSyncProgress={vectorSyncProgress}
                    productsWithoutVectors={productsWithoutVectors}
                    stockAdjust={stockAdjust}
                    setStockAdjust={setStockAdjust}
                    onConfirmStockAdjust={handleStockAdjust}
                    isSaving={isSaving}
                    onReloadProducts={loadProducts}
                  />
                )}

                {tab === 'categories' && (
                  <AdminCategoriesTab
                    categories={categories}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onOpenModal={openCategoryModal}
                    onDeleteCategory={handleDeleteCategory}
                  />
                )}

                {tab === 'orders' && (
                  <AdminOrdersTab
                    orders={filteredOrders}
                    expandedOrder={expandedOrder}
                    setExpandedOrder={setExpandedOrder}
                    orderStatusFilter={orderStatusFilter}
                    setOrderStatusFilter={setOrderStatusFilter}
                    orderStatusOptions={ORDER_STATUS_OPTIONS}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    storeSettings={localSettings}
                  />
                )}

                {tab === 'stock' && (
                  <AdminStockTab
                    products={filteredProducts}
                    movements={movements}
                    stockAdjust={stockAdjust}
                    setStockAdjust={setStockAdjust}
                    onConfirmStockAdjust={handleStockAdjust}
                    isSaving={isSaving}
                  />
                )}

                {tab === 'customers' && (
                  <AdminCustomersTab
                    customers={filteredCustomers}
                    onToggleAdmin={handleToggleAdmin}
                    onUpdateLoyaltyPoints={(id, val) => {
                      supabase.from('profiles').update({ loyalty_points: val }).eq('id', id).then(() => {
                        setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, loyalty_points: val } : c)));
                      });
                    }}
                  />
                )}

                {tab === 'settings' && (
                  <AdminSettingsTab
                    localSettings={localSettings}
                    setLocalSettings={setLocalSettings}
                    isSaving={isSaving}
                    saveSuccess={saveSuccess}
                    onSave={handleSaveSettings}
                    inputClassName={INPUT}
                    labelClassName={LABEL}
                  />
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
