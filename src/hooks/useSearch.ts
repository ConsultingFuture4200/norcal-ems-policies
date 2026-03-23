import { useState, useCallback, useRef, useEffect } from 'react';
import { searchPolicies, SearchResult, ProviderLevel } from '../database';

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  hasSearched: boolean;
}

export function useSearch(providerLevel: ProviderLevel | null): UseSearchReturn {
  const [query, setQueryRaw] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = searchPolicies(searchQuery, providerLevel, 50);
        setResults(searchResults);
        setHasSearched(true);
      } catch (err) {
        console.warn('Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [providerLevel],
  );

  const setQuery = useCallback(
    (q: string) => {
      setQueryRaw(q);

      // Clear previous timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Debounce: 100ms for snappy feel
      timerRef.current = setTimeout(() => {
        performSearch(q);
      }, 100);
    },
    [performSearch],
  );

  // Re-search when provider level changes
  useEffect(() => {
    if (query.trim()) {
      performSearch(query);
    }
  }, [providerLevel, performSearch, query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { query, setQuery, results, isSearching, hasSearched };
}
