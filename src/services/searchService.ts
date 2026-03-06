import { supabase } from '../lib/supabase';
import { Category, Product } from '../lib/types';

export interface SearchPreviewResult {
  products: Product[];
  categories: Category[];
}

export async function searchCatalogPreview(query: string): Promise<SearchPreviewResult> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    return { products: [], categories: [] };
  }

  const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .ilike('name', `%${normalizedQuery}%`)
      .eq('is_active', true)
      .limit(5),
    supabase
      .from('categories')
      .select('*')
      .ilike('name', `%${normalizedQuery}%`)
      .eq('is_active', true)
      .limit(3),
  ]);

  if (productsError) throw productsError;
  if (categoriesError) throw categoriesError;

  return {
    products: (products as Product[]) ?? [],
    categories: (categories as Category[]) ?? [],
  };
}
