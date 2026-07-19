import AsyncStorage from "@react-native-async-storage/async-storage";

const MESSAGES_KEY = "cached_messages";
const QUEUE_KEY = "offline_queue";
const DRAFT_PREFIX = "draft_";
const META_PREFIX = "meta_";

export const cacheMessages = async (userId, messages) => {
  try {
    const key = `${MESSAGES_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages.slice(-50)));
  } catch (e) {
    console.warn("Cache error:", e);
  }
};

export const getCachedMessages = async (userId) => {
  try {
    const key = `${MESSAGES_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addToOfflineQueue = async (message) => {
  try {
    const queue = await getOfflineQueue();
    queue.push({ ...message, queued_at: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("Queue error:", e);
  }
};

export const getOfflineQueue = async () => {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const clearOfflineQueue = async () => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (e) {
    console.warn("Clear queue error:", e);
  }
};

export const removeFromOfflineQueue = async (tempId) => {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((m) => m.temp_id !== tempId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn("Remove queue error:", e);
  }
};

export const cacheDraft = async (userId, text) => {
  try {
    if (text === null || text === undefined || text === "") {
      await AsyncStorage.removeItem(`${DRAFT_PREFIX}${userId}`);
    } else {
      await AsyncStorage.setItem(`${DRAFT_PREFIX}${userId}`, text);
    }
  } catch (e) {
    console.warn("Cache draft error:", e);
  }
};

export const getDraft = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(`${DRAFT_PREFIX}${userId}`);
    return data || "";
  } catch (e) {
    return "";
  }
};

export const cacheMessageMeta = async (userId, meta) => {
  try {
    await AsyncStorage.setItem(`${META_PREFIX}${userId}`, JSON.stringify(meta));
  } catch (e) {
    console.warn("Cache meta error:", e);
  }
};

export const getCachedMeta = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(`${META_PREFIX}${userId}`);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const searchCache = async (userId, query) => {
  try {
    const messages = await getCachedMessages(userId);
    const q = (query || "").toLowerCase().trim();
    if (!q) return [];
    return messages.filter((m) => (m.content || "").toLowerCase().includes(q));
  } catch (e) {
    return [];
  }
};
