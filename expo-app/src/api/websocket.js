import AsyncStorage from "@react-native-async-storage/async-storage";
import { IMAGE_BASE } from "./client";

let echoInstance = null;

export const getEcho = async () => {
  if (echoInstance) return echoInstance;

  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;

    const Echo = (await import("laravel-echo")).default;
    const Pusher = (await import("pusher-js/react-native")).default;

    echoInstance = new Echo({
      broadcaster: "pusher",
      client: Pusher,
      key: process.env.EXPO_PUBLIC_REVERB_KEY || "your-reverb-key",
      wsHost: process.env.EXPO_PUBLIC_WS_HOST || "localhost",
      wsPort: 443,
      wssPort: 443,
      forceTLS: true,
      disableStats: true,
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${IMAGE_BASE}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    });

    return echoInstance;
  } catch (e) {
    echoInstance = null;
    return null;
  }
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};
