import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
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
import { helplineService, taskService, volunteerService } from "../../services";
import { bloodRequestService } from "../../services/bloodRequestService";
import { useAuth } from "../../stores/AuthProvider";

interface KPI {
  volunteers: number;
  activeCalls: number;
  resolvedCalls: number;
  pendingTasks: number;
  pendingRequests: number;
  criticalRequests: number;
}

export default function CityManagerDashboardScreen({ navigation }: any) {
  const { userName } = useAuth();
  const [kpi, setKpi] = useState<KPI>({
    volunteers: 0,
    activeCalls: 0,
    resolvedCalls: 0,
    pendingTasks: 0,
    pendingRequests: 0,
    criticalRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [volRes, activeCallRes, resolvedCallRes, taskRes, reqStats] =
        await Promise.all([
          volunteerService.count({ status: "active" }),
          helplineService.count({ status: "in_progress" }),
          helplineService.count({ status: "resolved" }),
          taskService.count({ status: "pending" }),
          bloodRequestService.getRecentStats(),
        ]);
      setKpi({
        volunteers: volRes.count ?? 0,
        activeCalls: activeCallRes.count ?? 0,
        resolvedCalls: resolvedCallRes.count ?? 0,
        pendingTasks: taskRes.count ?? 0,
        pendingRequests: reqStats.pending ?? 0,
        criticalRequests: reqStats.critical ?? 0,
      });
    } catch (e) {
      console.log("CityManager KPI error:", e);
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>
            {userName?.split(" ")[0] ?? "Manager"} 🏙️
          </Text>
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

      {/* KPI Grid */}
      <Text style={styles.sectionTitle}>City Overview</Text>
      {loading ? (
        <View style={styles.kpiGrid}>
          {[1, 2, 3, 4].map((i) => (
            <KPISkeleton key={i} />
          ))}
        </View>
      ) : (
        <View style={styles.kpiGrid}>
          <KPICard
            label="Active Volunteers"
            value={kpi.volunteers}
            icon="people"
            color={COLORS.primary}
            onPress={() => navigation.navigate("Volunteers")}
          />
          <KPICard
            label="Active Calls"
            value={kpi.activeCalls}
            icon="call"
            color={COLORS.warning}
          />
          <KPICard
            label="Resolved Cases"
            value={kpi.resolvedCalls}
            icon="checkmark-circle"
            color={COLORS.success}
          />
          <KPICard
            label="Pending Tasks"
            value={kpi.pendingTasks}
            icon="clipboard"
            color={COLORS.info}
          />
          <KPICard
            label="Pending Requests"
            value={kpi.pendingRequests}
            icon="water"
            color={COLORS.danger}
            onPress={() => navigation.navigate("ManageBloodRequests")}
          />
          <KPICard
            label="Critical Requests"
            value={kpi.criticalRequests}
            icon="alert-circle"
            color={COLORS.critical}
            onPress={() => navigation.navigate("ManageBloodRequests")}
          />
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {[
          {
            icon: "water-outline",
            label: "Blood Requests",
            route: "ManageBloodRequests",
          },
          {
            icon: "people-outline",
            label: "Volunteers",
            route: "Volunteers",
          },
          {
            icon: "trophy-outline",
            label: "Leaderboard",
            route: "Leaderboard",
          },
          {
            icon: "notifications-outline",
            label: "Notifications",
            route: "Notifications",
          },
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
