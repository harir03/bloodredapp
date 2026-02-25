import { useCallback, useEffect, useState } from "react";

interface UseQueryResult<T> {
  data: T[];
  count: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Generic hook for fetching data from Firestore services.
 * @param fetchFn - Async function that returns { data, count, error }
 * @param deps - Dependency array to trigger re-fetch
 */
export function useQuery<T>(
  fetchFn: () => Promise<{ data: T[]; count: number; error: string | null }>,
  deps: any[] = [],
): UseQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result.data);
      setCount(result.count);
      if (result.error) setError(result.error);
    } catch (e: any) {
      setError(e.message || "Failed to fetch data");
    }
    setLoading(false);
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, count, loading, error, refresh: fetch };
}

interface UseCountResult {
  count: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching a count from Firestore.
 */
export function useCount(
  countFn: () => Promise<{ count: number; error: string | null }>,
  deps: any[] = [],
): UseCountResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await countFn();
      setCount(result.count);
      if (result.error) setError(result.error);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { count, loading, error, refresh: fetch };
}
