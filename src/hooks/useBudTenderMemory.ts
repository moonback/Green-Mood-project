import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useAuthStore } from '../store/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SavedPrefs {
    goal: string;
    experience: string;
    format: string;
    budget: string;
}

export interface PastProduct {
    product_id: string;
    product_name: string;
    slug: string | null;
    image_url: string | null;
    price: number;
    orderedAt: string;
    categorySlug: string | null;
}

export interface RestockCandidate extends PastProduct {
    daysSince: number;
    threshold: number;
}

// Days before a category is likely running out
const RESTOCK_THRESHOLDS: Record<string, number> = {
    huiles: 30,
    fleurs: 14,
    resines: 14,
    infusions: 21,
};
const DEFAULT_THRESHOLD = 21;

const LS_KEY = 'budtender_prefs_v1';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBudTenderMemory() {
    const { user, profile } = useAuthStore();

    const [pastProducts, setPastProducts] = useState<PastProduct[]>([]);
    const [restockCandidates, setRestockCandidates] = useState<RestockCandidate[]>([]);
    const [savedPrefs, setSavedPrefs] = useState<SavedPrefs | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isLoggedIn = !!user;
    const userName = profile?.full_name
        ? profile.full_name.split(' ')[0]
        : null;

    // ── Load saved prefs from localStorage ──────────────────────────────────
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) setSavedPrefs(JSON.parse(raw) as SavedPrefs);
        } catch {
            // ignore corrupt data
        }
    }, []);

    // ── Fetch order history for logged-in users ──────────────────────────────
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const { data: orders } = await supabase
                    .from('orders')
                    .select('id, created_at, status, order_items(product_id, product_name, unit_price, product:products(slug, image_url, category:categories(slug)))')
                    .eq('user_id', user.id)
                    .in('status', ['paid', 'processing', 'ready', 'shipped', 'delivered'])
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!orders) return;

                const now = Date.now();
                const seen = new Set<string>();
                const past: PastProduct[] = [];
                const restock: RestockCandidate[] = [];

                for (const order of orders) {
                    const items = (order.order_items as any[]) ?? [];
                    const orderedAt = order.created_at as string;
                    const daysSince = (now - new Date(orderedAt).getTime()) / (1000 * 60 * 60 * 24);

                    for (const item of items) {
                        const product = item.product as Product | null;
                        const catSlug = (product?.category as any)?.slug ?? null;
                        const candidate: PastProduct = {
                            product_id: item.product_id,
                            product_name: item.product_name,
                            slug: product?.slug ?? null,
                            image_url: product?.image_url ?? null,
                            price: item.unit_price,
                            orderedAt,
                            categorySlug: catSlug,
                        };

                        // Deduplicate — keep only most recent per product
                        if (!seen.has(item.product_id)) {
                            seen.add(item.product_id);
                            past.push(candidate);
                        }

                        // Restock check
                        const threshold = catSlug ? (RESTOCK_THRESHOLDS[catSlug] ?? DEFAULT_THRESHOLD) : DEFAULT_THRESHOLD;
                        if (daysSince >= threshold && !restock.find(r => r.product_id === item.product_id)) {
                            restock.push({ ...candidate, daysSince: Math.round(daysSince), threshold });
                        }
                    }
                }

                setPastProducts(past.slice(0, 5));
                setRestockCandidates(restock.slice(0, 2)); // max 2 restock suggestions
            } catch (err) {
                console.error('[BudTenderMemory]', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    // ── Save preferences ─────────────────────────────────────────────────────
    const savePrefs = (prefs: SavedPrefs) => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(prefs));
            setSavedPrefs(prefs);
        } catch {
            // ignore
        }
    };

    const clearPrefs = () => {
        localStorage.removeItem(LS_KEY);
        setSavedPrefs(null);
    };

    return {
        isLoggedIn,
        userName,
        pastProducts,
        restockCandidates,
        savedPrefs,
        savePrefs,
        clearPrefs,
        isLoading,
    };
}
