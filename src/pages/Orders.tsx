import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, Clock, ChevronDown, ArrowLeft, ShoppingBag, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order, OrderItem } from '../lib/types';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import SEO from '../components/SEO';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'EN ATTENTE', color: 'text-yellow-400 bg-yellow-400/5 border-yellow-400/20' },
  paid: { label: 'CONFIRMÉ', color: 'text-blue-400 bg-blue-400/5 border-blue-400/20' },
  processing: { label: 'EN PRÉPARATION', color: 'text-purple-400 bg-purple-400/5 border-purple-400/20' },
  ready: { label: 'PRÊT AU RETRAIT', color: 'text-green-neon bg-green-neon/5 border-green-neon/20' },
  shipped: { label: 'EN TRANSIT', color: 'text-blue-400 bg-blue-400/5 border-blue-400/20' },
  delivered: { label: 'LIVRÉ', color: 'text-green-neon bg-green-neon/5 border-green-neon/20' },
  cancelled: { label: 'ANNULÉ', color: 'text-red-400 bg-red-400/5 border-red-400/20' },
};

export default function Orders() {
  const { user } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);
  const openSidebar = useCartStore((s) => s.openSidebar);
  const addToast = useToastStore((s) => s.addToast);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleReorder = async (order: Order) => {
    const items = order.order_items as OrderItem[] | undefined;
    if (!items || items.length === 0) return;

    // Fetch current products to ensure they're available
    const productIds = items.map((i) => i.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .in('id', productIds)
      .eq('is_active', true)
      .eq('is_available', true);

    if (!products || products.length === 0) {
      addToast({ message: 'Les produits de cette commande ne sont plus disponibles', type: 'error' });
      return;
    }

    let addedCount = 0;
    for (const product of products) {
      const originalItem = items.find((i) => i.product_id === product.id);
      if (originalItem && product.stock_quantity > 0) {
        addItem(product);
        if (originalItem.quantity > 1) {
          useCartStore.getState().updateQuantity(product.id, originalItem.quantity);
        }
        addedCount++;
      }
    }

    if (addedCount > 0) {
      addToast({ message: `${addedCount} produit${addedCount > 1 ? 's' : ''} ajouté${addedCount > 1 ? 's' : ''} au panier`, type: 'success' });
      openSidebar();
    } else {
      addToast({ message: 'Aucun produit disponible en stock', type: 'error' });
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setIsLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32">
      <SEO title="Mes Commandes — L'Excellence Green Mood" description="Historique de vos commandes." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <Link to="/compte" className="inline-flex items-center gap-2 text-zinc-500 hover:text-green-neon text-xs font-black uppercase tracking-widest transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au Hub
            </Link>
            <h1 className="text-4xl md:text-4xl font-serif font-black tracking-tight leading-none">
              HISTORIQUE <br /><span className="text-green-neon italic">SÉLECT.</span>
            </h1>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600 md:text-right">
            ARCHIVES PERSONNELLES — {orders.length} ITEMS
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 animate-pulse h-32" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-green-neon/5 rounded-full blur-xl" />
              <ShoppingBag className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="space-y-3">
              <p className="font-serif text-2xl font-black text-white">Aucune archive disponible</p>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
                Votre historique commencera dès votre première commande d'exception.
              </p>
            </div>
            <Link
              to="/catalogue"
              className="bg-white text-black font-black uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-green-neon transition-all"
            >
              Découvrir le Catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
              const isExpanded = expanded === order.id;
              const items = order.order_items as OrderItem[] | undefined;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`group bg-white/[0.02] backdrop-blur-3xl border rounded-[2.5rem] overflow-hidden transition-all duration-500 ${isExpanded ? 'border-white/10 bg-white/[0.04]' : 'border-white/5 hover:border-white/20'}`}
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                    className="w-full flex flex-col md:flex-row md:items-center justify-between p-8 md:p-10 text-left gap-6"
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-green-neon text-black' : 'bg-white/5 text-zinc-500'}`}>
                        {order.delivery_type === 'click_collect' ? (
                          <Package className="w-6 h-6" />
                        ) : (
                          <Truck className="w-6 h-6" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                          SÉLECTION REFERENCE
                        </p>
                        <h3 className="text-xl font-serif font-black text-white uppercase tracking-tight">
                          #{order.id.slice(0, 8)}
                        </h3>
                        <p className="text-[10px] text-zinc-600 font-mono flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          EXPÉDIÉE LE {new Date(order.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                      <div className="space-y-2 text-right">
                        <span className={`inline-block text-[9px] font-black tracking-[0.2em] px-3 py-1.5 rounded-full border transition-all ${status.color}`}>
                          {status.label}
                        </span>
                        <p className="text-2xl font-serif font-black text-white">
                          {order.total.toFixed(2)}<span className="text-green-neon text-sm ml-1 font-sans">€</span>
                        </p>
                      </div>
                      <div className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-all ${isExpanded ? 'rotate-180 bg-white/10' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-zinc-500" />
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && items && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5 bg-white/[0.01]"
                      >
                        <div className="p-10 space-y-8">
                          <div className="space-y-4">
                            <p className="text-[10px] font-mono tracking-[0.4em] text-zinc-600 uppercase">DÉTAILS DE LA PIÈCE</p>
                            <div className="space-y-3">
                              {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center group/item">
                                  <span className="text-sm font-medium text-white/70 group-hover/item:text-white transition-colors">
                                    {item.product_name} <span className="text-[10px] font-mono text-zinc-600 ml-2">×{item.quantity}</span>
                                  </span>
                                  <span className="text-sm font-serif font-black text-white">{item.total_price.toFixed(2)} €</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/5 space-y-3">
                            <div className="flex justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                              <span>FRAIS D'EXPÉDITION</span>
                              <span>{order.delivery_fee === 0 ? 'OFFERT' : `${order.delivery_fee.toFixed(2)} €`}</span>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                              <span className="text-xs font-black uppercase tracking-[0.3em] text-green-neon">TOTAL PIÈCE</span>
                              <span className="text-3xl font-serif font-black text-white">{order.total.toFixed(2)} €</span>
                            </div>
                          </div>

                          {/* Reorder Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                            className="w-full flex items-center justify-center gap-3 bg-green-neon text-black font-bold uppercase tracking-widest py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                            RECOMMANDER
                          </button>

                          {order.delivery_type === 'click_collect' && (
                            <div className="bg-zinc-900/50 rounded-[2rem] p-6 border border-white/5 flex items-center gap-6">
                              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-green-neon" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">LIEU DE RETRAIT</p>
                                <p className="text-sm text-white/80 leading-relaxed italic font-serif">Retrait expert disponible en boutique Green Mood.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
