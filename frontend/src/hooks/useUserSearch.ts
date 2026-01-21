import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULTS } from '../utils/constants';

export function useUserSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // Reset to page 1 when search changes
      if (search !== debouncedSearch) {
        searchParams.delete('page');
        setSearchParams(searchParams);
      }
    }, DEFAULTS.DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, debouncedSearch, searchParams, setSearchParams]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setDebouncedSearch(search);
      }
    },
    [search]
  );

  const goToPage = useCallback(
    (page: number, totalPages: number) => {
      const nextPage = Math.min(Math.max(page, 1), totalPages);
      searchParams.set('page', String(nextPage));
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams]
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    currentPage,
    handleKeyDown,
    goToPage,
  };
}
