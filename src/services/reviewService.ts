/**
 * reviewService.ts
 *
 * Encapsulates all Supabase queries related to product reviews.
 * Handles fetching, eligibility checks, and submission.
 */

import { supabase } from '../lib/supabase';
import { Review } from '../lib/types';

/**
 * Fetches all published reviews for a product, ordered by newest first.
 */
export async function fetchProductReviews(productId: string): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*, profile:profiles(full_name, avatar_url)')
        .eq('product_id', productId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Review[]) || [];
}

/**
 * Checks whether the authenticated user can leave a review for a product.
 * A user can review if they have a delivered order containing the product
 * and have not already reviewed it.
 *
 * Returns the order_id to link the review to, or null if not eligible.
 */
export async function checkReviewEligibility(
    userId: string,
    productId: string
): Promise<string | null> {
    // Check if user already reviewed this product
    const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

    if (existingReview) return null;

    // Find a delivered order that contains this product
    const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, order:orders!inner(id, status, user_id)')
        .eq('product_id', productId)
        .eq('order.user_id', userId)
        .eq('order.status', 'delivered')
        .limit(1);

    if (!orderItems || orderItems.length === 0) return null;

    return (orderItems[0] as any).order_id as string;
}

export interface SubmitReviewPayload {
    productId: string;
    userId: string;
    orderId: string;
    rating: number;
    comment: string;
}

/**
 * Submits a new review for a product.
 * Reviews are saved with is_published = false for admin moderation.
 */
export async function submitReview(payload: SubmitReviewPayload): Promise<void> {
    const { error } = await supabase.from('reviews').insert({
        product_id: payload.productId,
        user_id: payload.userId,
        order_id: payload.orderId,
        rating: payload.rating,
        comment: payload.comment,
        is_published: false,
    });

    if (error) throw error;
}

/**
 * Fetches the average rating and count for a product.
 */
export async function fetchProductRating(productId: string): Promise<{ avg: number; count: number }> {
    const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_published', true);

    if (error) throw error;
    if (!data || data.length === 0) return { avg: 0, count: 0 };

    const sum = data.reduce((acc, r) => acc + r.rating, 0);
    return { avg: sum / data.length, count: data.length };
}
