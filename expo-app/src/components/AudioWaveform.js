import React, { useEffect, useRef, memo } from "react";
import { View, StyleSheet, Animated } from "react-native";

const AudioWaveform = memo(({ playing, width = 120, height = 30, color = "#fff" }) => {
  const animatedValues = useRef(Array.from({ length: 28 }, () => new Animated.Value(0.3))).current;
  const loopRef = useRef(null);

  useEffect(() => {
    if (playing) {
      const animate = () => {
        const animations = animatedValues.map((val, i) =>
          Animated.sequence([
            Animated.timing(val, {
              toValue: Math.random() * 0.7 + 0.3,
              duration: 120 + Math.random() * 180,
              useNativeDriver: false,
            }),
            Animated.timing(val, {
              toValue: 0.15 + Math.random() * 0.25,
              duration: 120 + Math.random() * 180,
              useNativeDriver: false,
            }),
          ])
        );
        loopRef.current = Animated.parallel(animations);
        loopRef.current.start(() => {
          if (playing) animate();
        });
      };
      animate();
    } else {
      if (loopRef.current) loopRef.current.stop();
      Animated.parallel(
        animatedValues.map((val) =>
          Animated.timing(val, { toValue: 0.3, duration: 300, useNativeDriver: false })
        )
      ).start();
    }
    return () => { if (loopRef.current) loopRef.current.stop(); };
  }, [playing]);

  const barWidth = width / 28;

  return (
    <View style={[styles.container, { width, height }]}>
      {animatedValues.map((val, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              width: Math.max(barWidth - 2, 2),
              backgroundColor: color,
              height: val.interpolate({ inputRange: [0, 1], outputRange: [2, height] }),
              opacity: 0.7 + (playing ? 0.3 : 0),
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bar: { borderRadius: 2, marginHorizontal: 0.5 },
});

export default AudioWaveform;
