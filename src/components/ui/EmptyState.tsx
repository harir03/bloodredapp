
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message }) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  iconContainer: {
    marginBottom: SPACING.l,
  },
  message: {
    ...FONTS.h3,
    color: COLORS.text_muted,
    textAlign: 'center',
  },
});

export default EmptyState;
