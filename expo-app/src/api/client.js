import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "https://sonix-production.up.railway.app/api";

const client = axios.create({ baseURL: API, timeout: 60000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("[API] No token found in AsyncStorage for:", config.url);
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const url = err.config?.url;
    const msg = err.response?.data?.message || err.message || "Network error";
    console.warn(`[API] Error ${status} on ${url}: ${msg}`);
    if (!err.response) {
      console.warn("[API] No response - server may be unreachable:", err.code);
    }
    return Promise.reject(err);
  }
);

export const IMAGE_BASE = API.replace("/api", "");

export default client;
