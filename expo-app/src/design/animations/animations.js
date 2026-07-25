import { useRef, useCallback, useEffect } from "react";
import { Animated } from "react-native";
import { ANIMATION } from "../DesignSystem";

export function useSpringValue(initial = 0) {
  const val = useRef(new Animated.Value(initial)).current;
  const springTo = useCallback((to, config) => {
    Animated.spring(val, { ...ANIMATION.spring, toValue: to, ...config }).start();
  }, [val]);
  const reset = useCallback(() => val.setValue(initial), [val, initial]);
  return { val, springTo, reset };
}

export function useFadeIn(delay = 0) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(val, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, [val, delay]);
  return { opacity: val };
}

export function useSlideIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 150, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return { opacity, translateY };
}

export function useScaleIn(delay = 0) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 180, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity, delay]);
  return { scale, opacity };
}

export function usePulse() {
  const val = useRef(new Animated.Value(1)).current;
  const start = useCallback(() => {
    Animated.sequence([
      Animated.timing(val, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(val, { toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, [val]);
  return { val, start };
}

export function useSlideFromBottom() {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animate = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [translateY, opacity]);
  return { translateY, opacity, animate };
}

export function useStaggerAnimation(count, baseDelay = 80) {
  const anims = useRef([]);
  if (anims.current.length !== count) {
    anims.current = Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(24),
    }));
  }
  useEffect(() => {
    const st = Animated.stagger(baseDelay, anims.current.map((a) =>
      Animated.parallel([
        Animated.timing(a.opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(a.translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ])
    ));
    st.start();
    return () => st.stop();
  }, [count, baseDelay]);
  return anims.current;
}

export function useFloatAnimation(duration = 3000, range = 8) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration, useNativeDriver: true }),
      ])
    ).start();
  }, [val, duration]);
  return {
    translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -range] }),
  };
}

export function useBreathingAnimation(duration = 2500) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration, useNativeDriver: false }),
        Animated.timing(val, { toValue: 0, duration, useNativeDriver: false }),
      ])
    ).start();
  }, [val, duration]);
  return {
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
  };
}
