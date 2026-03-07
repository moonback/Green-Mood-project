/**
 * useProductDetail.ts
 *
 * Encapsulates all data fetching and business logic for the ProductDetail page:
 * - Product + bundle + images loading
 * - Reviews loading and average calculation
 * - Review eligibility check
 * - Review submission
 * - Subscription creation
 *
 * Returns clean state and handler functions; no UI logic inside.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Review, BundleItem, SubscriptionFrequency } from '../lib/types';

interface UseProductDetailOptions {
    slug: string | undefined;
    userId: string | undefined;
}

export function useProductDetail({ slug, userId }: UseProductDetailOptions) {
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
    const [productImages, setProductImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Reviews
    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [canReview, setCanReview] = useState(false);
    const [reviewableOrderId, setReviewableOrderId] = useState<string | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState(false);

    // Subscription
    const [subFrequency, setSubFrequency] = useState<SubscriptionFrequency>('monthly');
    const [subQty, setSubQty] = useState(1);
    const [subSuccess, setSubSuccess] = useState(false);
    const [subLoading, setSubLoading] = useState(false);

    // Load product, images, bundle items, and reviews
    useEffect(() => {
        if (!slug) return;

        supabase
            .from('products')
            .select('*, category:categories(*)')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()
            .then(({ data, error }) => {
                if (error || !data) {
                    navigate('/catalogue', { replace: true });
                    return;
                }
                const p = data as Product;
                setProduct(p);
                setIsLoading(false);
                loadReviews(p.id);
                if (userId) checkCanReview(p.id, userId);

                // Build images array (main + extra from product_images table)
                const mainImage = p.image_url ?? 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800';
                supabase
                    .from('product_images')
                    .select('image_url, sort_order')
                    .eq('product_id', p.id)
                    .order('sort_order')
                    .then(({ data: extraImages, error: imgError }) => {
                        setProductImages(
                            imgError || !extraImages
                                ? [mainImage]
                                : [mainImage, ...extraImages.map((img: { image_url: string }) => img.image_url)]
                        );
                    });

                // Load bundle items if applicable
                if (p.is_bundle) {
                    supabase
                        .from('bundle_items')
                        .select('*, product:products(id, name, slug, price, image_url, cbd_percentage, weight_grams)')
                        .eq('bundle_id', p.id)
                        .then(({ data: items }) => {
                            if (items) setBundleItems(items as BundleItem[]);
                        });
                }
            });
    }, [slug, navigate, userId]);

    async function loadReviews(productId: string) {
        const { data } = await supabase
            .from('reviews')
            .select('*, profile:profiles(full_name)')
            .eq('product_id', productId)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        const list = (data as Review[]) ?? [];
        setReviews(list);
        if (list.length > 0) {
            setAvgRating(list.reduce((s, r) => s + r.rating, 0) / list.length);
        }
    }

    async function checkCanReview(productId: string, uid: string) {
        const { data: items } = await supabase
            .from('order_items')
            .select('order_id')
            .eq('product_id', productId);

        if (!items || items.length === 0) return;
        const orderIds = items.map((i: { order_id: string }) => i.order_id);

        const { data: deliveredOrders } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', uid)
            .eq('status', 'delivered')
            .in('id', orderIds);

        if (!deliveredOrders || deliveredOrders.length === 0) return;

        const { data: existing } = await supabase
            .from('reviews')
            .select('id')
            .eq('product_id', productId)
            .eq('user_id', uid)
            .limit(1);

        if (!existing || existing.length === 0) {
            setCanReview(true);
            setReviewableOrderId(deliveredOrders[0].id);
        }
    }

    async function handleSubscribe() {
        if (!userId) {
            navigate('/connexion');
            return;
        }
        if (!product) return;
        setSubLoading(true);

        const next = new Date();
        if (subFrequency === 'weekly') next.setDate(next.getDate() + 7);
        else if (subFrequency === 'biweekly') next.setDate(next.getDate() + 14);
        else next.setMonth(next.getMonth() + 1);

        await supabase.from('subscriptions').insert({
            user_id: userId,
            product_id: product.id,
            quantity: subQty,
            frequency: subFrequency,
            next_delivery_date: next.toISOString().split('T')[0],
            status: 'active',
        });

        setSubLoading(false);
        setSubSuccess(true);
    }

    async function handleSubmitReview(rating: number, comment: string): Promise<string | null> {
        if (!userId || !product || !reviewableOrderId) return 'Données manquantes.';

        const { error } = await supabase.from('reviews').insert({
            product_id: product.id,
            user_id: userId,
            order_id: reviewableOrderId,
            rating,
            comment: comment.trim() || null,
            is_verified: true,
            is_published: false,
        });

        if (error) return "Erreur lors de l'envoi. Veuillez réessayer.";

        setReviewSuccess(true);
        setCanReview(false);
        return null; // no error
    }

    return {
        product,
        bundleItems,
        productImages,
        isLoading,
        reviews,
        avgRating,
        canReview,
        reviewableOrderId,
        reviewSuccess,
        // Subscription state
        subFrequency,
        setSubFrequency,
        subQty,
        setSubQty,
        subSuccess,
        subLoading,
        // Handlers
        handleSubscribe,
        handleSubmitReview,
    };
}
