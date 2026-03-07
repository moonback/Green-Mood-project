import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    CreditCard,
    Banknote,
    Smartphone,
    X,
    CheckCircle2,
    Printer,
    RotateCcw,
    Package,
    Coins,
    Percent,
    Hash,
    AlertTriangle,
    ChevronDown,
    User,
    UserPlus,
    FileText,
    Lock,
    FileCheck,
    Calendar,
    History as HistoryIcon,
    ChevronRight,
    Maximize,
    Star,
    Minimize,
    LayoutGrid,
    LogOut,
    Settings,
    Calculator,
    Tag,
    Sun,
    Moon,
    Brain,
    Eye,
    EyeOff,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product, Category, Profile } from '../../lib/types';
import POSReceiptModal from './pos/POSReceiptModal';
import POSReportModal from './pos/POSReportModal';
import POSCategoryGrid from './pos/POSCategoryGrid';
import POSProductGrid from './pos/POSProductGrid';
import POSCustomerSelection from './pos/POSCustomerSelection';
import POSCustomerDetailModal from './pos/POSCustomerDetailModal';
import POSAIPreferencesModal from './pos/POSAIPreferencesModal';
import POSCartPanel from './pos/POSCartPanel';
import POSPaymentModal from './pos/POSPaymentModal';
import { CartLine, PaymentMethod, AppliedPromo, CompletedSale, DailyReport } from './pos/types';
import { UserAIPreferences, Address } from '../../lib/types';
import { CATEGORY_SLUGS } from '../../lib/constants';

// ─── Main Component ───────────────────────────────────────────────────────────

interface AdminPOSTabProps {
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
    onExit?: () => void;
}

