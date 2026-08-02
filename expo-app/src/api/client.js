import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api";

let onAuthExpired = null;

export function setAuthExpiredHandler(handler) {
  onAuthExpired = handler;
}

const client = axios.create({ baseURL: API, timeout: 30000 });

let currentToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

client.interceptors.request.use(async (config) => {
  if (!currentToken) {
    currentToken = await AsyncStorage.getItem("token");
  }
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

let last401 = 0;

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const url = err.config?.url;
    const reqToken = err.config?.headers?.Authorization?.replace("Bearer ", "");

    if (status === 401 && url?.includes("/auth/refresh")) {
      currentToken = null;
      await AsyncStorage.multiRemove(["token", "user"]);
      if (onAuthExpired) onAuthExpired();
      return Promise.reject(err);
    }

    if (status === 401 && !url?.includes("/auth/")) {
      if (reqToken && reqToken !== currentToken) return Promise.reject(err);
      const now = Date.now();
      if (now - last401 > 3000) {
        last401 = now;
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const oldToken = currentToken;
            const res = await client.post("/auth/refresh");
            const newToken = res.data.token;
            currentToken = newToken;
            await AsyncStorage.setItem("token", newToken);
            onRefreshed(newToken);
            isRefreshing = false;
            err.config.headers.Authorization = `Bearer ${newToken}`;
            return client(err.config);
          } catch (refreshErr) {
            isRefreshing = false;
            refreshSubscribers = [];
            currentToken = null;
            await AsyncStorage.multiRemove(["token", "user"]);
            if (onAuthExpired) onAuthExpired();
            return Promise.reject(refreshErr);
          }
        } else {
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken) => {
              err.config.headers.Authorization = `Bearer ${newToken}`;
              resolve(client(err.config));
            });
          });
        }
      }
    }

    return Promise.reject(err);
  }
);

export function setAuthToken(token) {
  currentToken = token;
}

export const IMAGE_BASE = API.replace("/api", "");

export const resolveUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("file://") || path.startsWith("content://")) return path;
  return `${IMAGE_BASE}${path}`;
};

export const uploadWithProgress = (url, form, onProgress) =>
  client.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(e.loaded / e.total);
    },
  });

export default client;
