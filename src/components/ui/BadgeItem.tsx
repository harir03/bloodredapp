import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

interface BadgeItemProps {
    label: string;
    emoji: string;
    description: string;
    isLocked?: boolean;
    minPoints?: number;
}

export const BadgeItem = ({
    label,
    emoji,
    description,
    isLocked = false,
    minPoints,
}: BadgeItemProps) => {
    return (
        <View style={[styles.container, isLocked && styles.containerLocked]}>
            <View style={[styles.iconWrap, isLocked && styles.iconWrapLocked]}>
                {isLocked ? (
                    <Ionicons name="lock-closed" size={24} color={COLORS.text_muted} />
                ) : (
                    <Text style={styles.emoji}>{emoji}</Text>
                )}
            </View>
            <View style={styles.content}>
                <Text style={[styles.label, isLocked && styles.labelLocked]}>
                    {label}
                </Text>
                <Text style={styles.description}>{description}</Text>
                {isLocked && minPoints !== undefined && (
                    <Text style={styles.requirement}>Requires {minPoints} pts</Text>
                )}
            </View>
            {!isLocked && (
                <View style={styles.earnedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.s,
    },
    containerLocked: {
        opacity: 0.7,
        backgroundColor: COLORS.surface2,
    },
    iconWrap: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary + "18",
        alignItems: "center",
        justifyContent: "center",
        marginRight: SPACING.m,
    },
    iconWrapLocked: {
        backgroundColor: COLORS.border,
    },
    emoji: {
        fontSize: 24,
    },
    content: {
        flex: 1,
    },
    label: {
        ...FONTS.h4,
        color: COLORS.text_primary,
    },
    labelLocked: {
        color: COLORS.text_muted,
    },
    description: {
        ...FONTS.caption,
        color: COLORS.text_muted,
        marginTop: 2,
    },
    requirement: {
        ...FONTS.caption,
        color: COLORS.primary,
        fontWeight: "600",
        marginTop: 4,
    },
    earnedBadge: {
        padding: 4,
    }
});
