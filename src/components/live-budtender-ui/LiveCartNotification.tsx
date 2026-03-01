import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Package, RefreshCw, Trash2, Bell } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import type { LiveCartAction, LiveSubscriptionAction } from '../../lib/types';

interface LiveCartNotificationProps {
    cartAction: LiveCartAction | null;
    subscriptionAction: LiveSubscriptionAction | null;
}

interface Notification {
    id: string;
    icon: any;
    color: string;
    title: string;
    subtitle: string;
}

export default function LiveCartNotification({ cartAction, subscriptionAction }: LiveCartNotificationProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const openSidebar = useCartStore((s) => s.openSidebar);

    // Cart action notifications
    useEffect(() => {
        if (!cartAction) return;

        const iconMap = {
            add: ShoppingCart,
            remove: Trash2,
            update: RefreshCw,
        };
        const titleMap = {
            add: 'Ajouté au panier',
            remove: 'Retiré du panier',
            update: 'Quantité modifiée',
        };
        const colorMap = {
            add: 'text-green-neon border-green-neon/30 bg-green-neon/5',
            remove: 'text-red-400 border-red-400/30 bg-red-400/5',
            update: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
        };

        const notif: Notification = {
            id: `cart-${cartAction.timestamp}`,
            icon: iconMap[cartAction.type],
            color: colorMap[cartAction.type],
            title: titleMap[cartAction.type],
            subtitle: cartAction.productName,
        };

        setNotifications((prev) => [...prev, notif]);

        // Auto-dismiss after 4s
        const timer = setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        }, 4000);

        return () => clearTimeout(timer);
    }, [cartAction]);

    // Subscription action notifications
    useEffect(() => {
        if (!subscriptionAction) return;

        const freqLabels: Record<string, string> = {
            weekly: 'hebdo.',
            biweekly: 'bi-mensuel',
            monthly: 'mensuel',
        };

        const notif: Notification = {
            id: `sub-${subscriptionAction.timestamp}`,
            icon: Bell,
            color: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
            title: `Abonnement ${freqLabels[subscriptionAction.frequency] ?? subscriptionAction.frequency}`,
            subtitle: subscriptionAction.productName,
        };

        setNotifications((prev) => [...prev, notif]);

        const timer = setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        }, 5000);

        return () => clearTimeout(timer);
    }, [subscriptionAction]);

    return (
        <div className="fixed top-20 right-4 sm:right-6 z-[80] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notif) => {
                    const Icon = notif.icon;
                    return (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: 60, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 60, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl max-w-[280px] ${notif.color}`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
                                    {notif.title}
                                </p>
                                <p className="text-xs font-bold text-white truncate mt-0.5">
                                    {notif.subtitle}
                                </p>
                            </div>
                            {notif.id.startsWith('cart-') && (
                                <button
                                    onClick={openSidebar}
                                    className="text-[9px] font-bold text-green-neon hover:text-green-400 flex-shrink-0 transition-colors"
                                >
                                    Voir
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
