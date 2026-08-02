import { useState, useEffect, useCallback, useRef } from "react";
import client from "../api/client";
import realtime from "../api/realtime";
import { useAuth } from "../context/AuthContext";
import {
  cacheMessages,
  getCachedMessages,
  addToOfflineQueue,
  removeFromOfflineQueue,
  cacheDraft,
  getDraft,
  searchCache,
} from "../api/cache";

function dedupeById(list, msg) {
  const key = msg.id != null ? "id" : "temp_id";
  const value = msg[key];
  const idx = list.findIndex((m) => m[key] === value);
  if (idx >= 0) {
    const next = list.slice();
    next[idx] = { ...next[idx], ...msg };
    return next;
  }
  return [...list, msg];
}

function replaceTemp(list, tempId, msg) {
  const idx = list.findIndex((m) => m.temp_id === tempId);
  if (idx < 0) return list;
  const next = list.slice();
  const { temp_id, status, ...rest } = list[idx];
  next[idx] = { ...rest, ...msg };
  return next;
}

function updateMessage(list, matcher, patch) {
  let changed = false;
  const next = list.map((m) => {
    if (matcher(m)) {
      changed = true;
      return { ...m, ...patch(m) };
    }
    return m;
  });
  return changed ? next : list;
}

export default function useMessages(partnerId, myIdOverride) {
  const auth = useAuth();
  const myId = myIdOverride || (auth && auth.user ? auth.user.id : null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [connection, setConnection] = useState(realtime.status || "disconnected");
  const [searchResults, setSearchResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  const myIdRef = useRef(myId);
  const partnerIdRef = useRef(partnerId);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);
  useEffect(() => {
    partnerIdRef.current = partnerId;
  }, [partnerId]);

  const load = useCallback(
    async (cursor) => {
      const pid = partnerIdRef.current;
      if (!pid) return;
      try {
        setLoading(true);
        const cached = await getCachedMessages(pid);
        if (!cursor && cached.length) {
          setMessages(cached);
        }
        const { data } = await client.get(`/messages/${pid}`, {
          params: { limit: 50, cursor: cursor || "" },
        });
        const fetched = data.data || [];
        if (cursor) {
          setMessages((prev) => dedupeByIdList(prev, fetched));
        } else {
          setMessages((prev) => dedupeByIdList(prev, fetched));
        }
        setHasMore(!!data.has_more);
        setNextCursor(data.next_cursor || null);
        const base = cursor ? [...fetched, ...cached] : fetched;
        await cacheMessages(pid, dedupeByIdList(cached, base));
      } catch (e) {
        if (!cursor) {
          const cached = await getCachedMessages(pid);
          if (cached.length) setMessages(cached);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const dedupeByIdList = useCallback((prev, incoming) => {
    let result = prev;
    incoming.forEach((m) => {
      result = dedupeById(result, m);
    });
    return result;
  }, []);

  const loadMore = useCallback(async () => {
    if (hasMore && nextCursor) {
      await load(nextCursor);
    }
  }, [hasMore, nextCursor, load]);

  const send = useCallback(
    async (text, opts = {}) => {
      const pid = partnerIdRef.current;
      if (!pid) return null;
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tempMsg = {
        temp_id: tempId,
        id: undefined,
        content: text,
        type: opts.type || "text",
        image: opts.image || null,
        voice: opts.voice || null,
        duration: opts.duration || null,
        sender_id: myIdRef.current,
        receiver_id: pid,
        reply_to: opts.reply_to || null,
        created_at: new Date().toISOString(),
        is_read: false,
        delivered: false,
        status: "sending",
      };
      setMessages((prev) => [...prev, tempMsg]);
      setSending(true);
      try {
        const { data } = await client.post("/messages", {
          receiver_id: pid,
          content: text,
          type: opts.type || "text",
          image: opts.image,
          voice: opts.voice,
          reply_to: opts.reply_to,
          duration: opts.duration,
        });
        setMessages((prev) => replaceTemp(prev, tempId, { ...data, status: "sent" }));
        await removeFromOfflineQueue(tempId);
        return data;
      } catch (e) {
        setMessages((prev) =>
          updateMessage(prev, (m) => m.temp_id === tempId, () => ({ status: "failed" }))
        );
        await addToOfflineQueue(tempMsg);
        return tempMsg;
      } finally {
        setSending(false);
      }
    },
    []
  );

  const receive = useCallback((payload) => {
    const pid = partnerIdRef.current;
    if (!payload || payload.sender_id === myIdRef.current) return;
    if (payload.sender_id !== pid) return;
    setMessages((prev) => dedupeById(prev, payload));
    if (payload.id != null) {
      markDelivered(payload.id);
    }
  }, []);

  const markDelivered = useCallback(async (messageId) => {
    if (messageId == null) return;
    try {
      await client.post(`/messages/${messageId}/deliver`);
      setMessages((prev) =>
        updateMessage(
          prev,
          (m) => m.id === messageId,
          () => ({ delivered: true })
        )
      );
    } catch (e) {
      // Non-fatal: delivery receipt will retry on next connection.
    }
  }, []);

  const markRead = useCallback(async () => {
    const pid = partnerIdRef.current;
    if (!pid) return;
    try {
      await client.post(`/messages/read/${pid}`);
      setMessages((prev) =>
        updateMessage(
          prev,
          (m) => m.sender_id === pid && !m.is_read,
          () => ({ is_read: true })
        )
      );
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const react = useCallback(async (messageId, emoji) => {
    if (messageId == null) return;
    try {
      await client.post(`/messages/${messageId}/react`, { emoji });
      setMessages((prev) =>
        updateMessage(
          prev,
          (m) => m.id === messageId,
          (m) => {
            const reactions = m.reactions ? m.reactions.slice() : [];
            const existing = reactions.findIndex(
              (r) => r.user_id === myIdRef.current && r.emoji === emoji
            );
            if (existing >= 0) {
              reactions.splice(existing, 1);
            } else {
              reactions.push({ user_id: myIdRef.current, emoji });
            }
            return { reactions: reactions.slice() };
          }
        )
      );
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const edit = useCallback(async (messageId, content) => {
    if (messageId == null) return;
    try {
      const { data } = await client.put(`/messages/${messageId}`, { content });
      setMessages((prev) =>
        updateMessage(
          prev,
          (m) => m.id === messageId,
          (m) => ({ ...data, content })
        )
      );
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const deleteForMe = useCallback(async (messageId) => {
    if (messageId == null) return;
    try {
      await client.delete(`/messages/${messageId}/for-me`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const deleteForEveryone = useCallback(async (messageId) => {
    if (messageId == null) return;
    try {
      await client.delete(`/messages/${messageId}`);
      setMessages((prev) =>
        updateMessage(
          prev,
          (m) => m.id === messageId,
          () => ({ is_deleted: true, content: "This message was deleted", image: null, video: null, voice: null, document: null })
        )
      );
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const forward = useCallback(async (messageId, toUserId) => {
    if (messageId == null || !toUserId) return;
    try {
      await client.post(`/messages/${messageId}/forward`, { receiver_id: toUserId });
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const search = useCallback(async (query) => {
    const pid = partnerIdRef.current;
    if (!pid) return;
    try {
      const { data } = await client.get(`/messages/${pid}/search`, {
        params: { q: query, per_page: 20 },
      });
      const results = data.data || [];
      setSearchResults(results);
      return results;
    } catch (e) {
      try {
        const cached = await searchCache(pid, query);
        setSearchResults(cached);
        return cached;
      } catch (_) {
        setSearchResults([]);
        return [];
      }
    }
  }, []);

  const saveDraft = useCallback(async (text) => {
    const pid = partnerIdRef.current;
    if (!pid) return;
    await cacheDraft(pid, text || "");
    try {
      if (text && text.trim()) {
        await client.post(`/messages/${pid}/draft`, { content: text });
      } else {
        await client.post(`/messages/${pid}/draft`, { content: "" });
      }
    } catch (e) {
      // Non-fatal; local cache retains the draft.
    }
  }, []);

  const loadDraft = useCallback(async () => {
    const pid = partnerIdRef.current;
    if (!pid) return "";
    try {
      const { data } = await client.get(`/messages/${pid}/draft`);
      return (data && data.content) || "";
    } catch (e) {
      const cached = await getDraft(pid);
      return cached || "";
    }
  }, []);

  const toggleStar = useCallback(async (messageId) => {
    if (messageId == null) return;
    try {
      const { data } = await client.post(`/messages/${messageId}/star`);
      setMessages((prev) =>
        updateMessage(prev, (m) => m.id === messageId, () => ({ is_starred: data.is_starred }))
      );
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const toggleSave = useCallback(async (messageId) => {
    if (messageId == null) return;
    try {
      const { data } = await client.post(`/messages/${messageId}/save`);
      setMessages((prev) =>
        updateMessage(prev, (m) => m.id === messageId, () => ({ is_saved: data.is_saved }))
      );
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const togglePin = useCallback(async (messageId) => {
    if (messageId == null) return;
    try {
      const { data } = await client.post(`/messages/${messageId}/pin`);
      setMessages((prev) =>
        updateMessage(prev, (m) => m.id === messageId, () => ({ is_pinned: data.is_pinned }))
      );
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  const bulkDelete = useCallback(async (ids = []) => {
    for (const id of ids) {
      await deleteForMe(id);
    }
  }, [deleteForMe]);

  const bulkForward = useCallback(async (ids = [], toUserId) => {
    for (const id of ids) {
      await forward(id, toUserId);
    }
  }, [forward]);

  const flushQueue = useCallback(async () => {
    try {
      const queue = await getOfflineQueue();
      if (!queue.length) return;
      for (const item of queue) {
        const { temp_id, status, queued_at, ...payload } = item;
        try {
          const { data } = await client.post("/messages", {
            receiver_id: payload.receiver_id,
            content: payload.content,
            type: payload.type,
            image: payload.image,
            voice: payload.voice,
            reply_to: payload.reply_to,
            duration: payload.duration,
          });
          await removeFromOfflineQueue(temp_id);
          setMessages((prev) =>
            replaceTemp(prev, temp_id, { ...data, status: "sent" })
          );
        } catch (e) {
          // Keep in queue for the next reconnect/flush attempt.
        }
      }
    } catch (e) {
      // Non-fatal.
    }
  }, []);

  useEffect(() => {
    const pid = partnerIdRef.current;
    const mid = myIdRef.current;
    if (!pid || !mid) return undefined;

    let statusUnsub = () => {};
    let mounted = true;

    const setup = async () => {
      try {
        await realtime.init();
        if (!mounted) return;

        realtime.listen(`messages.${pid}`, "message.sent", (p) => receive(p));
        realtime.listen(`messages.${mid}`, "message.delivered", (p) => {
          if (p && p.id != null) {
            setMessages((prev) =>
              updateMessage(prev, (m) => m.id === p.id, () => ({ delivered: p.delivered }))
            );
          }
        });
        realtime.listen(`messages.${mid}`, "message.read", (p) => {
          if (p && p.id != null) {
            setMessages((prev) =>
              updateMessage(prev, (m) => m.id === p.id, () => ({ is_read: p.read }))
            );
          }
        });
        realtime.listen(`typing.${mid}`, "typing.indicator", (p) => {
          if (!p || !p.typing) {
            setTyping(false);
            return;
          }
          setTyping(true);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTyping(false), 4000);
        });

        statusUnsub = realtime.onStatus((s) => {
          setConnection(s);
          if (s === "connected") flushQueue();
        });
      } catch (e) {
        // Realtime wiring failure is non-fatal for the hook.
      }
    };

    setup();

    return () => {
      mounted = false;
      try {
        realtime.leave(`messages.${pid}`);
        realtime.leave(`messages.${mid}`);
      } catch (e) {
        // Ignore.
      }
      if (statusUnsub) statusUnsub();
      try {
        realtime.leave(`typing.${mid}`);
      } catch (e) {
        // Ignore.
      }
    };
  }, [partnerId, myId, receive]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  return {
    messages,
    loading,
    sending,
    typing,
    connection,
    searchResults,
    hasMore,
    nextCursor,
    load,
    loadMore,
    send,
    receive,
    markDelivered,
    markRead,
    react,
    edit,
    deleteForMe,
    deleteForEveryone,
    forward,
    search,
    saveDraft,
    loadDraft,
    toggleStar,
    toggleSave,
    togglePin,
    bulkDelete,
    bulkForward,
    flushQueue,
  };
}