function AdminPOSTab({
    storeName = 'Green Mood CBD',
    storeAddress = '123 Rue de la Nature, 75000 Paris',
    storePhone = '01 23 45 67 89',
    onExit,
}: AdminPOSTabProps) {
    // ── Product catalogue ──
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [posStep, setPosStep] = useState<'client' | 'category' | 'products'>('client');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    // ── Cart ──
    const [cart, setCart] = useState<CartLine[]>([]);

    // ── Discount ──
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState('');

    // ── Payment ──
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [cashGiven, setCashGiven] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // ── Customer ──
    const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
    const [showCustomerDetail, setShowCustomerDetail] = useState(false);
    const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    // ── Report ──
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState<DailyReport | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportMode, setReportMode] = useState<'view' | 'close'>('view');
    const [cashCounted, setCashCounted] = useState<string>('');
    const [isSessionClosed, setIsSessionClosed] = useState(false);

    // ── History ──
    const [showHistory, setShowHistory] = useState(false);
    const [historyDays, setHistoryDays] = useState<{ date: string; total: number; count: number }[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isUnlockedManually, setIsUnlockedManually] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockPin, setUnlockPin] = useState('');
    const [unlockError, setUnlockError] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);

    // ── Promo codes ──
    const [promoInput, setPromoInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
    const [promoError, setPromoError] = useState('');
    const [isCheckingPromo, setIsCheckingPromo] = useState(false);

    // ── Theme ──
    const [isLightTheme, setIsLightTheme] = useState(false);

    // ── AI Preferences ──
    const [selectedCustomerAIPreferences, setSelectedCustomerAIPreferences] = useState<UserAIPreferences | null>(null);
    const [selectedCustomerDefaultAddress, setSelectedCustomerDefaultAddress] = useState<Address | null>(null);
    const [selectedCustomerOrderCount, setSelectedCustomerOrderCount] = useState<number>(0);
    const [showAIPreferences, setShowAIPreferences] = useState(false);
    const [showTodayTotal, setShowTodayTotal] = useState(false);

    // ── Create customer (POS) ──
    // States moved to POSCustomerSelection

    // Business Date helper (working day starts at 6:00 AM)
    const getBusinessDate = useCallback(() => {
        const now = new Date();
        const businessDate = new Date(now);
        if (now.getHours() < 6) {
            businessDate.setDate(now.getDate() - 1);
        }
        return businessDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
    }, []);

    const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

    // ── Cart actions ──
    const addToCart = useCallback((product: Product) => {
        setCart((prev) => {
            const existing = prev.find((l) => l.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_quantity) {
                    alert(`Stock insuffisant pour ${product.name} (Max: ${product.stock_quantity})`);
                    return prev;
                }
                return prev.map((l) =>
                    l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
                );
            }
            return [...prev, { product, quantity: 1, unitPrice: product.price }];
        });
    }, []);

    const updateQty = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((l) =>
                    l.product.id === productId
                        ? { ...l, quantity: Math.max(0, Math.min(l.quantity + delta, l.product.stock_quantity)) }
                        : l
                )
                .filter((l) => l.quantity > 0)
        );
    };

    const updatePrice = (productId: string, price: string) => {
        const p = parseFloat(price);
        if (!isNaN(p) && p >= 0) {
            setCart((prev) =>
                prev.map((l) =>
                    l.product.id === productId ? { ...l, unitPrice: p } : l
                )
            );
        }
    };

    const removeLine = (productId: string) => {
        setCart((prev) => prev.filter((l) => l.product.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setDiscountValue('');
        setCashGiven('');
        setPaymentMethod('cash');
        setSelectedCustomer(null);
        setUseLoyaltyPoints(false);
        setPointsToRedeem(0);
        setAppliedPromo(null);
        setPromoInput('');
        setPromoError('');
        setPosStep('client');
        setIsCartVisible(false);
    };

    // ── Apply promo code ──
    const handleApplyPromo = async () => {
        const code = promoInput.trim().toUpperCase();
        if (!code) return;
        setIsCheckingPromo(true);
        setPromoError('');
        try {
            const { data, error } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', code)
                .eq('is_active', true)
                .single();

            if (error || !data) {
                setPromoError('Code promo invalide ou inactif.');
                return;
            }
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                setPromoError('Ce code promo a expiré.');
                return;
            }
            if (data.max_uses != null && data.uses_count >= data.max_uses) {
                setPromoError('Ce code promo a atteint son nombre maximal d\'utilisations.');
                return;
            }
            if (subtotal < data.min_order_value) {
                setPromoError(`Montant minimum requis : ${data.min_order_value.toFixed(2)} €`);
                return;
            }
            const discount_amount =
                data.discount_type === 'percent'
                    ? Math.min(subtotal, (subtotal * data.discount_value) / 100)
                    : Math.min(subtotal, data.discount_value);

            setAppliedPromo({
                code: data.code,
                description: data.description,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                discount_amount,
            });
            setPromoInput('');
        } catch {
            setPromoError('Erreur lors de la vérification du code.');
        } finally {
            setIsCheckingPromo(false);
        }
    };

    // ── Create customer from POS ──
    // Moved to POSCustomerSelection

    // ── Real-time Stats ──
    const [todayTotal, setTodayTotal] = useState(0);

    // --- Barcode Scanner Listener ---
    const scanBuffer = useRef('');
    const lastScanTime = useRef(0);

    const handleScan = useCallback(
        async (sku: string) => {
            if (!sku || sku.length < 3) return;
            // Search in currently loaded products first
            const product = products.find((p) => p.sku === sku);
            if (product) {
                addToCart(product);
            } else {
                // Try fetching from DB if not in current list
                const { data } = await supabase
                    .from('products')
                    .select('*')
                    .eq('sku', sku)
                    .eq('is_active', true)
                    .single();
                if (data) {
                    addToCart(data as Product);
                }
            }
        },
        [products] // eslint-disable-line react-hooks/exhaustive-deps
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            const currentTime = Date.now();
            if (currentTime - lastScanTime.current > 50) {
                scanBuffer.current = '';
            }
            lastScanTime.current = currentTime;

            if (e.key === 'Enter') {
                if (scanBuffer.current.length >= 3) {
                    handleScan(scanBuffer.current);
                    scanBuffer.current = '';
                    e.preventDefault();
                }
            } else if (e.key.length === 1) {
                scanBuffer.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleScan]);

    // ── Load data ──
    const loadProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        const [{ data: prods }, { data: cats }] = await Promise.all([
            supabase.from('products').select('*').eq('is_active', true).order('name'),
            supabase.from('categories').select('*').order('sort_order'),
        ]);
        setProducts((prods as Product[]) ?? []);
        setCategories((cats as Category[]) ?? []);
        setIsLoadingProducts(false);
    }, []);

    const loadTodayStats = useCallback(async () => {
        const todayStr = getBusinessDate();

        // Logical working day: todayStr 06:00 to dayAfter 05:59
        const bStart = new Date(todayStr + "T06:00:00");
        const bEnd = new Date(bStart);
        bEnd.setDate(bEnd.getDate() + 1);

        // 1. Fetch sales for this business day
        const { data: sales } = await supabase
            .from('orders')
            .select('total')
            .eq('delivery_type', 'in_store')
            .gte('created_at', bStart.toISOString())
            .lt('created_at', bEnd.toISOString());

        if (sales) {
            setTodayTotal(sales.reduce((acc, o) => acc + o.total, 0));
        }

        // 2. Check if already closed for this business date
        const { data: report } = await supabase
            .from('pos_reports')
            .select('id')
            .eq('date', todayStr)
            .maybeSingle();

        setIsSessionClosed(!!report);
    }, [getBusinessDate]);

    useEffect(() => {
        loadProducts();
        loadTodayStats();
    }, [loadProducts, loadTodayStats]);

    useEffect(() => {
        if (showHistory) {
            loadHistory();
        }
    }, [showHistory]);

    // ── Customer search ──
    // Logic moved to POSCustomerSelection

    // ── Computed ──
    const subtotal = cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    const discountNum = parseFloat(discountValue) || 0;
    const discount =
        discountNum <= 0
            ? 0
            : discountType === 'percent'
                ? Math.min(subtotal, (subtotal * discountNum) / 100)
                : Math.min(subtotal, discountNum);

    // Loyalty points conversion: 100 points = 1€
    const loyaltyDiscount = useLoyaltyPoints ? pointsToRedeem / 100 : 0;
    const promoDiscount = appliedPromo?.discount_amount ?? 0;
    const total = Math.max(0, subtotal - discount - loyaltyDiscount - promoDiscount);
    const cashNum = parseFloat(cashGiven) || 0;
    const change = Math.max(0, cashNum - total);

    const filteredProducts = products.filter((p) => {
        const matchSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedCategory === 'favorites') {
            return p.is_featured && matchSearch && p.stock_quantity > 0;
        }

        const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
        return matchCat && matchSearch && p.stock_quantity > 0;
    });

    // ── Cart actions ──

    useEffect(() => {
        if (selectedCustomer) {
            const fetchPrefs = async () => {
                // Fetch AI Preferences
                const { data: aiData } = await supabase
                    .from('user_ai_preferences')
                    .select('*')
                    .eq('user_id', selectedCustomer.id)
                    .maybeSingle();
                setSelectedCustomerAIPreferences(aiData);

                // Fetch Default Address
                const { data: addrData } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', selectedCustomer.id)
                    .eq('is_default', true)
                    .maybeSingle();
                setSelectedCustomerDefaultAddress(addrData);

                // Fetch Order Count
                const { count } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', selectedCustomer.id);
                setSelectedCustomerOrderCount(count || 0);
            };
            fetchPrefs();
        } else {
            setSelectedCustomerAIPreferences(null);
            setSelectedCustomerDefaultAddress(null);
            setSelectedCustomerOrderCount(0);
        }
    }, [selectedCustomer]);

    // ── Process sale ──
    const processSale = async () => {
        if (cart.length === 0) return;
        if (isSessionClosed && !isUnlockedManually) {
            alert("La session de caisse est clôturée. Déverrouillez manuellement ou attendez 06:00.");
            return;
        }
        setIsProcessing(true);
        try {
            // 1. Create order
            const { data: order, error: orderErr } = await supabase
                .from('orders')
                .insert({
                    user_id: selectedCustomer?.id || null,
                    delivery_type: 'in_store',
                    address_id: null,
                    subtotal,
                    delivery_fee: 0,
                    total,
                    promo_discount: discount + loyaltyDiscount + promoDiscount,
                    promo_code: appliedPromo?.code ?? ((discount > 0 || loyaltyDiscount > 0)
                        ? `POS-REMISE-${discount > 0 ? (discountType === 'percent' ? discountValue + '%' : discountValue + 'EUR') : ''}${loyaltyDiscount > 0 ? `-LOYALTY-${pointsToRedeem}PTS` : ''}`
                        : null),
                    loyalty_points_earned: Math.floor(total),
                    payment_status: 'paid',
                    status: 'delivered',
                    notes: `[POS] Vente en boutique${selectedCustomer ? ` (Client: ${selectedCustomer.full_name})` : ''} — Paiement: ${paymentMethod === 'cash' ? 'Espèces' : paymentMethod === 'card' ? 'Carte' : 'Mobile'
                        }`,
                })
                .select()
                .single();

            if (orderErr || !order) throw new Error('Erreur création commande');

            // 2. Insert order items
            await supabase.from('order_items').insert(
                cart.map((l) => ({
                    order_id: order.id,
                    product_id: l.product.id,
                    product_name: l.product.name,
                    unit_price: l.unitPrice,
                    quantity: l.quantity,
                    total_price: l.quantity * l.unitPrice,
                }))
            );

            // 2b. Increment promo code usage counter
            if (appliedPromo) {
                await supabase.rpc('increment_promo_uses', { code_text: appliedPromo.code });
            }

            // 3. Decrement stock
            for (const line of cart) {
                if (line.product.is_bundle) {
                    // Logic for bundles: decrement components
                    const { data: components } = await supabase
                        .from('bundle_items')
                        .select('product_id, quantity')
                        .eq('bundle_id', line.product.id);

                    if (components) {
                        for (const comp of components) {
                            const totalQty = comp.quantity * line.quantity;
                            // Fetch current stock to avoid race conditions or use RPC
                            // Since we don't have decrement_stock RPC yet, we fetch & update
                            const { data: compProd } = await supabase
                                .from('products')
                                .select('stock_quantity')
                                .eq('id', comp.product_id)
                                .single();

                            if (compProd) {
                                await supabase
                                    .from('products')
                                    .update({ stock_quantity: Math.max(0, compProd.stock_quantity - totalQty) })
                                    .eq('id', comp.product_id);

                                await supabase.from('stock_movements').insert({
                                    product_id: comp.product_id,
                                    quantity_change: -totalQty,
                                    type: 'sale',
                                    note: `[POS] Bundle component #${order.id.slice(0, 8).toUpperCase()}`,
                                });
                            }
                        }
                    }
                    // Trigger sync (the SQL trigger should also handle it, but we force it for UI freshness)
                    await supabase.rpc('sync_bundle_stock', { p_bundle_id: line.product.id });
                } else {
                    // Regular product
                    const newStock = Math.max(0, line.product.stock_quantity - line.quantity);
                    await supabase
                        .from('products')
                        .update({ stock_quantity: newStock })
                        .eq('id', line.product.id);

                    await supabase.from('stock_movements').insert({
                        product_id: line.product.id,
                        quantity_change: -line.quantity,
                        type: 'sale',
                        note: `[POS] Vente boutique #${order.id.slice(0, 8).toUpperCase()}`,
                    });
                }
            }

            // 4. Update customer loyalty points if linked
            if (selectedCustomer) {
                const earned = Math.floor(total);
                const redeemed = useLoyaltyPoints ? pointsToRedeem : 0;
                const newPoints = (selectedCustomer.loyalty_points || 0) + earned - redeemed;

                await supabase
                    .from('profiles')
                    .update({ loyalty_points: newPoints })
                    .eq('id', selectedCustomer.id);

                if (earned > 0) {
                    await supabase.from('loyalty_transactions').insert({
                        user_id: selectedCustomer.id,
                        order_id: order.id,
                        type: 'earned',
                        points: earned,
                        balance_after: (selectedCustomer.loyalty_points || 0) + earned,
                        note: `[POS] Vente boutique #${order.id.slice(0, 8).toUpperCase()}`,
                    });
                }
                if (redeemed > 0) {
                    await supabase.from('loyalty_transactions').insert({
                        user_id: selectedCustomer.id,
                        order_id: order.id,
                        type: 'redeemed',
                        points: redeemed,
                        balance_after: newPoints,
                        note: `[POS] Utilisation points en boutique #${order.id.slice(0, 8).toUpperCase()}`,
                    });
                }
            }

            const sale: CompletedSale = {
                orderId: order.id,
                shortId: order.id.slice(0, 8).toUpperCase(),
                lines: [...cart],
                subtotal,
                discount,
                promoCode: appliedPromo?.code,
                promoDiscount: promoDiscount > 0 ? promoDiscount : undefined,
                total,
                paymentMethod,
                cashGiven: paymentMethod === 'cash' ? cashNum : undefined,
                change: paymentMethod === 'cash' ? change : undefined,
                timestamp: new Date(),
                loyaltyGained: selectedCustomer ? Math.floor(total) : 0,
                loyaltyRedeemed: useLoyaltyPoints ? pointsToRedeem : 0,
            };

            clearCart();
            setShowPaymentModal(false);
            setCompletedSale(sale);
            loadTodayStats();
            // Reload products to get updated stock
            loadProducts();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la vente. Vérifiez la console.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateReport = async (mode: 'view' | 'close' = 'view') => {
        setIsGeneratingReport(true);
        setReportMode(mode);
        const todayStr = getBusinessDate();
        const bStart = new Date(todayStr + "T06:00:00");
        const bEnd = new Date(bStart);
        bEnd.setDate(bEnd.getDate() + 1);

        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    id, total, notes, delivery_type,
                    order_items (quantity)
                `)
                .eq('delivery_type', 'in_store')
                .gte('created_at', bStart.toISOString())
                .lt('created_at', bEnd.toISOString());

            if (error) throw error;

            const report: DailyReport = {
                totalSales: 0,
                cashTotal: 0,
                cardTotal: 0,
                mobileTotal: 0,
                itemsSold: 0,
                orderCount: orders?.length || 0,
                date: new Date(),
                productBreakdown: {}
            };

            orders?.forEach(o => {
                report.totalSales += o.total;
                if (o.notes?.includes('Paiement: Espèces')) report.cashTotal += o.total;
                else if (o.notes?.includes('Paiement: Carte')) report.cardTotal += o.total;
                else if (o.notes?.includes('Paiement: Mobile')) report.mobileTotal += o.total;

                o.order_items?.forEach((item: any) => {
                    report.itemsSold += item.quantity;
                    const name = item.product_name || 'Inconnu';
                    if (!report.productBreakdown[name]) {
                        report.productBreakdown[name] = { qty: 0, total: 0 };
                    }
                    report.productBreakdown[name].qty += item.quantity;
                    report.productBreakdown[name].total += item.total_price;
                });
            });

            setReportData(report);
            setShowReportModal(true);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la génération du rapport');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const finalizeClose = async () => {
        if (!reportData) return;

        if (!window.confirm('Confirmer la CLÔTURE DÉFINITIVE de la journée ? \n\nCette action enregistrera le rapport Z en base de données et bloquera les ventes jusqu\'à demain.')) {
            return;
        }

        setIsProcessing(true);
        try {
            // Get current user ID (admin)
            const { data: { user } } = await supabase.auth.getUser();

            const todayStr = getBusinessDate();

            const { error } = await supabase
                .from('pos_reports')
                .upsert({
                    date: todayStr,
                    total_sales: reportData.totalSales,
                    cash_total: reportData.cashTotal,
                    card_total: reportData.cardTotal,
                    mobile_total: reportData.mobileTotal,
                    items_sold: reportData.itemsSold,
                    order_count: reportData.orderCount,
                    product_breakdown: reportData.productBreakdown,
                    cash_counted: parseFloat(cashCounted) || 0,
                    cash_difference: (parseFloat(cashCounted) || 0) - reportData.cashTotal,
                    closed_at: new Date().toISOString(),
                    closed_by: user?.id
                }, { onConflict: 'date' });

            if (error) throw error;

            setIsSessionClosed(true);
            setShowReportModal(false);
            alert('Session clôturée avec succès et enregistrée en base de données.');
            loadHistory(); // Refresh history
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la clôture en base de données');
        } finally {
            setIsProcessing(false);
        }
    };

    const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const { data: reports, error } = await supabase
                .from('pos_reports')
                .select('*')
                .order('date', { ascending: false })
                .limit(30);

            if (error) throw error;

            setHistoryDays(reports.map(r => ({
                date: r.date,
                total: r.total_sales,
                count: r.order_count,
                // store whole record if needed later
                ...r
            })));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleViewPastReport = async (dateStr: string) => {
        setIsGeneratingReport(true);
        setReportMode('view');

        const start = new Date(dateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);

        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    id, total, notes, delivery_type,
                    order_items (quantity, product_name, total_price)
                `)
                .eq('delivery_type', 'in_store')
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString());

            if (error) throw error;

            const report: DailyReport = {
                totalSales: 0,
                cashTotal: 0,
                cardTotal: 0,
                mobileTotal: 0,
                itemsSold: 0,
                orderCount: orders?.length || 0,
                date: new Date(dateStr),
                productBreakdown: {}
            };

            orders?.forEach(o => {
                report.totalSales += o.total;
                if (o.notes?.includes('Paiement: Espèces')) report.cashTotal += o.total;
                else if (o.notes?.includes('Paiement: Carte')) report.cardTotal += o.total;
                else if (o.notes?.includes('Paiement: Mobile')) report.mobileTotal += o.total;

                o.order_items?.forEach((item: any) => {
                    report.itemsSold += item.quantity;
                    const name = item.product_name || 'Inconnu';
                    if (!report.productBreakdown[name]) {
                        report.productBreakdown[name] = { qty: 0, total: 0 };
                    }
                    report.productBreakdown[name].qty += item.quantity;
                    report.productBreakdown[name].total += item.total_price;
                });
            });

            setReportData(report);
            setShowReportModal(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const [isCartVisible, setIsCartVisible] = useState(false);

    return (
        <div className={`h-full flex flex-col gap-2 sm:gap-4 overflow-hidden relative transition-colors duration-500 ${isLightTheme ? 'bg-emerald-50/50' : ''}`}>
            {/* ── TOP: Professional Header ── */}
            <header className={`relative z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 backdrop-blur-2xl border-b transition-all duration-500 ${isLightTheme
                ? 'bg-white/70 border-emerald-100/50 shadow-[0_8px_32px_rgba(16,185,129,0.05)]'
                : 'bg-[#0a0a0b]/80 border-zinc-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)] md:rounded-b-[2.5rem]'
                }`}>

                {/* Branding & Logo */}
                <div className="flex items-center gap-3 sm:gap-5">
                    <motion.div
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        className="relative group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                        <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-black shadow-xl">
                            <ShoppingCart className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                    </motion.div>
                    <div className="flex flex-col">
                        <h1 className={`text-lg sm:text-2xl font-black tracking-tight leading-none flex items-center gap-1 sm:gap-2 ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                            Green Mood
                            <span className={`px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[10px] uppercase tracking-widest border ${isLightTheme ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>POS</span>
                        </h1>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="hidden md:flex items-center gap-4 lg:gap-12">
                    <button
                        onClick={() => setShowTodayTotal(!showTodayTotal)}
                        className="flex items-center gap-4 group hover:opacity-80 transition-opacity"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLightTheme ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-800/50 text-zinc-500 group-hover:bg-green-500/10 group-hover:text-green-400'}`}>
                            {showTodayTotal ? <Coins className="w-5 h-5" /> : <Eye className="w-5 h-5 opacity-40" />}
                        </div>
                        <div className="flex flex-col text-left">
                            <span className={`text-[9px] uppercase font-black tracking-widest mb-0.5 ${isLightTheme ? 'text-emerald-600/40' : 'text-zinc-600'}`}>Ventes du jour</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-xl font-black leading-none tracking-tight transition-all duration-300 ${!showTodayTotal ? 'blur-md select-none opacity-20' : ''} ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                    {todayTotal.toFixed(2)}<span className="text-xs ml-1 opacity-50">€</span>
                                </span>
                                {!showTodayTotal && <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-500 animate-pulse">Cliquer pour voir</span>}
                            </div>
                        </div>
                    </button>

                    <div className={`h-8 w-px ${isLightTheme ? 'bg-emerald-100' : 'bg-zinc-800'}`} />

                    <div className="flex items-center gap-4 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLightTheme ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-800/50 text-zinc-500 group-hover:bg-blue-500/10 group-hover:text-blue-400'}`}>
                            <Package className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[9px] uppercase font-black tracking-widest mb-0.5 ${isLightTheme ? 'text-emerald-600/40' : 'text-zinc-600'}`}>Panier actuel</span>
                            <span className={`text-xl font-black leading-none tracking-tight ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>{cart.length}<span className="text-[10px] ml-1 opacity-40 uppercase">Articles</span></span>
                        </div>
                    </div>

                    {selectedCustomer && selectedCustomerAIPreferences && (
                        <>
                            <div className={`h-8 w-px ${isLightTheme ? 'bg-emerald-100' : 'bg-zinc-800'}`} />
                            <motion.button
                                whileHover={{ y: -2 }}
                                onClick={() => setShowAIPreferences(true)}
                                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all shadow-sm ${isLightTheme
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-white hover:border-emerald-300'
                                    : 'bg-green-500/5 border-green-500/20 text-green-400 hover:bg-green-500/10 hover:border-green-500/40'}`}
                            >
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${isLightTheme ? 'bg-emerald-600 text-white' : 'bg-green-500 text-black'}`}>
                                    <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                <div className="text-left">
                                    <p className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 sm:mb-1 opacity-60`}>Client Profile</p>
                                    <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Intelligence IA</p>
                                </div>
                            </motion.button>
                        </>
                    )}
                </div>

                {/* Toolbar Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {selectedCustomer && selectedCustomerAIPreferences && (
                        <button
                            onClick={() => setShowAIPreferences(true)}
                            className={`md:hidden p-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${isLightTheme
                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                                : 'bg-green-500 text-black shadow-sm shadow-green-500/20'
                                }`}
                            title="Intelligence IA"
                        >
                            <Brain className="w-4 h-4" />
                        </button>
                    )}
                    <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-zinc-800/10 backdrop-blur-sm border border-zinc-800/5 transition-all">
                        <button
                            onClick={() => setIsLightTheme(!isLightTheme)}
                            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 ${isLightTheme
                                ? 'bg-amber-100 text-amber-600 shadow-sm shadow-amber-200'
                                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                                }`}
                            title={isLightTheme ? "Thème Sombre" : "Thème Clair"}
                        >
                            {isLightTheme ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>

                        <button
                            onClick={toggleFullScreen}
                            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 hidden sm:flex ${isLightTheme
                                ? 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                                }`}
                            title="Plein écran"
                        >
                            <Maximize className="w-4 h-4" />
                        </button>

                        <button
                            onClick={loadProducts}
                            className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 ${isLightTheme
                                ? 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                                }`}
                            title="Actualiser"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowAdminMenu(!showAdminMenu)}
                            className={`group flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border shadow-sm ${showAdminMenu
                                ? (isLightTheme ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-green-500 text-black shadow-green-500/20')
                                : (isLightTheme ? 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50' : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800')
                                }`}
                        >
                            <Settings className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-500 ${showAdminMenu ? 'rotate-90' : 'group-hover:rotate-45'}`} />
                            <span className="hidden sm:inline">Gestion</span>
                            <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-300 ${showAdminMenu ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showAdminMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    className={`absolute right-0 mt-3 w-64 border rounded-[2rem] shadow-2xl overflow-hidden z-[110] transition-all backdrop-blur-3xl ${isLightTheme ? 'bg-white/95 border-emerald-100 shadow-emerald-200/50' : 'bg-[#0a0a0b]/95 border-zinc-800 shadow-black'}`}
                                >
                                    <div className="p-3 space-y-1">
                                        <button
                                            onClick={() => {
                                                setShowHistory(!showHistory);
                                                setShowAdminMenu(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${isLightTheme ? 'text-emerald-950 hover:bg-emerald-50' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <HistoryIcon className="w-4 h-4 opacity-50" />
                                                {showHistory ? 'Catalogue' : 'Historique'}
                                            </div>
                                            <ChevronRight className="w-3 h-3 opacity-30" />
                                        </button>

                                        <button
                                            onClick={() => {
                                                handleGenerateReport('view');
                                                setShowAdminMenu(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${isLightTheme ? 'text-emerald-950 hover:bg-emerald-50' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 opacity-50" />
                                                Lecture X
                                            </div>
                                            <ChevronRight className="w-3 h-3 opacity-30" />
                                        </button>

                                        <div className={`h-px mx-4 my-2 transition-colors ${isLightTheme ? 'bg-emerald-100/50' : 'bg-zinc-800/50'}`} />

                                        <button
                                            onClick={() => {
                                                handleGenerateReport('close');
                                                setShowAdminMenu(false);
                                            }}
                                            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Lock className="w-4 h-4 opacity-50" />
                                                Clôture Z
                                            </div>
                                            <ChevronRight className="w-3 h-3 opacity-30" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {onExit && (
                        <button
                            onClick={onExit}
                            className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all group ${isLightTheme
                                ? 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white border border-emerald-100 hover:border-red-100'
                                : 'bg-red-900 text-red-600 border border-zinc-800 hover:text-white hover:border-zinc-500 shadow-xl'}`}
                            title="Fermer le point de vente"
                        >
                            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:-translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </header>

            {/* ── OVERLAY: Session Closed ── */}
            {isSessionClosed && !isUnlockedManually && !showHistory && (
                <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-xl rounded-[3rem] border shadow-2xl m-1 transition-all ${isLightTheme ? 'bg-white/80 border-emerald-100' : 'bg-zinc-950/80 border-zinc-800'}`}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`flex flex-col items-center text-center p-12 border rounded-[3rem] shadow-2xl max-w-lg transition-all ${isLightTheme ? 'bg-white border-emerald-100 shadow-emerald-200/50' : 'bg-zinc-900/50 border-zinc-800 shadow-black/50'}`}
                    >
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 border transition-all ${isLightTheme ? 'bg-red-50 border-red-100' : 'bg-red-600/10 border-red-600/20'}`}>
                            <Lock className="w-12 h-12 text-red-500 animate-pulse" />
                        </div>
                        <h2 className={`text-4xl font-black mb-4 tracking-tighter uppercase transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Caisse Clôturée</h2>
                        <p className={`text-lg font-medium leading-[1.6] mb-10 transition-colors ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-400'}`}>
                            La journée de vente est terminée. <br />
                            Le rapport Z a été validé et sécurisé.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => setShowHistory(true)}
                                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all border ${isLightTheme
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                    : 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500'}`}
                            >
                                <HistoryIcon className="w-5 h-5" />
                                Consulter l'Historique
                            </button>
                            <button
                                onClick={() => {
                                    setUnlockPin('');
                                    setUnlockError(false);
                                    setShowUnlockModal(true);
                                }}
                                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all border ${isLightTheme
                                    ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-500 hover:text-white'
                                    : 'bg-red-600/10 text-red-500 border-red-500/20 hover:bg-red-600 hover:text-white'}`}
                            >
                                <Lock className="w-5 h-5" />
                                Forcer Ouverture
                            </button>
                            {/* <button
                                onClick={() => handleGenerateReport('view')}
                                className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-bold transition-all shadow-xl shadow-white/5 hover:scale-105"
                            >
                                <FileText className="w-5 h-5" />
                                Détails du Rapport
                            </button> */}
                            {onExit && (
                                <button
                                    onClick={onExit}
                                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all border w-full sm:w-auto justify-center ${isLightTheme
                                        ? 'bg-emerald-50 text-emerald-400 border-emerald-100 hover:text-emerald-600'
                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500'}`}
                                >
                                    <LogOut className="w-5 h-5" />
                                    Quitter la Caisse
                                </button>
                            )}
                        </div>
                        <p className={`mt-12 text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isLightTheme ? 'text-emerald-200' : 'text-zinc-600'}`}>
                            Prêt pour la réouverture demain matin
                        </p>
                    </motion.div>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden min-h-0 relative px-2 sm:px-4 lg:px-0">

                {/* ── CENTER: Main Content ── */}
                <div className={`flex-1 flex flex-col min-w-0 overflow-hidden border rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-6 transition-all ${isLightTheme
                    ? 'bg-white border-emerald-100 shadow-xl shadow-emerald-100/20'
                    : 'bg-zinc-900/30 border-zinc-800'
                    } ${isCartVisible ? 'hidden lg:flex' : 'flex'}`}>
                    {showHistory ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className={`text-2xl font-black uppercase tracking-tight transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Historique</h3>
                                    <p className={`text-sm font-medium transition-colors ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Les 30 derniers jours d'activité boutique</p>
                                </div>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isLightTheme ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                                >
                                    Fermer
                                </button>
                            </div>

                            {isLoadingHistory ? (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-24 bg-zinc-800/20 rounded-[2rem] animate-pulse" />
                                    ))}
                                </div>
                            ) : historyDays.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-80 text-zinc-700">
                                    <div className="w-20 h-20 rounded-full bg-zinc-800/30 flex items-center justify-center mb-6">
                                        <HistoryIcon className="w-10 h-10 opacity-20" />
                                    </div>
                                    <p className="font-bold uppercase tracking-widest text-xs">Aucun historique disponible</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {historyDays.map((day) => (
                                        <button
                                            key={day.date}
                                            onClick={() => handleViewPastReport(day.date)}
                                            className={`rounded-[2rem] p-6 flex items-center justify-between group transition-all border ${isLightTheme
                                                ? 'bg-white border-emerald-100 hover:border-emerald-300 shadow-sm shadow-emerald-100/20'
                                                : 'bg-zinc-800/20 hover:bg-zinc-800/50 border-zinc-800/50 hover:border-green-500/30'}`}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-inner border transition-all ${isLightTheme ? 'bg-emerald-50 border-emerald-100' : 'bg-zinc-900 border-zinc-800'}`}>
                                                    <Calendar className={`w-4 h-4 mb-1 transition-colors ${isLightTheme ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                                    <span className={`text-xl font-black transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                                        {new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-lg font-black transition-colors ${isLightTheme ? 'text-emerald-900 group-hover:text-emerald-600' : 'text-white group-hover:text-green-400'}`}>
                                                        {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', month: 'long' })}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Package className={`w-3 h-3 transition-colors ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                                        <p className={`text-xs font-bold uppercase tracking-wider transition-colors ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`}>{day.count} ventes</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className={`text-2xl font-black leading-none transition-colors ${isLightTheme ? 'text-emerald-600' : 'text-green-400'}`}>{day.total.toFixed(2)} €</p>
                                                    <p className={`text-[10px] uppercase font-black tracking-widest mt-1 transition-colors ${isLightTheme ? 'text-emerald-600/40' : 'text-zinc-600'}`}>Total Journalier</p>
                                                </div>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLightTheme ? 'bg-emerald-50 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-green-500 group-hover:text-black'}`}>
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : posStep === 'client' ? (
                        <POSCustomerSelection
                            onSelectCustomer={(c) => {
                                setSelectedCustomer(c);
                                setPosStep('category');
                            }}
                            onSkip={() => setPosStep('category')}
                            isLightTheme={isLightTheme}
                        />
                    ) : posStep === 'category' ? (
                        <POSCategoryGrid
                            categories={categories.filter(c => c.is_active && products.some(p => p.category_id === c.id))}
                            onSelectCategory={(id) => {
                                setSelectedCategory(id);
                                setPosStep('products');
                            }}
                            onBack={() => setPosStep('client')}
                            isLightTheme={isLightTheme}
                        />
                    ) : (
                        <POSProductGrid
                            products={filteredProducts}
                            cart={cart}
                            isLoading={isLoadingProducts}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            onAddToCart={addToCart}
                            onBack={() => {
                                setPosStep('category');
                                setSelectedCategory('all');
                                setSearchQuery('');
                            }}
                            categoryName={
                                selectedCategory === 'all' ? 'Tous les produits'
                                    : selectedCategory === 'favorites' ? 'Favoris'
                                        : categories.find(c => c.id === selectedCategory)?.name || 'Produits'
                            }
                            isLightTheme={isLightTheme}
                        />
                    )}
                </div>

                {/* ── RIGHT: Cart Panel ── */}
                <POSCartPanel
                    isLightTheme={isLightTheme}
                    isCartVisible={isCartVisible}
                    setIsCartVisible={setIsCartVisible}
                    showHistory={showHistory}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                    setPosStep={setPosStep}
                    setShowCustomerDetail={setShowCustomerDetail}
                    selectedCustomerAIPreferences={selectedCustomerAIPreferences}
                    setShowAIPreferences={setShowAIPreferences}
                    useLoyaltyPoints={useLoyaltyPoints}
                    setUseLoyaltyPoints={setUseLoyaltyPoints}
                    pointsToRedeem={pointsToRedeem}
                    setPointsToRedeem={setPointsToRedeem}
                    subtotal={subtotal}
                    discount={discount}
                    promoDiscount={promoDiscount}
                    cart={cart}
                    setCart={setCart}
                    clearCart={clearCart}
                    removeLine={removeLine}
                    updateQty={updateQty}
                    updatePrice={updatePrice}
                    categories={categories}
                    discountType={discountType}
                    setDiscountType={setDiscountType}
                    discountValue={discountValue}
                    setDiscountValue={setDiscountValue}
                    promoInput={promoInput}
                    setPromoInput={setPromoInput}
                    promoError={promoError}
                    setPromoError={setPromoError}
                    appliedPromo={appliedPromo}
                    setAppliedPromo={setAppliedPromo}
                    handleApplyPromo={handleApplyPromo}
                    isCheckingPromo={isCheckingPromo}
                    loyaltyDiscount={loyaltyDiscount}
                    total={total}
                    setShowPaymentModal={setShowPaymentModal}
                />
            </div>

            {/* ── Payment Modal ── */}
            <POSPaymentModal
                showPaymentModal={showPaymentModal}
                setShowPaymentModal={setShowPaymentModal}
                isLightTheme={isLightTheme}
                total={total}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                cashGiven={cashGiven}
                setCashGiven={setCashGiven}
                processSale={processSale}
                isProcessing={isProcessing}
            />

            {/* ── UNLOCK MODAL ── */}
            <AnimatePresence>
                {showUnlockModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center border transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border-zinc-800'}`}
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border transition-all ${isLightTheme ? 'bg-red-50 border-red-100' : 'bg-red-600/10 border-red-600/20'}`}>
                                <Lock className="w-8 h-8 text-red-500" />
                            </div>

                            <h2 className={`text-2xl font-black mb-2 uppercase tracking-tight transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Accès Prioritaire</h2>
                            <p className={`text-sm mb-8 transition-colors ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Entrez le code de déverrouillage pour réouvrir la session.</p>

                            <div className="space-y-6">
                                <div className="flex justify-center gap-3">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${unlockError
                                                ? 'border-red-500 bg-red-500/10 text-red-500'
                                                : unlockPin.length > i
                                                    ? 'border-green-500 bg-green-500/10 text-green-400'
                                                    : (isLightTheme ? 'border-emerald-100 bg-emerald-50 text-emerald-200' : 'border-zinc-800 bg-zinc-950 text-zinc-700')
                                                }`}
                                        >
                                            {unlockPin.length > i ? '•' : ''}
                                        </div>
                                    ))}
                                </div>

                                {unlockError && (
                                    <p className="text-red-500 text-xs font-black uppercase tracking-widest animate-bounce">Code incorrect</p>
                                )}

                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((btn) => (
                                        <button
                                            key={btn.toString()}
                                            onClick={() => {
                                                setUnlockError(false);
                                                if (btn === 'C') setUnlockPin('');
                                                else if (btn === 'OK') {
                                                    if (unlockPin === '1234') {
                                                        setIsUnlockedManually(true);
                                                        setShowUnlockModal(false);
                                                    } else {
                                                        setUnlockError(true);
                                                        setUnlockPin('');
                                                    }
                                                } else if (unlockPin.length < 4) {
                                                    setUnlockPin(prev => prev + btn);
                                                }
                                            }}
                                            className={`h-14 rounded-xl font-black text-lg transition-all ${btn === 'OK'
                                                ? (isLightTheme ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500 text-black hover:bg-green-400') + ' col-span-1 shadow-lg'
                                                : btn === 'C'
                                                    ? (isLightTheme ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')
                                                    : (isLightTheme ? 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-100' : 'bg-zinc-950 text-white hover:bg-zinc-800 border border-zinc-900')
                                                }`}
                                        >
                                            {btn}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowUnlockModal(false)}
                                    className={`text-xs font-black uppercase tracking-[0.2em] pt-4 transition-colors ${isLightTheme ? 'text-emerald-300 hover:text-emerald-600' : 'text-zinc-600 hover:text-white'}`}
                                >
                                    Annuler
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* ── Receipt Modal ── */}
            {
                completedSale && (
                    <POSReceiptModal
                        sale={completedSale}
                        storeName={storeName}
                        storeAddress={storeAddress}
                        storePhone={storePhone}
                        onClose={() => {
                            setCompletedSale(null);
                            setPosStep('client');
                            setSelectedCustomer(null);
                            setIsCartVisible(false);
                        }}
                        isLightTheme={isLightTheme}
                    />
                )
            }

            {
                showCustomerDetail && selectedCustomer && (
                    <POSCustomerDetailModal
                        customer={selectedCustomer}
                        onClose={() => setShowCustomerDetail(false)}
                        isLightTheme={isLightTheme}
                    />
                )
            }

            {
                showReportModal && reportData && (
                    <POSReportModal
                        reportData={reportData}
                        reportMode={reportMode}
                        onClose={() => setShowReportModal(false)}
                        onFinalizeClose={finalizeClose}
                        isLightTheme={isLightTheme}
                    />
                )
            }

            {
                showAIPreferences && selectedCustomerAIPreferences && selectedCustomer && (
                    <POSAIPreferencesModal
                        preferences={selectedCustomerAIPreferences}
                        customer={selectedCustomer}
                        defaultAddress={selectedCustomerDefaultAddress}
                        orderCount={selectedCustomerOrderCount}
                        onViewOrders={() => {
                            setShowAIPreferences(false);
                            setShowCustomerDetail(true);
                        }}
                        onClose={() => setShowAIPreferences(false)}
                        isLightTheme={isLightTheme}
                    />
                )
            }

            {/* Modals are handled above via imported components */}
            {/* Floating Cart Button Mobile */}
            {!showHistory && !isCartVisible && (
                <motion.button
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    onClick={() => setIsCartVisible(true)}
                    className={`fixed bottom-6 right-6 lg:hidden z-[100] w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${isLightTheme
                        ? 'bg-emerald-600 text-white shadow-emerald-500/40'
                        : 'bg-green-500 text-black shadow-green-500/40'
                        }`}
                >
                    <div className="relative">
                        <ShoppingCart className="w-7 h-7" />
                        {cart.length > 0 && (
                            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                {cart.reduce((s, l) => s + l.quantity, 0)}
                            </span>
                        )}
                    </div>
                </motion.button>
            )}
        </div>
    );
}

export default AdminPOSTab;
