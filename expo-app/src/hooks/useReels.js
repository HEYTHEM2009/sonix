import { useCallback, useRef, useState } from "react";
import reelsApi from "../api/reels";

/**
 * Reusable hook for paginated reel feeds with infinite scroll and refresh.
 * Works for feed, for-you, trending, saved, hashtag and search.
 */
export function useReels(fetcher, pageSize = 20) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (pageNum = 1, append = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (pageNum === 1 && !append) setLoading(true);

      try {
        const res = await fetcher({ page: pageNum, per_page: pageSize });
        const payload = res.data?.data ?? res.data;
        const data = Array.isArray(payload) ? payload : payload?.data ?? [];
        setReels((prev) => (append ? [...prev, ...data] : data));
        setHasMore(data.length >= pageSize);
        pageRef.current = pageNum;
      } catch (e) {
        console.warn("useReels load error:", e?.message);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [fetcher, pageSize]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    await load(1);
    setRefreshing(false);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    await load(pageRef.current + 1, true);
  }, [hasMore, load]);

  return { reels, loading, refreshing, hasMore, load, refresh, loadMore, setReels };
}
