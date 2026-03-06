import { supabase } from '../lib/supabase';
import { Category, Product } from '../lib/types';

export interface CatalogPayload {
  categories: Category[];
  products: Product[];
}

interface RatingRow {
  product_id: string;
  rating: number;
}

export async function fetchActiveCatalog(): Promise<CatalogPayload> {
  const [{ data: cats, error: catsError }, { data: prods, error: prodsError }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name'),
  ]);

  if (catsError) throw catsError;
  if (prodsError) throw prodsError;

  const categoryList = (cats as Category[]) ?? [];
  const productList = (prods as Product[]) ?? [];

  const nonemptyCategoryIds = new Set(productList.map((p) => p.category_id));
  const filteredCategories = categoryList.filter((c) => nonemptyCategoryIds.has(c.id));

  if (productList.length === 0) {
    return { categories: filteredCategories, products: productList };
  }

  const productIds = productList.map((p) => p.id);
  const { data: ratingsData, error: ratingsError } = await supabase
    .from('reviews')
    .select('product_id, rating')
    .in('product_id', productIds)
    .eq('is_published', true);

  if (ratingsError) throw ratingsError;

  const ratingMap = new Map<string, { sum: number; count: number }>();
  (ratingsData as RatingRow[] | null ?? []).forEach((r) => {
    const cur = ratingMap.get(r.product_id) ?? { sum: 0, count: 0 };
    ratingMap.set(r.product_id, { sum: cur.sum + r.rating, count: cur.count + 1 });
  });

  const productsWithRatings = productList.map((p) => {
    const r = ratingMap.get(p.id);
    return r ? { ...p, avg_rating: r.sum / r.count, review_count: r.count } : p;
  });

  return { categories: filteredCategories, products: productsWithRatings };
}
