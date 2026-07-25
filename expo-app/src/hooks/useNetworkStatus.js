import { useState, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

let globalIsOnline = true;
const listeners = new Set();

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(globalIsOnline);
  const mounted = useRef(true);

  useEffect(() => {
    const handler = (online) => {
      globalIsOnline = online;
      if (mounted.current) setIsOnline(online);
    };
    listeners.add(handler);

    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      globalIsOnline = online;
      listeners.forEach((fn) => fn(online));
    });

    return () => {
      mounted.current = false;
      listeners.delete(handler);
      unsub();
    };
  }, []);

  return isOnline;
}

export function getNetworkStatus() {
  return globalIsOnline;
}
