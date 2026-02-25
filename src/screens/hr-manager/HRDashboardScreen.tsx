import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { KPICard } from "../../components/ui/KPICard";
import { KPISkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { staffService } from "../../services";
import { useAuth } from "../../stores/AuthProvider";

interface KPI {
  totalStaff: number;
  onDuty: number;
  onLeave: number;
  newApplicants: number;
}

export default function HRDashboardScreen({ navigation }: any) {
  const { userName } = useAuth();
  const [kpi, setKpi] = useState<KPI>({
    totalStaff: 0,
    onDuty: 0,
    onLeave: 0,
    newApplicants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [total, active, leave, inactive] = await Promise.all([
        staffService.count(),
        staffService.count({ status: "active" }),
        staffService.count({ status: "on_leave" }),
        staffService.count({ status: "inactive" }),
      ]);
      setKpi({
        totalStaff: total ?? 0,
        onDuty: active ?? 0,
        onLeave: leave ?? 0,
        newApplicants: inactive ?? 0,
      });
    } catch (e) {
      console.log("HR KPI error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{userName?.split(" ")[0] ?? "HR"} 👔</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.text_primary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Staff Overview</Text>
      {loading ? (
        <View style={styles.kpiGrid}>
          {[1, 2, 3, 4].map((i) => (
            <KPISkeleton key={i} />
          ))}
        </View>
      ) : (
        <View style={styles.kpiGrid}>
          <KPICard
            label="Total Staff"
            value={kpi.totalStaff}
            icon="people"
            color={COLORS.primary}
            onPress={() => navigation.navigate("ManageStaff")}
          />
          <KPICard
            label="On Duty"
            value={kpi.onDuty}
            icon="checkmark-circle"
            color={COLORS.success}
          />
          <KPICard
            label="On Leave"
            value={kpi.onLeave}
            icon="time"
            color={COLORS.warning}
          />
          <KPICard
            label="Applicants"
            value={kpi.newApplicants}
            icon="person-add"
            color={COLORS.info}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {[
          {
            icon: "people-outline",
            label: "Manage Staff",
            route: "ManageStaff",
          },
          { icon: "person-add-outline", label: "Add Staff", route: "AddStaff" },
          {
            icon: "notifications-outline",
            label: "Notifications",
            route: "Notifications",
          },
          { icon: "person-circle-outline", label: "Profile", route: "Profile" },
        ].map((action) => (
          <TouchableOpacity
            key={action.route}
            style={styles.actionBtn}
            onPress={() => navigation.navigate(action.route)}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name={action.icon as any}
                size={22}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.m,
  },
  greeting: { ...FONTS.body2, color: COLORS.text_muted },
  name: { ...FONTS.h2, color: COLORS.text_primary },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text_secondary,
    marginHorizontal: SPACING.l,
    marginTop: SPACING.l,
    marginBottom: SPACING.s,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.m,
    gap: SPACING.s,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  actionBtn: {
    width: "46%",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    padding: SPACING.m,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.s,
  },
  actionLabel: {
    ...FONTS.body3,
    color: COLORS.text_primary,
    fontWeight: "600",
  },
});
