import { useEffect, useMemo, useState } from 'react';
import { SetURLSearchParams } from 'react-router-dom';
import { Product } from '../lib/types';

export type CatalogSort = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
export type CatalogDensity = 'cozy' | 'compact';

interface UseCatalogFiltersOptions {
  products: Product[];
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  productsPerPage?: number;
}

export function useCatalogFilters({
  products,
  searchParams,
  setSearchParams,
  productsPerPage = 12,
}: UseCatalogFiltersOptions) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [selectedAroma, setSelectedAroma] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<CatalogSort>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [subscribableOnly, setSubscribableOnly] = useState(false);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [displayDensity, setDisplayDensity] = useState<CatalogDensity>('cozy');
  const [currentPage, setCurrentPage] = useState(1);

  const allBenefits = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.attributes?.benefits || []))),
    [products],
  );
  const allAromas = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.attributes?.aromas || []))),
    [products],
  );

  const priceBounds = useMemo(() => {
    if (products.length === 0) {
      return { min: 0, max: 0 };
    }
    const prices = products.map((p) => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products]);

  useEffect(() => {
    if (products.length === 0) return;

    const minParam = searchParams.get('minPrice');
    const maxParam = searchParams.get('maxPrice');
    const minValue = minParam ? Number(minParam) : priceBounds.min;
    const maxValue = maxParam ? Number(maxParam) : priceBounds.max;

    setSelectedBenefit(searchParams.get('benefit'));
    setSelectedAroma(searchParams.get('aroma'));
    setSortBy((searchParams.get('sort') as CatalogSort) || 'featured');
    setInStockOnly(searchParams.get('stock') === '1');
    setFeaturedOnly(searchParams.get('featured') === '1');
    setSubscribableOnly(searchParams.get('subscribable') === '1');
    setDisplayDensity(searchParams.get('density') === 'compact' ? 'compact' : 'cozy');
    setPriceMin(Number.isFinite(minValue) ? Math.max(priceBounds.min, minValue) : priceBounds.min);
    setPriceMax(Number.isFinite(maxValue) ? Math.min(priceBounds.max, maxValue) : priceBounds.max);
  }, [products, priceBounds.max, priceBounds.min, searchParams]);

  useEffect(() => {
    if (priceMin === null || priceMax === null) return;

    const nextParams = new URLSearchParams();
    if (selectedCategory) nextParams.set('category', selectedCategory);
    if (searchQuery) nextParams.set('search', searchQuery);
    if (selectedBenefit) nextParams.set('benefit', selectedBenefit);
    if (selectedAroma) nextParams.set('aroma', selectedAroma);
    if (sortBy !== 'featured') nextParams.set('sort', sortBy);
    if (inStockOnly) nextParams.set('stock', '1');
    if (featuredOnly) nextParams.set('featured', '1');
    if (subscribableOnly) nextParams.set('subscribable', '1');
    if (displayDensity !== 'cozy') nextParams.set('density', displayDensity);
    if (priceMin > priceBounds.min) nextParams.set('minPrice', String(priceMin));
    if (priceMax < priceBounds.max) nextParams.set('maxPrice', String(priceMax));
    setSearchParams(nextParams, { replace: true });
  }, [
    selectedCategory,
    searchQuery,
    selectedBenefit,
    selectedAroma,
    sortBy,
    inStockOnly,
    featuredOnly,
    subscribableOnly,
    displayDensity,
    priceMin,
    priceMax,
    setSearchParams,
    priceBounds.min,
    priceBounds.max,
  ]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = !selectedCategory || p.category_id === selectedCategory || p.category?.slug === selectedCategory;
      const matchBenefit = !selectedBenefit || (p.attributes?.benefits || []).includes(selectedBenefit);
      const matchAroma = !selectedAroma || (p.attributes?.aromas || []).includes(selectedAroma);
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
      const matchStock = !inStockOnly || (p.is_available && p.stock_quantity > 0);
      const matchFeatured = !featuredOnly || p.is_featured;
      const matchSubscribable = !subscribableOnly || p.is_subscribable;
      const matchPrice = priceMin === null || priceMax === null ? true : p.price >= priceMin && p.price <= priceMax;
      return matchCat && matchBenefit && matchAroma && matchSearch && matchStock && matchFeatured && matchSubscribable && matchPrice;
    });
  }, [
    featuredOnly,
    inStockOnly,
    priceMax,
    priceMin,
    products,
    searchQuery,
    selectedAroma,
    selectedBenefit,
    selectedCategory,
    subscribableOnly,
  ]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
    });
  }, [filtered, sortBy]);

  const totalPages = Math.ceil(sorted.length / productsPerPage);
  const paginatedProducts = useMemo(
    () => sorted.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage),
    [currentPage, productsPerPage, sorted],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBenefit, selectedAroma, searchQuery, sortBy, inStockOnly, featuredOnly, subscribableOnly, priceMin, priceMax]);

  const activeFilterCount =
    [selectedBenefit, selectedAroma, inStockOnly, featuredOnly, subscribableOnly].filter(Boolean).length +
    ((priceMin !== null && priceMin > priceBounds.min) || (priceMax !== null && priceMax < priceBounds.max) ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedBenefit(null);
    setSelectedAroma(null);
    setSelectedCategory(null);
    setSearchQuery('');
    setInStockOnly(false);
    setFeaturedOnly(false);
    setSubscribableOnly(false);
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
  };

  return {
    selectedCategory,
    setSelectedCategory,
    selectedBenefit,
    setSelectedBenefit,
    selectedAroma,
    setSelectedAroma,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    inStockOnly,
    setInStockOnly,
    featuredOnly,
    setFeaturedOnly,
    subscribableOnly,
    setSubscribableOnly,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    displayDensity,
    setDisplayDensity,
    currentPage,
    setCurrentPage,
    allBenefits,
    allAromas,
    priceBounds,
    filtered,
    paginatedProducts,
    totalPages,
    activeFilterCount,
    resetAllFilters,
  };
}
