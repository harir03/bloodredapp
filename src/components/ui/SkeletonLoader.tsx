import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/theme";

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBox: React.FC<Props> = ({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: COLORS.shimmer_highlight,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.row}>
      <SkeletonBox width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
        <SkeletonBox height={14} width="60%" />
        <SkeletonBox height={11} width="40%" />
      </View>
    </View>
    <SkeletonBox height={10} style={{ marginTop: 12 }} />
    <SkeletonBox height={10} width="80%" style={{ marginTop: 6 }} />
  </View>
);

export const ListItemSkeleton: React.FC = () => (
  <View style={styles.listItem}>
    <SkeletonBox width={44} height={44} borderRadius={8} />
    <View style={{ flex: 1, marginLeft: 12, gap: 7 }}>
      <SkeletonBox height={13} width="55%" />
      <SkeletonBox height={10} width="35%" />
    </View>
    <SkeletonBox width={50} height={22} borderRadius={4} />
  </View>
);

export const KPISkeleton: React.FC = () => (
  <View style={styles.kpi}>
    <SkeletonBox width={32} height={32} borderRadius={8} />
    <SkeletonBox height={24} width="50%" style={{ marginTop: 12 }} />
    <SkeletonBox height={10} width="70%" style={{ marginTop: 8 }} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  listItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpi: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
