import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

interface ListItemProps {
  title: string;
  subtitle?: string;
  rightText?: string;
  rightTextColor?: string;
  icon?: string;
  iconColor?: string;
  status?: string;
  onPress?: () => void;
  style?: object;
}

const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  rightText,
  rightTextColor,
  icon,
  iconColor = COLORS.text_muted,
  status,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {icon && (
        <View style={styles.iconContainer}>
          <FontAwesome5 name={icon} size={18} color={iconColor} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {status && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {status}
          </Text>
        )}
      </View>
      {rightText && (
        <Text
          style={[
            styles.rightText,
            rightTextColor ? { color: rightTextColor } : undefined,
          ]}
        >
          {rightText}
        </Text>
      )}
      {onPress && (
        <FontAwesome5
          name="chevron-right"
          size={12}
          color={COLORS.text_muted}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.s,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  content: {
    flex: 1,
  },
  title: {
    ...FONTS.body,
    color: COLORS.text_primary,
  },
  subtitle: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    marginTop: 2,
  },
  rightText: {
    ...FONTS.label,
    color: COLORS.text_muted,
    marginRight: SPACING.s,
  },
  chevron: {
    marginLeft: SPACING.xs,
  },
});

export default ListItem;
