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
import { CartLine, PaymentMethod, AppliedPromo, CompletedSale, DailyReport } from './pos/types';
import { UserAIPreferences } from '../../lib/types';

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
    const [showAIPreferences, setShowAIPreferences] = useState(false);

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

    // ── AI Preferences Fetch ──
    useEffect(() => {
        if (selectedCustomer) {
            const fetchPrefs = async () => {
                const { data } = await supabase
                    .from('user_ai_preferences')
                    .select('*')
                    .eq('user_id', selectedCustomer.id)
                    .maybeSingle();
                setSelectedCustomerAIPreferences(data);
            };
            fetchPrefs();
        } else {
            setSelectedCustomerAIPreferences(null);
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

    const pmOptions: { key: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
        { key: 'cash', label: 'Espèces', icon: Banknote, color: 'border-green-500 bg-green-900/20 text-green-400' },
        { key: 'card', label: 'Carte', icon: CreditCard, color: 'border-blue-500 bg-blue-900/20 text-blue-400' },
        { key: 'mobile', label: 'Mobile', icon: Smartphone, color: 'border-purple-500 bg-purple-900/20 text-purple-400' },
    ];

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <div className={`h-full flex flex-col gap-4 overflow-hidden relative transition-colors duration-500 ${isLightTheme ? 'bg-emerald-50/50' : ''}`}>
            {/* ── TOP: Professional Header ── */}
            <header className={`relative z-50 flex items-center gap-6 px-6 py-4 backdrop-blur-xl border rounded-3xl shrink-0 shadow-2xl transition-all ${isLightTheme
                ? 'bg-white/90 border-emerald-100 shadow-emerald-200/50'
                : 'bg-zinc-900/80 border-zinc-800 shadow-black/50'
                }`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-black shadow-[0_0_20px_rgba(57,255,20,0.3)]">
                        <ShoppingCart className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className={`text-xl font-black tracking-tight uppercase ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Green Mood POS</h1>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-[0.2em]">Système de Vente Directe</p>
                    </div>
                </div>

                <div className={`h-10 w-px mx-2 ${isLightTheme ? 'bg-emerald-100' : 'bg-zinc-800'}`} />

                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <span className={`text-[10px] uppercase font-black tracking-widest mb-0.5 ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Ventes du jour</span>
                        <span className={`text-2xl font-black leading-none ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>{todayTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-[10px] uppercase font-black tracking-widest mb-0.5 ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Session</span>
                        <span className={`text-2xl font-black leading-none ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>{cart.length} <span className={isLightTheme ? 'text-emerald-200' : 'text-zinc-600'}>art.</span></span>
                    </div>

                    {selectedCustomer && selectedCustomerAIPreferences && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setShowAIPreferences(true)}
                            className={`flex flex-col items-center px-4 py-2 rounded-2xl border transition-all ${isLightTheme
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}
                        >
                            <span className={`text-[8px] uppercase font-black tracking-widest mb-0.5 ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`}>AI Profile</span>
                            <div className="flex items-center gap-1.5">
                                <Brain className="w-4 h-4" />
                                <span className={`text-xs font-black transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Optimisé</span>
                            </div>
                        </motion.button>
                    )}
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-3">
                    {onExit && (
                        <button
                            onClick={onExit}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all group border ${isLightTheme
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500'}`}
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Quitter
                        </button>
                    )}
                    <button
                        onClick={toggleFullScreen}
                        className={`p-3 rounded-2xl transition-all group border ${isLightTheme
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-400 hover:text-emerald-600'
                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}`}
                        title="Plein écran"
                    >
                        <Maximize className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={() => setIsLightTheme(!isLightTheme)}
                        className={`p-3 border rounded-2xl transition-all group ${isLightTheme
                            ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-200'
                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                            }`}
                        title={isLightTheme ? "Thème Sombre" : "Thème Clair"}
                    >
                        {isLightTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={loadProducts}
                        className={`p-3 rounded-2xl transition-all group border ${isLightTheme
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-400 hover:text-green-600 hover:border-green-500'
                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-green-500 hover:border-green-500/50'}`}
                        title="Actualiser"
                    >
                        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                    {/* ── Admin Menu (Discreet) ── */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAdminMenu(!showAdminMenu)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all border ${showAdminMenu
                                ? (isLightTheme ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-white')
                                : (isLightTheme ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700 hover:text-zinc-300')
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            Gestion
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showAdminMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={`absolute right-0 mt-3 w-56 border rounded-2xl shadow-2xl overflow-hidden z-[110] transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border border-zinc-800'}`}
                                >
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                setShowHistory(!showHistory);
                                                setShowAdminMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isLightTheme ? 'text-emerald-900 hover:bg-emerald-50' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                                        >
                                            <HistoryIcon className="w-4 h-4" />
                                            {showHistory ? 'Retour Catalogue' : 'Historique Ventes'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleGenerateReport('view');
                                                setShowAdminMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isLightTheme ? 'text-emerald-900 hover:bg-emerald-50' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                                        >
                                            <FileText className="w-4 h-4" />
                                            Lecture X (Provisoire)
                                        </button>
                                        <div className={`h-px my-1 transition-colors ${isLightTheme ? 'bg-emerald-100' : 'bg-zinc-800'}`} />
                                        <button
                                            onClick={() => {
                                                handleGenerateReport('close');
                                                setShowAdminMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <Lock className="w-4 h-4" />
                                            Clôture Z (Définitive)
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
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

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative">

                {/* ── LEFT: Category Sidebar REMOVED (Now using central Category Grid) ── */}

                {/* ── CENTER: Main Content ── */}
                <div className={`flex-1 flex flex-col min-w-0 overflow-hidden border rounded-[2.5rem] p-6 transition-all ${isLightTheme
                    ? 'bg-white border-emerald-100 shadow-xl shadow-emerald-100/20'
                    : 'bg-zinc-900/30 border-zinc-800'
                    }`}>
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
                {!showHistory && (
                    <div className={`w-80 shrink-0 flex flex-col border rounded-2xl overflow-hidden shadow-2xl transition-all ${isLightTheme
                        ? 'bg-white border-emerald-100 shadow-emerald-100/30'
                        : 'bg-zinc-900 border border-zinc-800 shadow-black/50'
                        }`}>
                        {/* Customer Section */}
                        <div className={`px-3 py-3 border-b transition-all ${isLightTheme ? 'bg-emerald-50 border-emerald-100' : 'bg-zinc-800/30 border-zinc-800'}`}>
                            {!selectedCustomer ? (
                                <div className="text-center py-2">
                                    <p className={`text-xs font-bold mb-2 ${isLightTheme ? 'text-emerald-700/60' : 'text-zinc-500'}`}>Vente sans client</p>
                                    <button
                                        onClick={() => setPosStep('client')}
                                        className={`text-[10px] px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1 mx-auto ${isLightTheme
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                                            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                                            }`}
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        Identifier un client
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className={`flex items-center justify-between rounded-lg p-2.5 transition-all ${isLightTheme ? 'bg-white border border-emerald-100 shadow-sm' : 'bg-zinc-800 border border-zinc-700'}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className={`font-bold text-xs transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>{selectedCustomer.full_name}</p>
                                                <button
                                                    onClick={() => setShowCustomerDetail(true)}
                                                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isLightTheme ? 'bg-emerald-100/50 hover:bg-emerald-100 text-emerald-600' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}
                                                    title="Détails client"
                                                >
                                                    <span className="text-[10px] font-bold">i</span>
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className={`text-[10px] transition-colors ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>{selectedCustomer.phone || 'Pas de numéro'}</p>
                                                <span className={`font-bold text-[9px] px-1.5 rounded transition-colors ${isLightTheme ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                    ★ {selectedCustomer.loyalty_points} pts
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setUseLoyaltyPoints(false);
                                                setPointsToRedeem(0);
                                                setPosStep('client');
                                            }}
                                            className="text-zinc-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Loyalty points redemption UI */}
                                    {selectedCustomer.loyalty_points >= 100 && (
                                        <div className={`pt-2 border-t mt-2 transition-all ${isLightTheme ? 'border-emerald-100' : 'border-green-500/20'}`}>
                                            <label className="flex items-center justify-between cursor-pointer mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isLightTheme ? 'text-emerald-900' : 'text-zinc-300'}`}>Utiliser les points</span>
                                                <input
                                                    type="checkbox"
                                                    checked={useLoyaltyPoints}
                                                    onChange={(e) => {
                                                        setUseLoyaltyPoints(e.target.checked);
                                                        if (e.target.checked) {
                                                            const maxRedeemable = Math.min(selectedCustomer.loyalty_points, Math.floor((subtotal - discount) * 100));
                                                            setPointsToRedeem(maxRedeemable >= 100 ? 100 : 0);
                                                        } else {
                                                            setPointsToRedeem(0);
                                                        }
                                                    }}
                                                    className="w-3.5 h-3.5 accent-green-500"
                                                />
                                            </label>

                                            {useLoyaltyPoints && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="range"
                                                            min="100"
                                                            max={Math.max(100, Math.min(selectedCustomer.loyalty_points, Math.floor((subtotal - discount) * 100)))}
                                                            step="100"
                                                            value={pointsToRedeem}
                                                            onChange={(e) => setPointsToRedeem(parseInt(e.target.value))}
                                                            className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-green-600 transition-all ${isLightTheme ? 'bg-emerald-100' : 'bg-zinc-700'}`}
                                                        />
                                                        <span className={`text-[10px] font-bold w-12 text-right transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                                            {pointsToRedeem} pts
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className={`transition-colors ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Valeur: {(pointsToRedeem / 100).toFixed(2)} €</span>
                                                        <button
                                                            onClick={() => setPointsToRedeem(Math.max(100, Math.min(selectedCustomer.loyalty_points, Math.floor((subtotal - discount) * 100))))}
                                                            className="text-green-600 hover:text-green-700 hover:underline font-bold"
                                                        >
                                                            Max
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cart header */}
                        <div className={`px-4 py-3 border-b flex items-center justify-between transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-transparent border-zinc-800'}`}>
                            <div className="flex items-center gap-2">
                                <ShoppingCart className={`w-4 h-4 ${isLightTheme ? 'text-emerald-600' : 'text-green-400'}`} />
                                <span className={`text-sm font-bold transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Vente en cours</span>
                                {cart.length > 0 && (
                                    <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 transition-colors ${isLightTheme ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-green-500 text-black'}`}>
                                        {cart.reduce((s, l) => s + l.quantity, 0)}
                                    </span>
                                )}
                            </div>
                            {cart.length > 0 && (
                                <button
                                    onClick={clearCart}
                                    className={`transition-colors ${isLightTheme ? 'text-emerald-200 hover:text-red-500' : 'text-zinc-600 hover:text-red-400'}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className={`flex-1 overflow-y-auto px-3 py-2 space-y-2 transition-all ${isLightTheme ? 'bg-emerald-50/20' : ''}`}>
                            <AnimatePresence>
                                {cart.length === 0 ? (
                                    <div className={`flex flex-col items-center justify-center h-32 transition-colors ${isLightTheme ? 'text-emerald-200' : 'text-zinc-600'}`}>
                                        <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
                                        <p className="text-xs">Panier vide</p>
                                        <p className={`text-[10px] mt-1 ${isLightTheme ? 'text-emerald-100' : 'text-zinc-700'}`}>Cliquez sur un produit pour ajouter</p>
                                    </div>
                                ) : (
                                    cart.map((line) => (
                                        <motion.div
                                            key={line.product.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className={`rounded-xl p-2.5 transition-all ${isLightTheme ? 'bg-white border border-emerald-100 shadow-sm' : 'bg-zinc-800'}`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <p className={`text-xs font-bold leading-tight transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>
                                                        {line.product.name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {[1, 5, 10, 30, 50, 100].map(weight => (
                                                            <button
                                                                key={weight}
                                                                onClick={() => {
                                                                    const val = Math.min(weight, line.product.stock_quantity);
                                                                    setCart(prev => prev.map(l => l.product.id === line.product.id ? { ...l, quantity: val } : l));
                                                                }}
                                                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border transition-all ${line.quantity === weight
                                                                    ? (isLightTheme ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-green-500 border-green-400 text-black')
                                                                    : (isLightTheme ? 'bg-emerald-50 border-emerald-100 text-emerald-400 hover:border-emerald-300' : 'bg-zinc-700/50 border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500')
                                                                    }`}
                                                            >
                                                                {weight}g
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeLine(line.product.id)}
                                                    className={`transition-colors shrink-0 mt-0.5 ${isLightTheme ? 'text-emerald-200 hover:text-red-500' : 'text-zinc-600 hover:text-red-400'}`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Qty controls */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => updateQty(line.product.id, -1)}
                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-sm ${isLightTheme ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={line.quantity}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setCart(prev => prev.map(l => l.product.id === line.product.id ? { ...l, quantity: Math.min(val, l.product.stock_quantity) } : l));
                                                            }}
                                                            className={`w-10 rounded-lg text-xs font-black text-center py-1 focus:outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isLightTheme
                                                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-950 focus:border-green-500'
                                                                : 'bg-zinc-700 border border-zinc-600 text-white focus:border-green-500'
                                                                }`}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => updateQty(line.product.id, 1)}
                                                        disabled={line.quantity >= line.product.stock_quantity}
                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-sm ${isLightTheme ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-30' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300 disabled:opacity-40'}`}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <span className={`text-[10px] font-bold ml-1 transition-colors ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`}>g</span>
                                                </div>

                                                {/* Price override */}
                                                <div className="flex-1 relative">
                                                    <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs transition-colors ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`}>€</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={line.unitPrice}
                                                        onChange={(e) => updatePrice(line.product.id, e.target.value)}
                                                        className={`w-full rounded-lg pl-5 pr-2 py-1 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-green-500/20 ${isLightTheme
                                                            ? 'bg-emerald-50 border border-emerald-100 text-emerald-950 focus:border-green-500'
                                                            : 'bg-zinc-700 border border-zinc-600 text-white focus:border-green-500'
                                                            }`}
                                                    />
                                                </div>

                                                <span className={`text-xs font-bold shrink-0 transition-colors ${isLightTheme ? 'text-green-600' : 'text-green-400'}`}>
                                                    {(line.quantity * line.unitPrice).toFixed(2)} €
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Discount + Totals */}
                        <div className={`border-t px-3 py-3 space-y-2 transition-all ${isLightTheme ? 'bg-emerald-50/20 border-emerald-100' : 'border-zinc-800'}`}>
                            {/* Discount row */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setDiscountType((t) => (t === 'percent' ? 'fixed' : 'percent'))}
                                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${isLightTheme ? 'bg-white border-emerald-100 text-emerald-400 hover:border-green-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-green-500'}`}
                                >
                                    {discountType === 'percent' ? (
                                        <Percent className="w-3.5 h-3.5" />
                                    ) : (
                                        <Hash className="w-3.5 h-3.5" />
                                    )}
                                </button>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={discountType === 'percent' ? 'Remise en %' : 'Remise en €'}
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className={`flex-1 border rounded-lg px-3 py-1.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-green-500/20 ${isLightTheme
                                        ? 'bg-white border-emerald-100 text-emerald-950 placeholder-emerald-200 focus:border-green-500'
                                        : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 focus:border-green-500'}`}
                                />
                            </div>

                            {/* Promo code */}
                            {!appliedPromo ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="relative flex-1">
                                            <Tag className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors ${isLightTheme ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                            <input
                                                value={promoInput}
                                                onChange={(e) => {
                                                    setPromoInput(e.target.value.toUpperCase());
                                                    setPromoError('');
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                                                placeholder="Code promo…"
                                                className={`w-full border rounded-lg pl-7 pr-2 py-1.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-green-500/20 uppercase ${isLightTheme
                                                    ? 'bg-white border-emerald-100 text-emerald-950 placeholder-emerald-200 focus:border-green-500'
                                                    : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 focus:border-green-500'}`}
                                            />
                                        </div>
                                        <button
                                            onClick={handleApplyPromo}
                                            disabled={!promoInput.trim() || isCheckingPromo}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${isLightTheme
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 shadow-md shadow-emerald-200'
                                                : 'bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-white'}`}
                                        >
                                            {isCheckingPromo ? '…' : 'OK'}
                                        </button>
                                    </div>
                                    {promoError && (
                                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider pl-1">{promoError}</p>
                                    )}
                                </div>
                            ) : (
                                <div className={`flex items-center justify-between border rounded-lg px-2.5 py-1.5 transition-all ${isLightTheme ? 'bg-emerald-50 border-emerald-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
                                    <div className="flex items-center gap-1.5">
                                        <Tag className={`w-3 h-3 shrink-0 ${isLightTheme ? 'text-emerald-700' : 'text-green-400'}`} />
                                        <span className={`text-xs font-bold transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-green-400'}`}>{appliedPromo.code}</span>
                                        <span className={`text-[10px] transition-colors ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-400'}`}>−{appliedPromo.discount_amount.toFixed(2)} €</span>
                                    </div>
                                    <button
                                        onClick={() => { setAppliedPromo(null); setPromoInput(''); }}
                                        className={`transition-colors ${isLightTheme ? 'text-emerald-200 hover:text-red-500' : 'text-zinc-500 hover:text-red-400'}`}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {/* Totals */}
                            <div className={`space-y-1 text-xs transition-colors ${isLightTheme ? 'text-emerald-900/60' : 'text-zinc-400'}`}>
                                <div className="flex justify-between">
                                    <span>Sous-total</span>
                                    <span className={isLightTheme ? 'text-emerald-950 font-medium' : 'text-white'}>{subtotal.toFixed(2)} €</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-orange-500 font-bold">
                                        <span>Remise ({discountType === 'percent' ? `${discountValue}%` : `${discountValue}€`})</span>
                                        <span>−{discount.toFixed(2)} €</span>
                                    </div>
                                )}
                                {promoDiscount > 0 && (
                                    <div className={`flex justify-between font-bold ${isLightTheme ? 'text-green-600' : 'text-green-400'}`}>
                                        <span>Promo ({appliedPromo?.code})</span>
                                        <span>−{promoDiscount.toFixed(2)} €</span>
                                    </div>
                                )}
                                {loyaltyDiscount > 0 && (
                                    <div className={`flex justify-between font-bold ${isLightTheme ? 'text-amber-600' : 'text-yellow-500'}`}>
                                        <span>Points Fidélité ({pointsToRedeem} pts)</span>
                                        <span>−{loyaltyDiscount.toFixed(2)} €</span>
                                    </div>
                                )}
                                {selectedCustomer && cart.length > 0 && (
                                    <div className={`flex justify-between italic font-black text-[10px] uppercase tracking-wider ${isLightTheme ? 'text-emerald-400' : 'text-blue-400'}`}>
                                        <span>Points à gagner</span>
                                        <span>+{Math.floor(total)} pts</span>
                                    </div>
                                )}
                                <div className={`flex justify-between text-base font-black pt-1 border-t transition-all ${isLightTheme ? 'text-emerald-950 border-emerald-100' : 'text-white border-zinc-700'}`}>
                                    <span>TOTAL</span>
                                    <span className={isLightTheme ? 'text-green-700' : 'text-green-400'}>{total.toFixed(2)} €</span>
                                </div>
                            </div>

                            {/* Pay button */}
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                disabled={cart.length === 0}
                                className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-xl transition-all text-sm uppercase tracking-widest ${isLightTheme
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 disabled:bg-emerald-50 disabled:text-emerald-200 disabled:shadow-none'
                                    : 'bg-green-500 hover:bg-green-400 text-black disabled:bg-zinc-700 disabled:text-zinc-500'
                                    }`}
                            >
                                <CreditCard className="w-5 h-5" />
                                Encaisser {cart.length > 0 ? `${total.toFixed(2)} €` : ''}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Payment Modal ── */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`border rounded-2xl p-6 w-full max-w-md shadow-2xl transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border border-zinc-700'}`}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className={`text-lg font-bold transition-colors ${isLightTheme ? 'text-emerald-950' : 'text-white'}`}>Encaissement</h2>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className={`transition-colors ${isLightTheme ? 'text-emerald-300 hover:text-emerald-600' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Total to pay */}
                            <div className={`rounded-2xl p-5 mb-5 text-center transition-all ${isLightTheme ? 'bg-emerald-50 border border-emerald-100' : 'bg-zinc-800'}`}>
                                <p className={`text-[10px] uppercase tracking-widest mb-1 font-black ${isLightTheme ? 'text-emerald-600/60' : 'text-zinc-500'}`}>Montant à encaisser</p>
                                <p className={`text-4xl font-black ${isLightTheme ? 'text-green-700' : 'text-green-400'}`}>{total.toFixed(2)} €</p>
                            </div>

                            {/* Payment method */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {pmOptions.map((pm) => (
                                    <button
                                        key={pm.key}
                                        onClick={() => setPaymentMethod(pm.key)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${paymentMethod === pm.key
                                            ? (isLightTheme && pm.key === 'card' ? 'bg-blue-600 border-blue-500 text-white'
                                                : isLightTheme && pm.key === 'cash' ? 'bg-emerald-600 border-emerald-500 text-white'
                                                    : isLightTheme && pm.key === 'mobile' ? 'bg-purple-600 border-purple-500 text-white'
                                                        : pm.color)
                                            : (isLightTheme ? 'border-emerald-100 bg-emerald-50 text-emerald-400 hover:border-emerald-300' : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-600')
                                            }`}
                                    >
                                        <pm.icon className="w-6 h-6" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{pm.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Cash given field */}
                            <AnimatePresence>
                                {paymentMethod === 'cash' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden mb-5"
                                    >
                                        <div className={`rounded-xl p-4 space-y-3 transition-all ${isLightTheme ? 'bg-emerald-50' : 'bg-zinc-800'}`}>
                                            <div>
                                                <label className={`text-[10px] uppercase font-black tracking-widest mb-1.5 block ${isLightTheme ? 'text-emerald-700/60' : 'text-zinc-400'}`}>
                                                    Montant reçu (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min={total}
                                                    placeholder={`Min. ${total.toFixed(2)}`}
                                                    value={cashGiven}
                                                    onChange={(e) => setCashGiven(e.target.value)}
                                                    className={`w-full rounded-xl px-4 py-3 text-xl font-black transition-all focus:outline-none ${isLightTheme
                                                        ? 'bg-white border border-emerald-100 text-emerald-950 focus:border-green-500'
                                                        : 'bg-zinc-700 border border-zinc-600 text-white focus:border-green-500'}`}
                                                />
                                            </div>

                                            {/* Quick amounts */}
                                            <div className="flex gap-2 flex-wrap">
                                                {[
                                                    Math.ceil(total),
                                                    Math.ceil(total / 5) * 5,
                                                    Math.ceil(total / 10) * 10,
                                                    Math.ceil(total / 20) * 20,
                                                    50,
                                                ]
                                                    .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                                                    .slice(0, 4)
                                                    .map((v) => (
                                                        <button
                                                            key={v}
                                                            onClick={() => setCashGiven(v.toFixed(2))}
                                                            className={`flex-1 rounded-lg py-2 text-[10px] font-black transition-all ${isLightTheme
                                                                ? 'bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}
                                                        >
                                                            {v.toFixed(0)} €
                                                        </button>
                                                    ))}
                                            </div>

                                            {cashNum >= total && (
                                                <div className={`flex items-center justify-between border rounded-xl px-4 py-3 transition-all ${isLightTheme ? 'bg-white border-green-500/20' : 'bg-green-900/20 border-green-800'}`}>
                                                    <span className={`text-sm font-black uppercase tracking-tight ${isLightTheme ? 'text-green-700' : 'text-green-400'}`}>Monnaie à rendre</span>
                                                    <span className={`text-xl font-black ${isLightTheme ? 'text-green-700' : 'text-green-400'}`}>{change.toFixed(2)} €</span>
                                                </div>
                                            )}

                                            {cashNum > 0 && cashNum < total && (
                                                <div className="flex items-center gap-2 text-red-400 text-xs">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Montant insuffisant ({(total - cashNum).toFixed(2)} € manquant)
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Confirm */}
                            <button
                                onClick={processSale}
                                disabled={
                                    isProcessing ||
                                    (paymentMethod === 'cash' && (cashNum < total || cashNum === 0))
                                }
                                className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-xl transition-all text-sm uppercase tracking-[0.2em] ${isLightTheme
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 disabled:bg-emerald-50 disabled:text-emerald-200'
                                    : 'bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black'
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RotateCcw className="w-4 h-4 animate-spin" />
                                        Traitement…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Valider la vente
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                                    if (unlockPin === '0606') {
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
            {completedSale && (
                <POSReceiptModal
                    sale={completedSale}
                    storeName={storeName}
                    storeAddress={storeAddress}
                    storePhone={storePhone}
                    onClose={() => setCompletedSale(null)}
                    isLightTheme={isLightTheme}
                />
            )}

            {showCustomerDetail && selectedCustomer && (
                <POSCustomerDetailModal
                    customer={selectedCustomer}
                    onClose={() => setShowCustomerDetail(false)}
                    isLightTheme={isLightTheme}
                />
            )}

            {showReportModal && reportData && (
                <POSReportModal
                    reportData={reportData}
                    reportMode={reportMode}
                    onClose={() => setShowReportModal(false)}
                    onFinalizeClose={finalizeClose}
                    isLightTheme={isLightTheme}
                />
            )}

            {showAIPreferences && selectedCustomerAIPreferences && (
                <POSAIPreferencesModal
                    preferences={selectedCustomerAIPreferences}
                    onClose={() => setShowAIPreferences(false)}
                    isLightTheme={isLightTheme}
                />
            )}

            {/* Modals are handled above via imported components */}
        </div>
    );
};

export default AdminPOSTab;
