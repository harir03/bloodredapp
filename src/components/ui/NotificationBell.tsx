import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/theme";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../stores/AuthProvider";

interface NotificationBellProps {
    onPress: () => void;
}

export const NotificationBell = ({ onPress }: NotificationBellProps) => {
    const { userId } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        const unsub = notificationService.subscribeForUser(userId, (items) => {
            setUnreadCount(items.filter((n) => !n.read).length);
        });
        return unsub;
    }, [userId]);

    return (
        <TouchableOpacity style={styles.btn} onPress={onPress}>
            <Ionicons
                name="notifications-outline"
                size={22}
                color={COLORS.text_primary}
            />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    btn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    badge: {
        position: "absolute",
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: "800",
        color: COLORS.white,
    },
});
