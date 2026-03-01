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
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product, Category, Profile } from '../../lib/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CartLine {
    product: Product;
    quantity: number;
    unitPrice: number; // can be overridden
}

type PaymentMethod = 'cash' | 'card' | 'mobile';

interface CompletedSale {
    orderId: string;
    shortId: string;
    lines: CartLine[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    cashGiven?: number;
    change?: number;
    timestamp: Date;
}

interface DailyReport {
    totalSales: number;
    cashTotal: number;
    cardTotal: number;
    mobileTotal: number;
    itemsSold: number;
    orderCount: number;
    date: Date;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReceiptModal({
    sale,
    storeName,
    storeAddress,
    storePhone,
    onClose,
}: {
    sale: CompletedSale;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    onClose: () => void;
}) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML ?? '';
        const win = window.open('', '_blank', 'width=400,height=600');
        if (!win) return;
        win.document.write(`
      <html><head><title>Reçu</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: monospace; font-size: 13px; }
        body { padding: 16px; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .big { font-size: 16px; font-weight: bold; }
      </style></head>
      <body>${content}</body></html>
    `);
        win.document.close();
        win.print();
    };

    const pmLabel: Record<PaymentMethod, string> = {
        cash: 'Espèces',
        card: 'Carte bancaire',
        mobile: 'Paiement mobile',
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
                {/* Receipt printable zone */}
                <div ref={printRef} className="bg-white text-black rounded-xl p-4 mb-4 font-mono text-xs leading-relaxed">
                    <div className="center bold text-sm">{storeName}</div>
                    <div className="center">{storeAddress}</div>
                    <div className="center">{storePhone}</div>
                    <div className="divider" />
                    <div className="center">TICKET DE CAISSE</div>
                    <div className="center">{sale.timestamp.toLocaleString('fr-FR')}</div>
                    <div className="center">N° {sale.shortId}</div>
                    <div className="divider" />
                    {sale.lines.map((l, i) => (
                        <div key={i}>
                            <div className="row">
                                <span className="bold">{l.product.name}</span>
                            </div>
                            <div className="row">
                                <span>{l.quantity} × {l.unitPrice.toFixed(2)} €</span>
                                <span>{(l.quantity * l.unitPrice).toFixed(2)} €</span>
                            </div>
                        </div>
                    ))}
                    <div className="divider" />
                    <div className="row"><span>Sous-total</span><span>{sale.subtotal.toFixed(2)} €</span></div>
                    {sale.discount > 0 && (
                        <div className="row"><span>Remise</span><span>−{sale.discount.toFixed(2)} €</span></div>
                    )}
                    <div className="row big"><span>TOTAL</span><span>{sale.total.toFixed(2)} €</span></div>
                    <div className="divider" />
                    <div className="row"><span>Paiement</span><span>{pmLabel[sale.paymentMethod]}</span></div>
                    {sale.cashGiven != null && (
                        <>
                            <div className="row"><span>Reçu</span><span>{sale.cashGiven.toFixed(2)} €</span></div>
                            <div className="row bold"><span>Rendu</span><span>{(sale.change ?? 0).toFixed(2)} €</span></div>
                        </>
                    )}
                    <div className="divider" />
                    <div className="center">Merci pour votre visite !</div>
                    <div className="center">♻ Green Moon CBD</div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Nouvelle vente
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AdminPOSTabProps {
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
}

export default function AdminPOSTab({
    storeName = 'Green Moon CBD',
    storeAddress = '123 Rue de la Nature, 75000 Paris',
    storePhone = '01 23 45 67 89',
}: AdminPOSTabProps) {
    // ── Product catalogue ──
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<Profile[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    // ── Report ──
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState<DailyReport | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // ── Result ──
    const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

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

    useEffect(() => { loadProducts(); }, [loadProducts]);

    // ── Customer search ──
    useEffect(() => {
        const handler = setTimeout(async () => {
            if (customerSearch.length < 2) {
                setCustomerResults([]);
                return;
            }
            setIsSearchingCustomer(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .or(`full_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
                .limit(5);
            setCustomerResults((data as Profile[]) ?? []);
            setIsSearchingCustomer(false);
        }, 300);
        return () => clearTimeout(handler);
    }, [customerSearch]);

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
    const total = Math.max(0, subtotal - discount - loyaltyDiscount);
    const cashNum = parseFloat(cashGiven) || 0;
    const change = Math.max(0, cashNum - total);

    const filteredProducts = products.filter((p) => {
        const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
        const matchSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch && p.stock_quantity > 0;
    });

    // ── Cart actions ──
    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((l) => l.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_quantity) return prev;
                return prev.map((l) =>
                    l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
                );
            }
            return [...prev, { product, quantity: 1, unitPrice: product.price }];
        });
    };

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
        setCustomerSearch('');
        setUseLoyaltyPoints(false);
        setPointsToRedeem(0);
    };

    // ── Process sale ──
    const processSale = async () => {
        if (cart.length === 0) return;
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
                    promo_discount: discount + loyaltyDiscount,
                    promo_code: (discount > 0 || loyaltyDiscount > 0)
                        ? `POS-REMISE-${discount > 0 ? (discountType === 'percent' ? discountValue + '%' : discountValue + 'EUR') : ''}${loyaltyDiscount > 0 ? `-LOYALTY-${pointsToRedeem}PTS` : ''}`
                        : null,
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

            // 3. Decrement stock
            for (const line of cart) {
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
                total,
                paymentMethod,
                cashGiven: paymentMethod === 'cash' ? cashNum : undefined,
                change: paymentMethod === 'cash' ? change : undefined,
                timestamp: new Date(),
            };

            clearCart();
            setShowPaymentModal(false);
            setCompletedSale(sale);
            // Reload products to get updated stock
            loadProducts();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la vente. Vérifiez la console.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    id, total, notes, delivery_type,
                    order_items (quantity)
                `)
                .eq('delivery_type', 'in_store')
                .gte('created_at', startOfDay.toISOString());

            if (error) throw error;

            const report: DailyReport = {
                totalSales: 0,
                cashTotal: 0,
                cardTotal: 0,
                mobileTotal: 0,
                itemsSold: 0,
                orderCount: orders?.length || 0,
                date: new Date()
            };

            orders?.forEach(o => {
                report.totalSales += o.total;
                if (o.notes?.includes('Paiement: Espèces')) report.cashTotal += o.total;
                else if (o.notes?.includes('Paiement: Carte')) report.cardTotal += o.total;
                else if (o.notes?.includes('Paiement: Mobile')) report.mobileTotal += o.total;

                o.order_items?.forEach((item: any) => {
                    report.itemsSold += item.quantity;
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

    const pmOptions: { key: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
        { key: 'cash', label: 'Espèces', icon: Banknote, color: 'border-green-500 bg-green-900/20 text-green-400' },
        { key: 'card', label: 'Carte', icon: CreditCard, color: 'border-blue-500 bg-blue-900/20 text-blue-400' },
        { key: 'mobile', label: 'Mobile', icon: Smartphone, color: 'border-purple-500 bg-purple-900/20 text-purple-400' },
    ];

    return (
        <div className="h-[calc(100vh-180px)] flex gap-4 overflow-hidden">
            {/* ── LEFT: Product Grid ── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-3">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un produit…"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                    >
                        <option value="all">Toutes les catégories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={loadProducts}
                        className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-green-400 hover:border-green-500 transition-all text-sm"
                    >
                        ↻ Sync
                    </button>

                    <button
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport}
                        className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-yellow-400 hover:border-yellow-500 transition-all text-sm flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Rapport du jour
                    </button>
                </div>

                {/* Product grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start pr-1">
                    {isLoadingProducts ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-zinc-800/50 rounded-2xl h-36 animate-pulse" />
                        ))
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-zinc-600">
                            <Package className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">Aucun produit disponible</p>
                        </div>
                    ) : (
                        filteredProducts.map((product) => {
                            const inCart = cart.find((l) => l.product.id === product.id);
                            return (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className={`relative group flex flex-col p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${inCart
                                        ? 'border-green-500/60 bg-green-900/10'
                                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
                                        }`}
                                >
                                    {/* Product image */}
                                    {product.image_url ? (
                                        <div
                                            className="w-full h-20 rounded-xl bg-cover bg-center mb-2 shrink-0"
                                            style={{ backgroundImage: `url(${product.image_url})` }}
                                        />
                                    ) : (
                                        <div className="w-full h-20 rounded-xl bg-zinc-700 mb-2 flex items-center justify-center shrink-0">
                                            <Package className="w-8 h-8 text-zinc-500" />
                                        </div>
                                    )}
                                    <p className="text-xs font-semibold text-white truncate leading-tight">{product.name}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">Stock: {product.stock_quantity}</p>
                                    <p className="text-sm font-bold text-green-400 mt-1">{product.price.toFixed(2)} €</p>

                                    {inCart && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                                            {inCart.quantity}
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── RIGHT: Cart Panel ── */}
            <div className="w-80 shrink-0 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Customer Section */}
                <div className="px-3 py-3 border-b border-zinc-800 bg-zinc-800/30">
                    {!selectedCustomer ? (
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                <input
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    placeholder="Chercher client (Nom/Tél)…"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
                                />
                            </div>

                            {customerResults.length > 0 && (
                                <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-xl">
                                    {customerResults.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedCustomer(c);
                                                setCustomerSearch('');
                                                setCustomerResults([]);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 border-b border-zinc-800 last:border-0 transition-colors"
                                        >
                                            <p className="font-bold text-white">{c.full_name}</p>
                                            <p className="text-zinc-500">{c.phone || 'Pas de numéro'}</p>
                                            <p className="text-yellow-500/80 text-[10px]">{c.loyalty_points} pts</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 bg-green-900/10 border border-green-500/30 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{selectedCustomer.full_name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-400">{selectedCustomer.phone}</span>
                                        <span className="text-[10px] text-yellow-500 font-bold">{selectedCustomer.loyalty_points} pts</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedCustomer(null);
                                        setUseLoyaltyPoints(false);
                                        setPointsToRedeem(0);
                                    }}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Loyalty points redemption UI */}
                            {selectedCustomer.loyalty_points >= 100 && (
                                <div className="pt-2 border-t border-green-500/20">
                                    <label className="flex items-center justify-between cursor-pointer mb-2">
                                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Utiliser les points</span>
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
                                                    className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                                                />
                                                <span className="text-[10px] font-bold text-white w-12 text-right">
                                                    {pointsToRedeem} pts
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-zinc-500">Valeur: {(pointsToRedeem / 100).toFixed(2)} €</span>
                                                <button
                                                    onClick={() => setPointsToRedeem(Math.max(100, Math.min(selectedCustomer.loyalty_points, Math.floor((subtotal - discount) * 100))))}
                                                    className="text-green-400 hover:underline"
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
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-bold text-white">Vente en cours</span>
                        {cart.length > 0 && (
                            <span className="text-[10px] bg-green-500 text-black font-bold rounded-full px-1.5 py-0.5">
                                {cart.reduce((s, l) => s + l.quantity, 0)}
                            </span>
                        )}
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                    <AnimatePresence>
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
                                <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-xs">Panier vide</p>
                                <p className="text-[10px] text-zinc-700 mt-1">Cliquez sur un produit pour ajouter</p>
                            </div>
                        ) : (
                            cart.map((line) => (
                                <motion.div
                                    key={line.product.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-zinc-800 rounded-xl p-2.5"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <p className="text-xs font-semibold text-white leading-tight flex-1 truncate">
                                            {line.product.name}
                                        </p>
                                        <button
                                            onClick={() => removeLine(line.product.id)}
                                            className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Qty controls */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => updateQty(line.product.id, -1)}
                                                className="w-6 h-6 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition-colors"
                                            >
                                                <Minus className="w-3 h-3 text-zinc-300" />
                                            </button>
                                            <span className="text-xs text-white font-bold w-5 text-center">{line.quantity}</span>
                                            <button
                                                onClick={() => updateQty(line.product.id, 1)}
                                                disabled={line.quantity >= line.product.stock_quantity}
                                                className="w-6 h-6 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 flex items-center justify-center transition-colors"
                                            >
                                                <Plus className="w-3 h-3 text-zinc-300" />
                                            </button>
                                        </div>

                                        {/* Price override */}
                                        <div className="flex-1 relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500">€</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.unitPrice}
                                                onChange={(e) => updatePrice(line.product.id, e.target.value)}
                                                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-5 pr-2 py-1 text-xs text-white focus:outline-none focus:border-green-500 transition-colors"
                                            />
                                        </div>

                                        <span className="text-xs font-bold text-green-400 shrink-0">
                                            {(line.quantity * line.unitPrice).toFixed(2)} €
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Discount + Totals */}
                <div className="border-t border-zinc-800 px-3 py-3 space-y-2">
                    {/* Discount row */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDiscountType((t) => (t === 'percent' ? 'fixed' : 'percent'))}
                            className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-green-500 transition-colors"
                        >
                            {discountType === 'percent' ? (
                                <Percent className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                        </button>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={discountType === 'percent' ? 'Remise en %' : 'Remise en €'}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 text-xs text-zinc-400">
                        <div className="flex justify-between">
                            <span>Sous-total</span>
                            <span>{subtotal.toFixed(2)} €</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-orange-400">
                                <span>Remise ({discountType === 'percent' ? `${discountValue}%` : `${discountValue}€`})</span>
                                <span>−{discount.toFixed(2)} €</span>
                            </div>
                        )}
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-yellow-500 font-medium">
                                <span>Points Fidélité ({pointsToRedeem} pts)</span>
                                <span>−{loyaltyDiscount.toFixed(2)} €</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-zinc-700">
                            <span>TOTAL</span>
                            <span className="text-green-400">{total.toFixed(2)} €</span>
                        </div>
                    </div>

                    {/* Pay button */}
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={cart.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-3 rounded-xl transition-all text-sm"
                    >
                        <CreditCard className="w-4 h-4" />
                        Encaisser {cart.length > 0 ? `${total.toFixed(2)} €` : ''}
                    </button>
                </div>
            </div>

            {/* ── Payment Modal ── */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-white">Encaissement</h2>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Total to pay */}
                            <div className="bg-zinc-800 rounded-2xl p-5 mb-5 text-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Montant à encaisser</p>
                                <p className="text-4xl font-bold text-green-400">{total.toFixed(2)} €</p>
                            </div>

                            {/* Payment method */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {pmOptions.map((pm) => (
                                    <button
                                        key={pm.key}
                                        onClick={() => setPaymentMethod(pm.key)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${paymentMethod === pm.key
                                            ? pm.color
                                            : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-600'
                                            }`}
                                    >
                                        <pm.icon className="w-6 h-6" />
                                        <span className="text-xs font-semibold">{pm.label}</span>
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
                                        <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                                            <div>
                                                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">
                                                    Montant reçu (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min={total}
                                                    placeholder={`Min. ${total.toFixed(2)}`}
                                                    value={cashGiven}
                                                    onChange={(e) => setCashGiven(e.target.value)}
                                                    className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-green-500 transition-colors"
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
                                                            className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded-lg py-2 text-xs font-bold text-zinc-300 transition-colors"
                                                        >
                                                            {v.toFixed(0)} €
                                                        </button>
                                                    ))}
                                            </div>

                                            {cashNum >= total && (
                                                <div className="flex items-center justify-between bg-green-900/20 border border-green-800 rounded-xl px-4 py-3">
                                                    <span className="text-sm text-green-400 font-medium">Monnaie à rendre</span>
                                                    <span className="text-xl font-bold text-green-400">{change.toFixed(2)} €</span>
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
                                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-3.5 rounded-xl transition-all text-sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCcw className="w-4 h-4 animate-spin" />
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

            {/* ── Receipt Modal ── */}
            {completedSale && (
                <ReceiptModal
                    sale={completedSale}
                    storeName={storeName}
                    storeAddress={storeAddress}
                    storePhone={storePhone}
                    onClose={() => setCompletedSale(null)}
                />
            )}

            {/* ── Daily Report Modal ── */}
            {showReportModal && reportData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Rapport de Clôture</h2>
                                        <p className="text-xs text-zinc-500">Synthèse du {reportData.date.toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-800">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Ventes Totales</p>
                                        <p className="text-2xl font-black text-white">{reportData.totalSales.toFixed(2)} €</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-800">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Commandes</p>
                                        <p className="text-2xl font-black text-white">{reportData.orderCount}</p>
                                    </div>
                                </div>

                                <div className="bg-zinc-800/30 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="w-4 h-4 text-green-400" />
                                            <span className="text-sm text-zinc-300">Espèces</span>
                                        </div>
                                        <span className="text-sm font-bold text-white">{reportData.cashTotal.toFixed(2)} €</span>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm text-zinc-300">Carte Bancaire</span>
                                        </div>
                                        <span className="text-sm font-bold text-white">{reportData.cardTotal.toFixed(2)} €</span>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm text-zinc-300">Mobile</span>
                                        </div>
                                        <span className="text-sm font-bold text-white">{reportData.mobileTotal.toFixed(2)} €</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-800 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Articles vendus</p>
                                        <p className="text-lg font-bold text-white">{reportData.itemsSold} unités</p>
                                    </div>
                                    <Package className="w-8 h-8 text-zinc-700" />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-5 h-5" />
                                    Imprimer
                                </button>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-2xl transition-all"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

// Missing import fix
function RefreshCcw({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
        </svg>
    );
}
