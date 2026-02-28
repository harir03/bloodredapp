import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KPICard } from "../../components/ui/KPICard";
import { NotificationBell } from "../../components/ui/NotificationBell";
import { KPISkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { bloodRequestService, staffService } from "../../services";
import { useAuth } from "../../stores/AuthProvider";

const screenWidth = Dimensions.get("window").width;

interface KPI {
  totalStaff: number;
  onDuty: number;
  onLeave: number;
  newApplicants: number;
}

export default function HRDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { userName } = useAuth();
  const [kpi, setKpi] = useState<KPI>({
    totalStaff: 0,
    onDuty: 0,
    onLeave: 0,
    newApplicants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyTrend, setDailyTrend] = useState<{ labels: string[]; datasets: { data: number[] }[] } | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [totalRes, activeRes, leaveRes, inactiveRes, trendRes] = await Promise.all([
        staffService.count(),
        staffService.count({ status: "active" }),
        staffService.count({ status: "on_leave" }),
        staffService.count({ status: "inactive" }),
        bloodRequestService.getDailyStats(),
      ]);

      setKpi({
        totalStaff: totalRes.count ?? 0,
        onDuty: activeRes.count ?? 0,
        onLeave: leaveRes.count ?? 0,
        newApplicants: inactiveRes.count ?? 0,
      });

      setDailyTrend({
        labels: trendRes.labels,
        datasets: [{ data: trendRes.data.length > 0 ? trendRes.data : [0, 0, 0, 0, 0, 0, 0] }]
      });
    } catch (e) {
      console.log("HR Dashboard load error:", e);
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

  const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.primary
    },
    fillShadowGradient: COLORS.primary,
    fillShadowGradientOpacity: 0.1,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + SPACING.l }]}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{userName?.split(" ")?.[0] || "HR"} 👔</Text>
        </View>
        <NotificationBell onPress={() => navigation.navigate("Notifications")} />
      </View>

      {/* Daily Activity Summary Chart */}
      <View style={styles.trendContainer}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>Recent Request Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Reports")}>
            <Text style={styles.viewMore}>View Full Report</Text>
          </TouchableOpacity>
        </View>
        {dailyTrend ? (
          <LineChart
            data={dailyTrend}
            width={screenWidth - SPACING.m * 2}
            height={160}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            transparent
          />
        ) : (
          <View style={[styles.chart, { height: 160, backgroundColor: COLORS.background, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ ...FONTS.caption, color: COLORS.text_muted }}>Loading trend data...</Text>
          </View>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>HR Overview</Text>
        <View style={styles.kpiGrid}>
          {loading ? (
            <>
              <View style={styles.kpiWrapper}><KPISkeleton /></View>
              <View style={styles.kpiWrapper}><KPISkeleton /></View>
              <View style={styles.kpiWrapper}><KPISkeleton /></View>
              <View style={styles.kpiWrapper}><KPISkeleton /></View>
            </>
          ) : (
            <>
              <View style={styles.kpiWrapper}>
                <KPICard
                  label="Total Staff"
                  value={kpi.totalStaff}
                  icon="people"
                  color={COLORS.primary}
                  compact
                />
              </View>
              <View style={styles.kpiWrapper}>
                <KPICard
                  label="On Duty"
                  value={kpi.onDuty}
                  icon="briefcase"
                  color={COLORS.success}
                  compact
                />
              </View>
              <View style={styles.kpiWrapper}>
                <KPICard
                  label="On Leave"
                  value={kpi.onLeave}
                  icon="calendar"
                  color={COLORS.warning}
                  compact
                />
              </View>
              <View style={styles.kpiWrapper}>
                <KPICard
                  label="Inactive"
                  value={kpi.newApplicants}
                  icon="person-remove"
                  color={COLORS.text_muted}
                  compact
                />
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionItem
            label="Staff Directory"
            icon="list"
            color={COLORS.primary}
            onPress={() => navigation.navigate("ManageStaff")}
          />
          <ActionItem
            label="Add Staff"
            icon="person-add"
            color={COLORS.success}
            onPress={() => navigation.navigate("AddStaff")}
          />
          <ActionItem
            label="Approvals"
            icon="checkmark-circle"
            color={COLORS.warning}
            onPress={() => Alert.alert("Coming Soon", "Leave approvals pending integration.")}
          />
          <ActionItem
            label="Reports"
            icon="stats-chart"
            color={COLORS.info || COLORS.primary}
            onPress={() => navigation.navigate("Reports")}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function ActionItem({ label, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.l,
  },
  greeting: { ...FONTS.body, color: COLORS.text_secondary },
  name: { ...FONTS.h2, color: COLORS.text_primary },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.m,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendContainer: {
    marginHorizontal: SPACING.m,
    padding: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  trendTitle: { ...FONTS.h4, color: COLORS.text_primary },
  viewMore: { ...FONTS.caption, color: COLORS.primary, fontWeight: "600" as any },
  chart: { marginVertical: 8, paddingRight: 0 },
  statsSection: { paddingHorizontal: SPACING.m, marginBottom: SPACING.l },
  sectionTitle: { ...FONTS.h4, color: COLORS.text_primary, marginBottom: SPACING.m },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -SPACING.xs },
  kpiWrapper: { width: "50%", padding: SPACING.xs },
  actionSection: { paddingHorizontal: SPACING.m },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -SPACING.xs },
  actionBtn: {
    width: "25%",
    padding: SPACING.xs,
    alignItems: "center",
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: RADII.m,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    ...FONTS.body3,
    color: COLORS.text_primary,
    fontWeight: "600",
  },
});
