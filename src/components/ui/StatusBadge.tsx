
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, SIZES } from '../../constants/theme';

type StatusType = 'Pending' | 'Active' | 'Completed' | 'Escalated' | 'Inactive';

interface StatusBadgeProps {
  status: StatusType;
  style?: ViewStyle;
}

const statusConfig = {
  Pending: { backgroundColor: COLORS.warning, color: COLORS.background },
  Active: { backgroundColor: COLORS.info, color: COLORS.text_primary },
  Completed: { backgroundColor: COLORS.success, color: COLORS.text_primary },
  Escalated: { backgroundColor: COLORS.danger, color: COLORS.text_primary },
  Inactive: { backgroundColor: COLORS.text_muted, color: COLORS.background },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withTiming(1, { duration: 300 }) }],
      opacity: withTiming(1, { duration: 300 }),
    };
  });

  const { backgroundColor, color } = statusConfig[status];

  return (
    <Animated.View style={[styles.badge, { backgroundColor }, animatedStyle, style]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...FONTS.label,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default StatusBadge;
