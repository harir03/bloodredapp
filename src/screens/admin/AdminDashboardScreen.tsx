import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KPICard } from "../../components/ui/KPICard";
import { RequestCard } from "../../components/ui/RequestCard";
import { KPISkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { bloodRequestService } from "../../services/bloodRequestService";
import { donorService } from "../../services/donorService";
import { volunteerService } from "../../services/volunteerService";
import { useAuth } from "../../stores/AuthProvider";
import { BloodRequest } from "../../types/database";

interface KPIData {
  totalRequests: number;
  pending: number;
  critical: number;
  resolved: number;
  volunteers: number;
  donors: number;
}

export default function AdminDashboardScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [liveRequests, setLiveRequests] = useState<BloodRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiLoading, setKpiLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const loadKPI = useCallback(async () => {
    setKpiLoading(true);
    try {
      const [reqStats, volSnap, donorSnap] = await Promise.all([
        bloodRequestService.getRecentStats(),
        volunteerService.getAll({ filters: { status: "active" } }),
        donorService.getAll(),
      ]);
      setKpi({
        totalRequests: reqStats.total,
        pending: reqStats.pending,
        critical: reqStats.critical,
        resolved: reqStats.resolved,
        volunteers: volSnap.data?.length ?? 0,
        donors: donorSnap.data?.length ?? 0,
      });
    } catch (e) {
      console.log("KPI load error:", e);
    } finally {
      setKpiLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = bloodRequestService.subscribeToLive((reqs) => {
      setLiveRequests(reqs.slice(0, 15));
    });
    loadKPI();
    return unsub;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadKPI();
    setRefreshing(false);
  }, [loadKPI]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting()}, {profile?.name?.split(" ")[0]} 👋
          </Text>
          <Text style={styles.headerSub}>Admin Command Center</Text>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* KPI Section */}
        <Text style={styles.sectionTitle}>Overview</Text>
        {kpiLoading ? (
          <View style={styles.kpiGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.kpiCell}>
                <KPISkeleton />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            {[
              {
                label: "Total Requests",
                value: kpi?.totalRequests ?? 0,
                icon: "water-outline" as const,
                color: COLORS.primary,
                screen: "ManageBloodRequests",
              },
              {
                label: "Pending",
                value: kpi?.pending ?? 0,
                icon: "time-outline" as const,
                color: COLORS.warning,
                screen: "ManageBloodRequests",
              },
              {
                label: "Critical",
                value: kpi?.critical ?? 0,
                icon: "alert-circle-outline" as const,
                color: COLORS.critical,
                screen: "ManageBloodRequests",
              },
              {
                label: "Resolved",
                value: kpi?.resolved ?? 0,
                icon: "checkmark-circle-outline" as const,
                color: COLORS.success,
              },
              {
                label: "Active Volunteers",
                value: kpi?.volunteers ?? 0,
                icon: "people-outline" as const,
                color: COLORS.info,
                screen: "Users",
              },
              {
                label: "Donors",
                value: kpi?.donors ?? 0,
                icon: "heart-outline" as const,
                color: COLORS.accent,
                screen: "ManageDonors",
              },
            ].map((k) => (
              <View key={k.label} style={styles.kpiCell}>
                <KPICard
                  label={k.label}
                  value={k.value}
                  icon={k.icon}
                  color={k.color}
                  onPress={
                    k.screen ? () => navigation.navigate(k.screen!) : undefined
                  }
                />
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            {
              icon: "add-circle-outline" as const,
              label: "New Request",
              color: COLORS.primary,
              screen: "AddBloodRequest",
            },
            {
              icon: "person-add-outline" as const,
              label: "Add User",
              color: COLORS.info,
              screen: "AddUser",
            },
            {
              icon: "calendar-outline" as const,
              label: "New Event",
              color: COLORS.success,
              screen: "AddEvent",
            },
            {
              icon: "bar-chart-outline" as const,
              label: "Reports",
              color: COLORS.warning,
              screen: "Reports",
            },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickBtn}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.75}
            >
              <View
                style={[styles.quickIcon, { backgroundColor: a.color + "22" }]}
              >
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live Ticker */}
        <View style={styles.liveHeader}>
          <Text style={styles.sectionTitle}>Live Requests</Text>
          <View style={styles.liveBadge}>
            <Animated.View
              style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}
            />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {liveRequests.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={44}
              color={COLORS.success}
            />
            <Text style={styles.emptyText}>No active requests</Text>
          </View>
        ) : (
          liveRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onPress={() =>
                navigation.navigate("BloodRequestDetails", {
                  requestId: req.id,
                })
              }
              showActions
              onAssign={() =>
                navigation.navigate("AssignVolunteer", { requestId: req.id })
              }
              onEscalate={async () => {
                await bloodRequestService.escalate(req.id, profile?.id ?? "");
              }}
            />
          ))
        )}

        {liveRequests.length > 0 && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate("ManageBloodRequests")}
          >
            <Text style={styles.viewAllText}>View All Requests</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxxxl + 8,
    paddingBottom: SPACING.l,
  },
  greeting: { ...FONTS.h3, color: COLORS.text_primary },
  headerSub: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scroll: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.s },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text_primary,
    marginBottom: SPACING.m,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: SPACING.xl,
  },
  kpiCell: { width: "47%" },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  quickBtn: { alignItems: "center", flex: 1 },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickLabel: {
    ...FONTS.caption,
    color: COLORS.text_secondary,
    textAlign: "center",
  },
  liveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.m,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.danger_dim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  liveText: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    color: COLORS.danger,
    letterSpacing: 1,
  },
  empty: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText: { ...FONTS.body3, color: COLORS.text_muted },
  viewAllBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 4,
  },
  viewAllText: { ...FONTS.label, color: COLORS.primary },
});
