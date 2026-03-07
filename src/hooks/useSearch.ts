/**
 * useSearch.ts
 *
 * Encapsulates debounced search state and logic for the site-wide search overlay.
 * Delegates actual queries to searchService.
 */

import { useState, useEffect } from 'react';
import { SearchResults, searchProducts } from '../services/searchService';

export function useSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResults>({ products: [], categories: [] });
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults({ products: [], categories: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchProducts(searchQuery.trim());
                setSearchResults(results);
            } catch (err) {
                console.error('[useSearch] Fatal search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    return { searchQuery, setSearchQuery, searchResults, isSearching };
}
