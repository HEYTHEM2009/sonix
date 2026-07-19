import React, { createContext, useContext, useEffect, useState } from "react";
import realtime from "../api/realtime";

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const [status, setStatus] = useState(realtime.status);
  const [echo, setEcho] = useState(() => realtime.getEcho());

  useEffect(() => {
    let mounted = true;

    realtime.init().then((instance) => {
      if (mounted && instance) {
        setEcho(instance);
      }
    });

    const unsubscribe = realtime.onStatus((next) => {
      if (mounted) setStatus(next);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    status,
    isConnected: status === "connected",
    echo,
    realtime,
  };

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtimeContext must be used within a RealtimeProvider");
  }
  return ctx;
}
