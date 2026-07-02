import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "https://sonix-production.up.railway.app/api";

const client = axios.create({ baseURL: API, timeout: 15000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(["token", "user"]);
    }
    return Promise.reject(err);
  }
);

export const IMAGE_BASE = API.replace("/api", "");

export default client;
