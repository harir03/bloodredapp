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
import { RequestCard } from "../../components/ui/RequestCard";
import {
    CardSkeleton,
    KPISkeleton,
} from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { bloodRequestService } from "../../services/bloodRequestService";
import { useAuth } from "../../stores/AuthProvider";
import { BloodRequest } from "../../types/database";

const KANBAN_COLS: {
  key: BloodRequest["status"];
  label: string;
  color: string;
}[] = [
  { key: "pending", label: "Pending", color: COLORS.warning },
  { key: "in_progress", label: "In Progress", color: COLORS.info },
  { key: "escalated", label: "Escalated", color: COLORS.escalated },
];

export default function HelplineDashboardScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [allRequests, setAllRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCol, setActiveCol] = useState<BloodRequest["status"]>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bloodRequestService.getPending();
      setAllRequests(data);
    } catch (e) {
      console.log("Helpline load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const colData = allRequests.filter((r) => r.status === activeCol);
  const counts = {
    pending: allRequests.filter((r) => r.status === "pending").length,
    in_progress: allRequests.filter((r) => r.status === "in_progress").length,
    escalated: allRequests.filter((r) => r.status === "escalated").length,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Helpline Dashboard</Text>
          <Text style={styles.headerSub}>
            Manage blood requests & escalations
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddBloodRequest")}
        >
          <Ionicons name="add" size={22} color={COLORS.white} />
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
        {/* KPI Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: SPACING.l }}
        >
          {loading ? (
            [0, 1, 2].map((i) => (
              <View key={i} style={[styles.kpiItem, { marginRight: 10 }]}>
                <KPISkeleton />
              </View>
            ))
          ) : (
            <>
              <View style={[styles.kpiItem, { marginRight: 10 }]}>
                <KPICard
                  label="Pending"
                  value={counts.pending}
                  icon="time-outline"
                  color={COLORS.warning}
                />
              </View>
              <View style={[styles.kpiItem, { marginRight: 10 }]}>
                <KPICard
                  label="Active"
                  value={counts.in_progress}
                  icon="pulse-outline"
                  color={COLORS.info}
                />
              </View>
              <View style={[styles.kpiItem, { marginRight: 10 }]}>
                <KPICard
                  label="Escalated"
                  value={counts.escalated}
                  icon="alert-circle-outline"
                  color={COLORS.escalated}
                />
              </View>
            </>
          )}
        </ScrollView>

        {/* Kanban Tabs */}
        <Text style={styles.sectionTitle}>Request Queue</Text>
        <View style={styles.kanbanTabs}>
          {KANBAN_COLS.map((col) => (
            <TouchableOpacity
              key={col.key}
              style={[
                styles.kanbanTab,
                activeCol === col.key && [
                  styles.kanbanTabActive,
                  { borderColor: col.color, backgroundColor: col.color + "20" },
                ],
              ]}
              onPress={() => setActiveCol(col.key)}
            >
              <View
                style={[
                  styles.kanbanDot,
                  {
                    backgroundColor:
                      activeCol === col.key ? col.color : COLORS.text_muted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.kanbanTabText,
                  activeCol === col.key && {
                    color: col.color,
                    fontFamily: "Inter-SemiBold",
                  },
                ]}
              >
                {col.label}
              </Text>
              <View
                style={[
                  styles.kanbanCount,
                  activeCol === col.key && { backgroundColor: col.color },
                ]}
              >
                <Text
                  style={[
                    styles.kanbanCountText,
                    activeCol === col.key && { color: COLORS.white },
                  ]}
                >
                  {col.key === "pending"
                    ? counts.pending
                    : col.key === "in_progress"
                      ? counts.in_progress
                      : counts.escalated}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cards */}
        {loading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : colData.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={44}
              color={COLORS.success}
            />
            <Text style={styles.emptyText}>No requests in this queue</Text>
          </View>
        ) : (
          colData.map((req) => (
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
                load();
              }}
            />
          ))
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.s },
  kpiItem: { width: 150 },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text_primary,
    marginBottom: SPACING.m,
  },
  kanbanTabs: { flexDirection: "row", gap: 8, marginBottom: SPACING.l },
  kanbanTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  kanbanTabActive: { borderWidth: 1 },
  kanbanDot: { width: 6, height: 6, borderRadius: 3 },
  kanbanTabText: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: COLORS.text_muted,
  },
  kanbanCount: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  kanbanCountText: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    color: COLORS.text_muted,
  },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { ...FONTS.body3, color: COLORS.text_muted },
});
