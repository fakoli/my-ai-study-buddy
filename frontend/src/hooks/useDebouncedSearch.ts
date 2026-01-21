import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Returns a debounced version of a value.
 *
 * The returned value will only update after the specified delay has passed
 * without any new updates to the source value. This is useful for reducing
 * API calls when the user is typing in a search field.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(searchQuery, 300);
 *
 * // Use debouncedQuery for API calls
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     searchApi(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a debounced callback function.
 *
 * The callback will only execute after the specified delay has passed
 * without any new calls. Subsequent calls before the delay reset the timer.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns A debounced version of the callback
 *
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   searchApi(query);
 * }, 300);
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update the callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook for search functionality with debouncing and loading state.
 *
 * Provides a complete search state management solution including:
 * - Immediate value for display
 * - Debounced value for API calls
 * - Loading state indicator
 * - Clear function
 *
 * @param initialValue - Initial search value (default: '')
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Search state and handlers
 *
 * @example
 * ```tsx
 * const { value, debouncedValue, setValue, clear, isDebouncing } = useSearch();
 *
 * // Use value for input display
 * <input value={value} onChange={(e) => setValue(e.target.value)} />
 *
 * // Use debouncedValue for API calls
 * const { data } = useQuery(['search', debouncedValue], ...);
 *
 * // Show loading indicator while debouncing
 * {isDebouncing && <Spinner />}
 * ```
 */
export function useSearch(initialValue: string = '', delay: number = 300) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebouncedValue(value, delay);
  const isDebouncing = value !== debouncedValue;

  const clear = useCallback(() => {
    setValue('');
  }, []);

  return {
    /** Current search value (for display) */
    value,
    /** Debounced search value (for API calls) */
    debouncedValue,
    /** Update the search value */
    setValue,
    /** Clear the search value */
    clear,
    /** True while waiting for debounce to complete */
    isDebouncing,
  };
}
