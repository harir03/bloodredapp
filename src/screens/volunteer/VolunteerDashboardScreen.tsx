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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KPICard } from "../../components/ui/KPICard";
import { CardSkeleton } from "../../components/ui/SkeletonLoader";
import { StatusPill } from "../../components/ui/StatusPill";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { bloodRequestService } from "../../services/bloodRequestService";
import { BADGES, computeBadges } from "../../services/leaderboardService";
import { taskService } from "../../services/taskService";
import { volunteerService } from "../../services/volunteerService";
import { useAuth } from "../../stores/AuthProvider";
import { BloodRequest, Task, Volunteer } from "../../types/database";

export default function VolunteerDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [liveRequests, setLiveRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const load = useCallback(async () => {
    if (!profile?.email) return;
    setLoading(true);
    try {
      const { data: vols } = await volunteerService.getAll();
      const vol = (vols || []).find(
        (v: Volunteer) => v.email === profile.email || v.profile_id === profile.id,
      );
      setVolunteer(vol ?? null);

      if (vol) {
        // Robust task fetching: check both potential assignment fields
        const { data: camel } = await taskService.getAll({
          filters: { assignedTo: vol.id },
        } as any);
        const { data: snake } = await taskService.getAll({
          filters: { assigned_to: vol.id },
        } as any);
        const combined = [...camel];
        snake.forEach(s => { if (!combined.find(c => c.id === s.id)) combined.push(s); });

        setTasks(
          combined.filter((t: Task) => t.status !== "completed").slice(0, 5),
        );
      }
    } catch (e) {
      console.log("Load volunteer error:", e);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = bloodRequestService.subscribeToLive((reqs) => {
      // Filter for unassigned requests
      // Fetch all unassigned requests to ensure visibility
      const unassigned = reqs.filter(r => !r.assignedVolunteerId);
      setLiveRequests(unassigned.slice(0, 5));
    });
    return () => unsub();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const points = volunteer?.points ?? profile?.points ?? 0;
  const badges = volunteer?.badges ?? profile?.badges ?? computeBadges(points);

  const nextBadgeEntry = Object.entries(BADGES)
    .sort((a, b) => a[1].minPoints - b[1].minPoints)
    .find(([, v]) => points < v.minPoints);

  const progressToNext = nextBadgeEntry
    ? Math.min(1, points / nextBadgeEntry[1].minPoints)
    : 1;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + SPACING.l }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Profile Hero */}
        <Animated.View
          style={[styles.heroCard, { transform: [{ scale: bounceAnim }] }]}
        >
          <View style={styles.avatarRing}>
            <Text style={styles.avatarInitial}>
              {(profile?.name ?? "V").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.heroName}>{profile?.name ?? "Volunteer"}</Text>
            <Text style={styles.heroRole}>Field Volunteer</Text>
            <View style={styles.pointsRow}>
              <Ionicons name="star" size={14} color={COLORS.warning} />
              <Text style={styles.pointsText}>{points} pts</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={COLORS.text_muted}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Progress Bar */}
        {nextBadgeEntry && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Next: {nextBadgeEntry[1].emoji} {nextBadgeEntry[1].label}
              </Text>
              <Text style={styles.progressPts}>
                {points}/{nextBadgeEntry[1].minPoints}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressToNext * 100}%` as any },
                ]}
              />
            </View>
          </View>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Badges</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: SPACING.l }}
            >
              {badges.map((b) => {
                const info = BADGES[b];
                if (!info) return null;
                return (
                  <View key={b} style={styles.badgeCard}>
                    <Text style={styles.badgeEmoji}>{info.emoji}</Text>
                    <Text style={styles.badgeLabel}>{info.label}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Stats */}
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsRow}>
          <KPICard
            label="Completed"
            value={
              volunteer?.tasks_completed ?? volunteer?.totalTasksCompleted ?? 0
            }
            icon="checkmark-done-outline"
            color={COLORS.success}
            compact
          />
          <View style={{ width: 10 }} />
          <KPICard
            label="Camps"
            value={volunteer?.totalCampsAttended ?? 0}
            icon="calendar-outline"
            color={COLORS.info}
            compact
          />
          <View style={{ width: 10 }} />
          <KPICard
            label="Points"
            value={points}
            icon="star-outline"
            color={COLORS.warning}
            compact
          />
        </View>

        {/* Active Tasks */}
        <View style={styles.taskHeader}>
          <Text style={styles.sectionTitle}>Active Tasks</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Tasks")}
          >
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <CardSkeleton />
        ) : tasks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-circle-outline"
              size={40}
              color={COLORS.success}
            />
            <Text style={styles.emptyText}>
              No active tasks — you're all caught up!
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() =>
                navigation.navigate("TaskDetails", { taskId: task.id })
              }
            >
              <View style={styles.taskLeft}>
                <View
                  style={[
                    styles.taskDot,
                    {
                      backgroundColor:
                        task.priority === "high"
                          ? COLORS.danger
                          : task.priority === "medium"
                            ? COLORS.warning
                            : COLORS.success,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                  {task.dueDate && (
                    <Text style={styles.taskDue}>
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
              <StatusPill value={task.status} />
            </TouchableOpacity>
          ))
        )}

        {/* Live Blood Requests */}
        <View style={{ marginBottom: SPACING.xl }}>
          <View style={styles.taskHeader}>
            <Text style={styles.sectionTitle}>Live Blood Requests 🩸</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("ManageBloodRequests")}
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {liveRequests.length === 0 ? (
            <View style={[styles.taskCard, { justifyContent: 'center', opacity: 0.6 }]}>
              <Text style={styles.taskTitle}>No active blood requests nearby</Text>
            </View>
          ) : (
            liveRequests.map((req) => (
              <TouchableOpacity
                key={req.id}
                style={[styles.taskCard, { borderColor: req.urgency === 'critical' ? COLORS.critical + '88' : COLORS.border }]}
                onPress={() =>
                  navigation.navigate("BloodRequestDetails", { requestId: req.id })
                }
              >
                <View style={styles.taskLeft}>
                  <View
                    style={[
                      styles.taskDot,
                      {
                        backgroundColor:
                          req.urgency === "critical"
                            ? COLORS.critical
                            : req.urgency === "medium"
                              ? COLORS.warning
                              : COLORS.success,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {req.bloodGroup} for {req.patientName}
                    </Text>
                    <Text style={styles.taskDue}>
                      {req.hospital} • {req.city}
                    </Text>
                  </View>
                </View>
                <StatusPill value={req.urgency} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickRow}>
          {[
            {
              icon: "trophy-outline" as const,
              label: "Leaderboard",
              color: COLORS.warning,
              screen: "Leaderboard",
            },
            {
              icon: "calendar-outline" as const,
              label: "Events",
              color: COLORS.info,
              screen: "Events",
            },
            {
              icon: "notifications-outline" as const,
              label: "Notifications",
              color: COLORS.primary,
              screen: "Notifications",
            },
          ].map((q) => (
            <TouchableOpacity
              key={q.label}
              style={styles.quickBtn}
              onPress={() => navigation.navigate(q.screen)}
            >
              <View
                style={[styles.quickIcon, { backgroundColor: q.color + "22" }]}
              >
                <Ionicons name={q.icon} size={20} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxl },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary_subtle,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: "Inter-Bold",
    fontSize: 22,
    color: COLORS.primary,
  },
  heroName: { ...FONTS.h3, color: COLORS.text_primary },
  heroRole: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  pointsText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    color: COLORS.warning,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.l,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: { ...FONTS.caption, color: COLORS.text_secondary },
  progressPts: { ...FONTS.caption, color: COLORS.text_muted },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text_primary,
    marginBottom: SPACING.m,
  },
  badgeCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
  },
  badgeEmoji: { fontSize: 26, marginBottom: 6 },
  badgeLabel: {
    ...FONTS.caption,
    color: COLORS.text_secondary,
    textAlign: "center",
  },
  statsRow: { flexDirection: "row", marginBottom: SPACING.xl },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  viewAll: { ...FONTS.caption, color: COLORS.primary },
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { ...FONTS.body3, color: COLORS.text_primary, flex: 1 },
  taskDue: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 3 },
  empty: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.l,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.text_muted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  quickRow: { flexDirection: "row", gap: 12, marginBottom: SPACING.l },
  quickBtn: { alignItems: "center", flex: 1 },
  quickIcon: {
    width: 50,
    height: 50,
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
});
