import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { BloodGroupBadge } from "../../components/ui/BloodGroupBadge";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { BADGES, computeBadges } from "../../services/leaderboardService";
import { useAuth } from "../../stores/AuthProvider";
import type { BloodGroup } from "../../types/database";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile, userName, userEmail, userRole, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }, [logout]);

  const viewRef = useRef(null);

  const handleShareProfile = async () => {
    try {
      const stats = {
        points: (profile as any)?.points || 0,
        tasks: (profile as any)?.tasks_completed || 0,
        badges: (profile as any)?.badges?.length || computeBadges((profile as any)?.points || 0).length,
      };

      const message = `I'm a proud BloodConnect Volunteer! 🩸\n\nImpact Stats:\n✨ ${stats.points} Points Earned\n✅ ${stats.tasks} Tasks Completed\n🏆 ${stats.badges} Badges Unlocked\n\nJoin me in saving lives! Download BloodConnect today. #BloodConnect #Volunteer #Impact`;

      let imageUri = null;
      try {
        if (viewRef.current) {
          imageUri = await captureRef(viewRef, {
            format: "png",
            quality: 0.9,
          });
        }
      } catch (e) {
        console.log("Failed to capture profile", e);
      }

      if (imageUri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          dialogTitle: "Share Profile Impact",
          mimeType: "image/png",
          UTI: "public.png",
        });
      } else {
        await Share.share({
          message,
          title: "My BloodConnect Impact",
        });
      }
    } catch (error: any) {
      Alert.alert("Sharing Error", error.message);
    }
  };

  const roleLabel: Record<string, string> = {
    admin: "Administrator",
    volunteer: "Volunteer",
    helpline: "Helpline Operator",
    city_manager: "City Manager",
    hr_manager: "HR Manager",
  };

  const initials = userName
    ? userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?";

  return (
    <View collapsable={false} ref={viewRef} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          onPress={handleShareProfile}
          style={styles.backBtn}
        >
          <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>
              {roleLabel[userRole ?? ""] ?? userRole}
            </Text>
          </View>
          {(profile as any)?.blood_group && (
            <View style={{ marginTop: 10 }}>
              <BloodGroupBadge
                group={(profile as any).blood_group as BloodGroup}
                size="md"
              />
            </View>
          )}
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <InfoRow icon="person-outline" label="Full Name" value={userName} />
          <InfoRow icon="mail-outline" label="Email" value={userEmail} />
          <InfoRow
            icon="location-outline"
            label="City"
            value={(profile as any)?.city ?? ""}
          />
          <InfoRow
            icon="call-outline"
            label="Phone"
            value={(profile as any)?.phone ?? ""}
          />
        </View>

        {/* Stats card (volunteer only) */}
        {userRole === "volunteer" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Volunteer Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(profile as any)?.tasks_completed ?? 0}
                </Text>
                <Text style={styles.statLabel}>Tasks Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(profile as any)?.points ?? 0}
                </Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => navigation.navigate("AllBadges")}
              >
                <Text style={styles.statValue}>
                  {(profile as any)?.badges?.length || computeBadges((profile as any)?.points || 0).length}
                </Text>
                <Text style={styles.statLabel}>Badges</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Badges Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Badges</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AllBadges")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgeRow}>
            {((profile as any)?.badges || computeBadges((profile as any)?.points || 0)).slice(0, 4).map((b: string) => {
              const info = BADGES[b];
              if (!info) return null;
              return (
                <View key={b} style={styles.badgeIconWrap}>
                  <Text style={styles.badgeEmoji}>{info.emoji}</Text>
                  <Text style={styles.badgeLabel} numberOfLines={1}>{info.label}</Text>
                </View>
              );
            })}
            {((profile as any)?.badges || computeBadges((profile as any)?.points || 0)).length === 0 && (
              <Text style={styles.emptyBadges}>No badges earned yet. Keep helping to unlock them!</Text>
            )}
          </View>
        </View>

        {/* Certificates */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Certificates")}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#8B5CF6" + "18", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="ribbon-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>My Certificates</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.text_muted }}>View & share your certificates</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.text_muted} />
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>
            {loggingOut ? "Signing out..." : "Sign Out"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>Blood Red App · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.l,
    paddingBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text_primary,
    flex: 1,
    textAlign: "center",
  },
  scroll: { paddingBottom: 40 },
  avatarSection: { alignItems: "center", paddingVertical: SPACING.xxl },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.m,
  },
  avatarText: { ...FONTS.h1, color: "#FFFFFF", fontSize: 32 },
  name: { ...FONTS.h2, color: COLORS.text_primary, marginBottom: 8 },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: COLORS.primary + "22",
    borderRadius: 20,
  },
  roleText: { ...FONTS.caption, color: COLORS.primary, fontWeight: "700" },
  card: {
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.text_primary,
    marginBottom: SPACING.m,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "55",
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.m,
  },
  infoLabel: { ...FONTS.caption, color: COLORS.text_muted },
  infoValue: { ...FONTS.body2, color: COLORS.text_primary, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: SPACING.s,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { ...FONTS.h2, color: COLORS.primary },
  statLabel: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: COLORS.border, height: "100%" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  viewAllText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeIconWrap: {
    alignItems: "center",
    width: (800 / 4) - 20, // Simplified for 4 items
    maxWidth: 70,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeLabel: {
    ...FONTS.caption,
    fontSize: 10,
    color: COLORS.text_secondary,
    textAlign: "center",
  },
  emptyBadges: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    fontStyle: "italic",
    textAlign: "center",
    width: "100%",
    paddingVertical: 10,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.l,
    marginTop: SPACING.m,
    padding: SPACING.m,
    borderRadius: RADII.l,
    borderWidth: 1,
    borderColor: COLORS.danger + "55",
    backgroundColor: COLORS.danger + "0F",
    gap: 10,
  },
  logoutText: { ...FONTS.h4, color: COLORS.danger },
  version: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    textAlign: "center",
    marginTop: SPACING.xl,
  },
});
