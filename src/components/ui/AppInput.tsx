
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { COLORS, FONTS, SPACING, SIZES } from '../../constants/theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  icon,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? COLORS.danger
    : isFocused
    ? COLORS.primary
    : COLORS.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, { borderColor }]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={COLORS.text_muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.l,
  },
  label: {
    ...FONTS.label,
    color: COLORS.text_primary,
    marginBottom: SPACING.s,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.m,
  },
  iconContainer: {
    marginRight: SPACING.m,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text_primary,
  },
  errorText: {
    ...FONTS.caption,
    color: COLORS.danger,
    marginTop: SPACING.s,
  },
});

export default AppInput;
