import { useState, useEffect } from 'react';
import type { ElementType } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Edit3,
  ChevronDown,
  ChevronUp,
  Save,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Order, StockMovement } from '../lib/types';
import SEO from '../components/SEO';

type Tab = 'products' | 'orders' | 'stock';

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payé' },
  { value: 'processing', label: 'En préparation' },
  { value: 'ready', label: 'Prêt à retirer' },
  { value: 'shipped', label: 'En livraison' },
  { value: 'delivered', label: 'Livré' },
  { value: 'cancelled', label: 'Annulé' },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productEdits, setProductEdits] = useState<Partial<Product>>({});
  const [stockAdjust, setStockAdjust] = useState<{ id: string; qty: string; note: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setIsLoading(true);
    if (tab === 'products') {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('name');
      setProducts((data as Product[]) ?? []);
    } else if (tab === 'orders') {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      setOrders((data as Order[]) ?? []);
    } else if (tab === 'stock') {
      const { data } = await supabase
        .from('stock_movements')
        .select('*, product:products(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      setMovements((data as StockMovement[]) ?? []);
    }
    setIsLoading(false);
  };

  const handleSaveProduct = async (id: string) => {
    setIsSaving(true);
    await supabase.from('products').update(productEdits).eq('id', id);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...productEdits } : p)));
    setEditingProduct(null);
    setProductEdits({});
    setIsSaving(false);
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as Order['status'] } : o)));
  };

  const handleStockAdjust = async () => {
    if (!stockAdjust) return;
    const qty = parseInt(stockAdjust.qty);
    if (isNaN(qty) || qty === 0) return;

    setIsSaving(true);
    const product = products.find((p) => p.id === stockAdjust.id);
    if (!product) return;

    const newStock = Math.max(0, product.stock_quantity + qty);
    await supabase.from('products').update({ stock_quantity: newStock }).eq('id', stockAdjust.id);
    await supabase.from('stock_movements').insert({
      product_id: stockAdjust.id,
      quantity_change: qty,
      type: 'adjustment',
      note: stockAdjust.note || `Ajustement manuel`,
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === stockAdjust.id ? { ...p, stock_quantity: newStock } : p))
    );
    setStockAdjust(null);
    setIsSaving(false);
  };

  const tabs: { key: Tab; label: string; icon: ElementType }[] = [
    { key: 'products', label: 'Produits', icon: ShoppingBag },
    { key: 'orders', label: 'Commandes', icon: Package },
    { key: 'stock', label: 'Mouvements stock', icon: TrendingUp },
  ];

  return (
    <>
      <SEO title="Administration — Green Moon CBD" description="Panel d'administration Green Moon." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-bold">Administration</h1>
          <button
            onClick={loadData}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-green-primary text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-green-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* PRODUCTS TAB */}
            {tab === 'products' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="pb-3 pr-4">Produit</th>
                      <th className="pb-3 pr-4">Prix</th>
                      <th className="pb-3 pr-4">Stock</th>
                      <th className="pb-3 pr-4">Disponible</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {products.map((product) => (
                      <>
                        <tr key={product.id} className="py-4">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image_url ?? ''}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg"
                              />
                              <div>
                                <p className="font-medium text-white text-sm">{product.name}</p>
                                <p className="text-xs text-zinc-500">{(product.category as { name?: string })?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-white">
                            {editingProduct === product.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={productEdits.price ?? product.price}
                                onChange={(e) =>
                                  setProductEdits({ ...productEdits, price: parseFloat(e.target.value) })
                                }
                                className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-green-primary"
                              />
                            ) : (
                              `${product.price.toFixed(2)} €`
                            )}
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              {editingProduct === product.id ? (
                                <input
                                  type="number"
                                  value={productEdits.stock_quantity ?? product.stock_quantity}
                                  onChange={(e) =>
                                    setProductEdits({ ...productEdits, stock_quantity: parseInt(e.target.value) })
                                  }
                                  className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-green-primary"
                                />
                              ) : (
                                <span className={product.stock_quantity === 0 ? 'text-red-400' : product.stock_quantity <= 5 ? 'text-orange-400' : 'text-white'}>
                                  {product.stock_quantity}
                                </span>
                              )}
                              {editingProduct !== product.id && (
                                <button
                                  onClick={() =>
                                    setStockAdjust({ id: product.id, qty: '', note: '' })
                                  }
                                  className="p-1 text-zinc-500 hover:text-green-primary transition-colors"
                                  title="Ajuster le stock"
                                >
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <button
                              onClick={async () => {
                                const val = !product.is_available;
                                await supabase
                                  .from('products')
                                  .update({ is_available: val })
                                  .eq('id', product.id);
                                setProducts((prev) =>
                                  prev.map((p) => (p.id === product.id ? { ...p, is_available: val } : p))
                                );
                              }}
                              className={`text-xs px-2 py-1 rounded-full border ${
                                product.is_available
                                  ? 'text-green-400 bg-green-900/30 border-green-800'
                                  : 'text-red-400 bg-red-900/30 border-red-800'
                              }`}
                            >
                              {product.is_available ? 'Actif' : 'Inactif'}
                            </button>
                          </td>
                          <td className="py-4">
                            {editingProduct === product.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveProduct(product.id)}
                                  disabled={isSaving}
                                  className="flex items-center gap-1 text-xs bg-green-primary hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <Save className="w-3 h-3" />
                                  Sauvegarder
                                </button>
                                <button
                                  onClick={() => { setEditingProduct(null); setProductEdits({}); }}
                                  className="text-xs text-zinc-500 hover:text-white px-2 py-1.5 transition-colors"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingProduct(product.id); setProductEdits({}); }}
                                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Modifier
                              </button>
                            )}
                          </td>
                        </tr>
                        {/* Stock adjustment inline form */}
                        {stockAdjust?.id === product.id && (
                          <tr key={`adj-${product.id}`}>
                            <td colSpan={5} className="pb-4">
                              <div className="bg-zinc-800 rounded-xl p-4 flex items-center gap-3">
                                <span className="text-sm text-zinc-400">Ajustement stock :</span>
                                <input
                                  type="number"
                                  placeholder="+10 ou -5"
                                  value={stockAdjust.qty}
                                  onChange={(e) => setStockAdjust({ ...stockAdjust, qty: e.target.value })}
                                  className="w-24 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-primary"
                                />
                                <input
                                  type="text"
                                  placeholder="Note (optionnel)"
                                  value={stockAdjust.note}
                                  onChange={(e) => setStockAdjust({ ...stockAdjust, note: e.target.value })}
                                  className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-primary"
                                />
                                <button
                                  onClick={handleStockAdjust}
                                  disabled={isSaving}
                                  className="bg-green-primary hover:bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => setStockAdjust(null)}
                                  className="text-zinc-500 hover:text-white text-sm px-2 transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ORDERS TAB */}
            {tab === 'orders' && (
              <div className="space-y-3">
                {orders.length === 0 && (
                  <p className="text-zinc-400 text-center py-8">Aucune commande.</p>
                )}
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="font-medium text-white">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')} —{' '}
                          {order.delivery_type === 'click_collect' ? 'Click & Collect' : 'Livraison'}{' '}
                          — {order.total.toFixed(2)} €
                        </p>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-green-primary"
                      >
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* STOCK MOVEMENTS TAB */}
            {tab === 'stock' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Produit</th>
                      <th className="pb-3 pr-4">Variation</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {movements.map((mv) => (
                      <tr key={mv.id}>
                        <td className="py-3 pr-4 text-xs text-zinc-500">
                          {new Date(mv.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 pr-4 text-sm text-white">
                          {(mv.product as { name?: string })?.name ?? mv.product_id.slice(0, 8)}
                        </td>
                        <td className={`py-3 pr-4 font-bold ${mv.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {mv.quantity_change > 0 ? '+' : ''}{mv.quantity_change}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                            {mv.type}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-zinc-500">{mv.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {movements.length === 0 && (
                  <p className="text-zinc-400 text-center py-8">Aucun mouvement de stock.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
