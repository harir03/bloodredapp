import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ListItemSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../stores/AuthProvider";
import type { AppNotification } from "../../types/database";

const ICON_MAP: Record<string, { name: any; color: string }> = {
  blood_request: { name: "water", color: COLORS.danger },
  task_assigned: { name: "clipboard", color: COLORS.primary },
  escalation: { name: "arrow-up-circle", color: COLORS.escalated },
  system: { name: "information-circle", color: COLORS.info },
  badge_earned: { name: "trophy", color: "#F5C518" },
};

function timeAgo(date: Date | string): string {
  const ms = new Date().getTime() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    const unsub = notificationService.subscribeForUser(profile.id, (items) => {
      setNotifications(items);
      setLoading(false);
    });
    return unsub;
  }, [profile?.id]);

  const handleMarkAll = useCallback(async () => {
    if (!profile?.id) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllRead(profile.id);
    } finally {
      setMarkingAll(false);
    }
  }, [profile?.id]);

  const handleMarkRead = useCallback(async (id: string) => {
    await notificationService.markRead(id);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = ({ item }: { item: AppNotification }) => {
    const icon = ICON_MAP[item.type] ?? ICON_MAP.system;
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => {
          handleMarkRead(item.id);
          // Navigate to details if deepLink present
          if (item.deepLink) {
            try {
              const parts = item.deepLink.split("/");
              if (parts[0] === "request" && parts[1]) {
                navigation.navigate("BloodRequestDetails", {
                  requestId: parts[1],
                });
              } else if (parts[0] === "task" && parts[1]) {
                navigation.navigate("TaskDetails", { taskId: parts[1] });
              }
            } catch (_) {}
          }
        }}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: icon.color + "22" }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.notifTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notifBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAll}
            disabled={markingAll}
          >
            <Text style={styles.markAllText}>
              {markingAll ? "Marking..." : "Mark all read"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ padding: SPACING.l }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="notifications-off-outline"
                size={52}
                color={COLORS.text_muted}
              />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.l,
    paddingTop: SPACING.xxl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...FONTS.h3, color: COLORS.text_primary },
  subtitle: { ...FONTS.caption, color: COLORS.primary, marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.m,
    backgroundColor: COLORS.primary + "22",
  },
  markAllText: { ...FONTS.caption, color: COLORS.primary, fontWeight: "600" },
  list: { paddingVertical: SPACING.s, paddingBottom: SPACING.xxl },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  itemUnread: { backgroundColor: COLORS.primary + "0A" },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: { flex: 1 },
  notifTitle: { ...FONTS.h4, color: COLORS.text_primary, marginBottom: 3 },
  notifBody: { ...FONTS.body3, color: COLORS.text_secondary, lineHeight: 18 },
  time: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 5 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border + "60",
    marginLeft: 66,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.text_primary },
  emptyText: { ...FONTS.body2, color: COLORS.text_muted },
});
