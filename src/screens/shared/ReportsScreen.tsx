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
import { bloodRequestService } from "../../services/bloodRequestService";
import { donorService } from "../../services/donorService";
import { eventService } from "../../services/eventService";
import { staffService } from "../../services/staffService";
import { taskService } from "../../services/taskService";
import { volunteerService } from "../../services/volunteerService";

type StatSection = {
  title: string;
  icon: string;
  color: string;
  items: { label: string; value: string | number }[];
};

export default function ReportsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    totalVolunteers: 0,
    activeVolunteers: 0,
    totalDonors: 0,
    totalStaff: 0,
    openRequests: 0,
    resolvedRequests: 0,
    criticalRequests: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingEvents: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [
        volunteers,
        activeVols,
        donors,
        staff,
        reqStats,
        tasks,
        completedTasks,
        events,
      ] = await Promise.all([
        volunteerService.getAll(),
        volunteerService.getAll({ filters: { status: "active" } }),
        donorService.getAll(),
        staffService.getAll(),
        bloodRequestService.getRecentStats(),
        taskService.getAll(),
        taskService.getAll({ filters: { status: "completed" } }),
        eventService.getUpcoming(),
      ]);

      setKpis({
        totalVolunteers: volunteers.data?.length ?? 0,
        activeVolunteers: activeVols.data?.length ?? 0,
        totalDonors: donors.data?.length ?? 0,
        totalStaff: staff.data?.length ?? 0,
        openRequests: reqStats.pending ?? 0,
        resolvedRequests: reqStats.resolved ?? 0,
        criticalRequests: reqStats.critical ?? 0,
        totalTasks: tasks.data?.length ?? 0,
        completedTasks: completedTasks.data?.length ?? 0,
        upcomingEvents: events.data?.length ?? 0,
      });
    } catch (e) {
      // fail silently — show zeros
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const sections: StatSection[] = [
    {
      title: "Volunteers",
      icon: "people",
      color: COLORS.primary,
      items: [
        { label: "Total Volunteers", value: kpis.totalVolunteers },
        { label: "Active Volunteers", value: kpis.activeVolunteers },
        {
          label: "Inactive",
          value: kpis.totalVolunteers - kpis.activeVolunteers,
        },
        {
          label: "Activation Rate",
          value:
            kpis.totalVolunteers > 0
              ? `${Math.round((kpis.activeVolunteers / kpis.totalVolunteers) * 100)}%`
              : "—",
        },
      ],
    },
    {
      title: "Blood Requests",
      icon: "water",
      color: COLORS.danger,
      items: [
        {
          label: "Total",
          value:
            kpis.openRequests + kpis.resolvedRequests + kpis.criticalRequests,
        },
        { label: "Open / Pending", value: kpis.openRequests },
        { label: "Critical", value: kpis.criticalRequests },
        { label: "Resolved", value: kpis.resolvedRequests },
      ],
    },
    {
      title: "Tasks",
      icon: "checkmark-circle",
      color: COLORS.success,
      items: [
        { label: "Total Tasks", value: kpis.totalTasks },
        { label: "Completed", value: kpis.completedTasks },
        {
          label: "Pending",
          value: kpis.totalTasks - kpis.completedTasks,
        },
        {
          label: "Completion Rate",
          value:
            kpis.totalTasks > 0
              ? `${Math.round((kpis.completedTasks / kpis.totalTasks) * 100)}%`
              : "—",
        },
      ],
    },
    {
      title: "People & Events",
      icon: "stats-chart",
      color: COLORS.warning,
      items: [
        { label: "Total Donors", value: kpis.totalDonors },
        { label: "Total Staff", value: kpis.totalStaff },
        { label: "Upcoming Events", value: kpis.upcomingEvents },
      ],
    },
  ];

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
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* KPI Overview Row */}
        <Text style={styles.sectionTitle}>Overview</Text>
        {loading ? (
          <View style={styles.kpiGrid}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={styles.kpiWrap}>
                <KPISkeleton />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiWrap}>
              <KPICard
                label="Volunteers"
                value={kpis.totalVolunteers}
                icon="people"
                color={COLORS.primary}
                compact
              />
            </View>
            <View style={styles.kpiWrap}>
              <KPICard
                label="Donors"
                value={kpis.totalDonors}
                icon="heart"
                color={COLORS.danger}
                compact
              />
            </View>
            <View style={styles.kpiWrap}>
              <KPICard
                label="Open Requests"
                value={kpis.openRequests}
                icon="water"
                color={COLORS.warning}
                compact
              />
            </View>
            <View style={styles.kpiWrap}>
              <KPICard
                label="Resolved"
                value={kpis.resolvedRequests}
                icon="checkmark-circle"
                color={COLORS.success}
                compact
              />
            </View>
            <View style={styles.kpiWrap}>
              <KPICard
                label="Tasks Done"
                value={kpis.completedTasks}
                icon="list"
                color={COLORS.info ?? COLORS.primary}
                compact
              />
            </View>
            <View style={styles.kpiWrap}>
              <KPICard
                label="Events"
                value={kpis.upcomingEvents}
                icon="calendar"
                color="#9C27B0"
                compact
              />
            </View>
          </View>
        )}

        {/* Detailed Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: section.color + "22" },
                ]}
              >
                <Ionicons
                  name={section.icon as any}
                  size={18}
                  color={section.color}
                />
              </View>
              <Text style={styles.cardTitle}>{section.title}</Text>
            </View>
            {loading ? (
              <View style={{ gap: 8 }}>
                {[...Array(4)].map((_, i) => (
                  <View key={i} style={styles.skeletonRow} />
                ))}
              </View>
            ) : (
              section.items.map((item, idx) => (
                <View
                  key={item.label}
                  style={[
                    styles.statRow,
                    idx < section.items.length - 1 && styles.statRowBorder,
                  ]}
                >
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={[styles.statValue, { color: section.color }]}>
                    {item.value}
                  </Text>
                </View>
              ))
            )}
          </View>
        ))}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { ...FONTS.h3, color: COLORS.text_primary },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.m,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.m,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: SPACING.m },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text_primary,
    marginBottom: SPACING.m,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.l,
  },
  kpiWrap: {
    width: "50%",
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.s,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: RADII.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.s,
  },
  cardTitle: { ...FONTS.h4, color: COLORS.text_primary },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.s,
  },
  statRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: { ...FONTS.body, color: COLORS.text_secondary },
  statValue: { ...FONTS.h4, minWidth: 50, textAlign: "right" },
  skeletonRow: {
    height: 16,
    borderRadius: RADII.s,
    backgroundColor: COLORS.border,
    marginBottom: 8,
  },
});
