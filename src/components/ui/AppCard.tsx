
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  isPressable?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  onPress,
  isPressable = false,
}) => {
  const CardComponent = isPressable ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.card, SHADOWS.medium, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.base * 4, // 16px
  },
});

export default AppCard;
