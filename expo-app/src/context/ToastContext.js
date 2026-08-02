import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, Text, Animated, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, RADIUS, TYPOGRAPHY } from "../design/DesignSystem";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = "info", duration = 3000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = {
    show,
    success: (m, d) => show(m, "success", d),
    error: (m, d) => show(m, "error", d),
    info: (m, d) => show(m, "info", d),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const opacity = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const bg =
    toast.type === "error" ? "#e74c3c" : toast.type === "success" ? "#27ae60" : "#2c2c44";

  return (
    <Animated.View style={[styles.toast, { opacity, backgroundColor: bg }]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onDismiss} activeOpacity={0.9}>
        <Text style={styles.text}>{toast.message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    maxWidth: "100%",
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  text: { color: COLORS.text, fontSize: 14, ...TYPOGRAPHY.bodyBold, textAlign: "center" },
});

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback so screens don't crash outside a provider.
    return { show: () => {}, success: () => {}, error: () => {}, info: () => {} };
  }
  return ctx;
}
