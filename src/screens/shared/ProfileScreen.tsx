import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BloodGroupBadge } from "../../components/ui/BloodGroupBadge";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 36 }} />
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
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(profile as any)?.badges?.length ?? 0}
                </Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>
          </View>
        )}

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
    paddingTop: SPACING.xxl,
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
