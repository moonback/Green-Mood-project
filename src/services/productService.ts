/**
 * productService.ts
 *
 * Encapsulates all Supabase queries related to products, bundles, and product images.
 * Pages and hooks should call these functions instead of calling supabase directly.
 */

import { supabase } from '../lib/supabase';
import { Product, BundleItem } from '../lib/types';

/**
 * Fetches a single active product by its URL slug, including its category.
 */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error) throw error;
    return data as Product | null;
}

/**
 * Fetches all bundle items for a given product ID.
 */
export async function fetchBundleItems(productId: string): Promise<BundleItem[]> {
    const { data, error } = await supabase
        .from('bundle_items')
        .select('*, product:products(*, category:categories(*))')
        .eq('bundle_id', productId);

    if (error) throw error;
    return (data as BundleItem[]) || [];
}

/**
 * Fetches all additional image URLs for a product, ordered by display order.
 */
export async function fetchProductImages(productId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: { image_url: string }) => row.image_url);
}

/**
 * Fetches all active products (full catalog), ordered by creation date.
 */
export async function fetchAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Product[]) || [];
}

/**
 * Fetches products in a given category, ordered by creation date.
 */
export async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Product[]) || [];
}

/**
 * Fetches featured products for homepage/widget display.
 */
export async function fetchFeaturedProducts(limit = 6): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data as Product[]) || [];
}

/**
 * Fetches best-selling products based on order item count.
 */
export async function fetchBestSellers(limit = 4): Promise<Product[]> {
    const { data, error } = await supabase
        .rpc('get_best_sellers', { p_limit: limit });

    if (error) {
        // Fallback to featured products if RPC not available
        return fetchFeaturedProducts(limit);
    }
    return (data as Product[]) || [];
}
