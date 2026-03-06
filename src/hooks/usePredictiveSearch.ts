import { useEffect, useState } from 'react';
import { Category, Product } from '../lib/types';
import { searchCatalogPreview } from '../services/searchService';

interface UsePredictiveSearchOptions {
  minQueryLength?: number;
  debounceMs?: number;
}

interface UsePredictiveSearchReturn {
  isSearching: boolean;
  searchResults: { products: Product[]; categories: Category[] };
}

export function usePredictiveSearch(
  query: string,
  { minQueryLength = 2, debounceMs = 300 }: UsePredictiveSearchOptions = {},
): UsePredictiveSearchReturn {
  const [searchResults, setSearchResults] = useState<{ products: Product[]; categories: Category[] }>({
    products: [],
    categories: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < minQueryLength) {
      setSearchResults({ products: [], categories: [] });
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCatalogPreview(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, minQueryLength, query]);

  return { isSearching, searchResults };
}
