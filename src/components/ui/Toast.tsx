import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import { Toast as ToastType } from "../../types/toast";

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const translateY = useSharedValue(-100);

  useEffect(() => {
    translateY.value = withSpring(60, { damping: 15, stiffness: 150 });

    const timer = setTimeout(() => {
      translateY.value = withTiming(-100, {}, () => {
        runOnJS(onDismiss)(toast.id);
      });
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast, translateY, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const containerStyle = [
    styles.container,
    styles[toast.type || "info"],
    animatedStyle,
  ];

  return (
    <Animated.View style={containerStyle}>
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: SIZES.padding,
    right: SIZES.padding,
    padding: SIZES.base * 3,
    borderRadius: SIZES.radius,
    zIndex: 9999,
  },
  info: {
    backgroundColor: COLORS.info,
  },
  success: {
    backgroundColor: COLORS.success,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  warning: {
    backgroundColor: COLORS.warning,
  },
  text: {
    ...FONTS.body,
    color: COLORS.text_primary,
    textAlign: "center",
  },
});

export default Toast;
