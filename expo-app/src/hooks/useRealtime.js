import { useEffect, useRef, useState } from "react";
import { useRealtimeContext } from "../context/RealtimeContext";
import realtime from "../api/realtime";

export function useRealtime() {
  const ctx = useRealtimeContext();
  return {
    ...ctx,
    isConnected: ctx.isConnected,
  };
}

export function usePresence(userId) {
  const { isConnected } = useRealtimeContext();
  const [here, setHere] = useState([]);
  const hereRef = useRef([]);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId || !isConnected) return undefined;

    const channelName = `presence.users.${userId}`;
    const channel = realtime.subscribePresence(channelName, userId, {
      onHere: (users) => {
        hereRef.current = Array.isArray(users) ? users : [];
        setHere(hereRef.current);
      },
      onJoining: (user) => {
        if (user && !hereRef.current.some((u) => u.id === user.id)) {
          hereRef.current = [...hereRef.current, user];
          setHere(hereRef.current);
        }
      },
      onLeaving: (user) => {
        if (user) {
          hereRef.current = hereRef.current.filter((u) => u.id !== user.id);
          setHere(hereRef.current);
        }
      },
    });

    channelRef.current = channel;

    return () => {
      realtime.leave(channelName);
      channelRef.current = null;
    };
  }, [userId, isConnected]);

  return { here, hereCount: here.length };
}
