import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { profileService, taskService, volunteerService } from "../../services";
import { Profile, Task, UserRole } from "../../types/database";

const ROLE_META: Record<
  UserRole,
  { label: string; icon: string; color: string }
> = {
  admin: { label: "Admin", icon: "shield", color: COLORS.primary },
  city_manager: { label: "City Manager", icon: "business", color: "#3B82F6" },
  helpline: { label: "Helpline", icon: "call", color: "#22C55E" },
  hr_manager: { label: "HR Manager", icon: "briefcase", color: "#F59E0B" },
  volunteer: { label: "Volunteer", icon: "heart", color: "#EC4899" },
  donor: { label: "Donor", icon: "water", color: COLORS.accent },
};

const PRIORITY_COLOR: Record<string, string> = {
  high: COLORS.danger,
  medium: "#F59E0B",
  low: "#3B82F6",
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/* ─── Sub-components ─────────────────────────────────── */

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) => (
  <View style={[styles.statCard, { borderColor: color + "33" }]}>
    <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon as any} size={16} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const DetailRow = ({
  icon,
  label,
  value,
  valueColor,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) => (
  <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon as any} size={15} color={COLORS.text_muted} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text
      style={[styles.detailValue, valueColor ? { color: valueColor } : null]}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

/* ─── Screen ─────────────────────────────────────────── */

const UserDetailsScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [volunteerUUID, setVolunteerUUID] = useState<string | null>(null);

  const loadUser = () => {
    setLoading(true);
    setError(null);
    profileService
      .getById(userId)
      .then(({ data, error: err }) => {
        if (err) setError(err);
        else setUser(data);
      })
      .catch((e) => setError(e.message || "Failed to load user"))
      .finally(() => setLoading(false));
  };

  const loadTasks = () => {
    setTasksLoading(true);
    taskService
      .getByAssignedBy(userId, { limit: 50 })
      .then(({ data }) => setTasks(data))
      .catch(() => { })
      .finally(() => setTasksLoading(false));
  };

  useEffect(() => {
    loadUser();
    loadTasks();
  }, [userId]);

  useEffect(() => {
    if (user?.email) {
      volunteerService
        .getByEmail(user.email)
        .then(({ data }) => setVolunteerUUID(data?.id ?? null))
        .catch(() => { });
    }
  }, [user?.email]);

  const handleToggleActive = async () => {
    if (!user) return;
    setToggling(true);
    try {
      const { error: err } = await profileService.update(userId, {
        is_active: !user.is_active,
      });
      if (!err) {
        setUser({ ...user, is_active: !user.is_active });
        // Also update volunteer status if exists
        if (volunteerUUID) {
          await volunteerService.update(volunteerUUID, {
            status: !user.is_active ? "active" : "inactive"
          });
        }
      } else Alert.alert("Error", err);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update user");
    } finally {
      setToggling(false);
    }
  };

  const handlePromoteToVolunteer = async () => {
    if (!user) return;
    Alert.alert(
      "Confirm Promotion",
      "Elevate this user to Volunteer role? They will be able to accept and manage tasks.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Promote",
          onPress: async () => {
            setToggling(true);
            try {
              // 1. Profile Role
              await profileService.update(userId, { role: "volunteer" });
              // 2. Volunteer Status/Record
              if (volunteerUUID) {
                await volunteerService.update(volunteerUUID, { status: "active" });
              } else {
                // Legacy user without a volunteer record: Create one now
                const now = new Date().toISOString();
                const newVolData = {
                  profile_id: userId,
                  name: user.name,
                  email: user.email,
                  phone: user.phone || "",
                  blood_group: user.blood_group || "",
                  area: "",
                  city: (user as any).city || "",
                  status: "active" as const,
                  badges: ["new_recruit"],
                  skills: [],
                  totalTasksCompleted: 0,
                  totalCampsAttended: 0,
                  joined_at: now,
                  joinedAt: now,
                  attendanceLog: [],
                };
                // Need to use the raw Firebase service or custom logic to ensure we use userId as the doc ID
                // For safety and UI reactivity, we'll try to just reload the user after this
                await volunteerService.create(newVolData);
              }
              setUser({ ...user, role: "volunteer" });
              Alert.alert("Success", `${user.name} is now a Volunteer!`);
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to promote user");
            } finally {
              setToggling(false);
            }
          }
        }
      ]
    );
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );

  if (error || !user)
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons name="person-outline" size={36} color={COLORS.text_muted} />
        </View>
        <Text style={styles.errorTitle}>User not found</Text>
        <Text style={styles.errorSub}>
          {error || "This profile could not be loaded."}
        </Text>
        <TouchableOpacity
          style={styles.errorBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={16} color={COLORS.text_secondary} />
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  const meta = ROLE_META[user.role] ?? ROLE_META.volunteer;
  const initials = getInitials(user.name ?? "");
  const joinedDate = new Date(user.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const activeTasks = tasks.filter((t) => t.status !== "completed").length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Cover + Avatar ── */}
      <View
        style={[
          styles.cover,
          {
            backgroundColor: meta.color + "22",
            borderBottomColor: meta.color + "44",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.coverBack}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text_primary} />
        </TouchableOpacity>
        <View style={styles.coverAvatarWrap}>
          <View
            style={[
              styles.coverAvatar,
              { backgroundColor: meta.color + "30", borderColor: meta.color },
            ]}
          >
            <Text style={[styles.coverAvatarText, { color: meta.color }]}>
              {initials || "?"}
            </Text>
          </View>
          <View
            style={[
              styles.statusRing,
              {
                borderColor: user.is_active ? "#22C55E" : COLORS.text_muted,
                backgroundColor: COLORS.background,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: user.is_active
                    ? "#22C55E"
                    : COLORS.text_muted,
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.coverName}>{user.name}</Text>
        <Text style={styles.coverEmail}>{user.email}</Text>
        <View
          style={[
            styles.coverRoleBadge,
            {
              backgroundColor: meta.color + "22",
              borderColor: meta.color + "55",
            },
          ]}
        >
          <Ionicons name={meta.icon as any} size={13} color={meta.color} />
          <Text style={[styles.coverRoleText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>
      </View>

      {/* ── Stat Grid ── */}
      <View style={styles.statGrid}>
        <StatCard
          icon="water"
          label="Blood Group"
          value={user.blood_group || "—"}
          color={user.blood_group ? COLORS.primary : COLORS.text_muted}
        />
        <StatCard
          icon="checkmark-circle-outline"
          label="Status"
          value={user.is_active ? "Active" : "Inactive"}
          color={user.is_active ? "#22C55E" : COLORS.text_muted}
        />
        <StatCard
          icon="clipboard-outline"
          label="Open Tasks"
          value={String(activeTasks)}
          color="#3B82F6"
        />
        <StatCard
          icon="calendar-outline"
          label="Joined"
          value={joinedDate}
          color={COLORS.text_secondary}
        />
      </View>

      {/* ── Contact / Details ── */}
      <Text style={styles.sectionLabel}>PROFILE INFO</Text>
      <View style={styles.card}>
        <DetailRow icon="mail-outline" label="Email" value={user.email} />
        <DetailRow
          icon="call-outline"
          label="Phone"
          value={user.phone || "—"}
        />
        {(user as any).city ? (
          <DetailRow
            icon="location-outline"
            label="City"
            value={(user as any).city}
          />
        ) : null}
        <DetailRow
          icon="water-outline"
          label="Blood Group"
          value={user.blood_group || "—"}
          valueColor={user.blood_group ? COLORS.primary : undefined}
        />
        <DetailRow
          icon="checkmark-circle-outline"
          label="Account Status"
          value={user.is_active ? "Active" : "Inactive"}
          valueColor={user.is_active ? "#22C55E" : COLORS.text_muted}
        />
        <DetailRow
          icon="calendar-outline"
          label="Member Since"
          value={joinedDate}
          last
        />
      </View>

      {/* ── Actions ── */}
      <Text style={styles.sectionLabel}>ACTIONS</Text>

      {user.role === "donor" && (
        <TouchableOpacity
          style={[styles.actionOutline, { borderColor: "#EC4899" + "66", backgroundColor: "#EC4899" + "0e" }]}
          onPress={handlePromoteToVolunteer}
          disabled={toggling}
          activeOpacity={0.85}
        >
          <View style={styles.actionPrimaryLeft}>
            <View style={[styles.actionIcon, { backgroundColor: "#EC4899" + "22" }]}>
              <Ionicons name="ribbon-outline" size={18} color="#EC4899" />
            </View>
            <View>
              <Text style={[styles.actionTitle, { color: "#EC4899" }]}>Promote to Volunteer</Text>
              <Text style={styles.actionSub}>Enable task acceptance for this donor</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.text_muted} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.actionPrimary}
        onPress={() =>
          navigation.navigate("AddTask", {
            assignedBy: user.id,
            assignedByName: user.name,
            assignedTo: volunteerUUID ?? undefined,
            assignedToName: user.name,
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.actionPrimaryLeft}>
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: COLORS.white + "22" },
            ]}
          >
            <Ionicons name="clipboard-outline" size={18} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.actionTitle}>Assign Task</Text>
            <Text style={styles.actionSub}>Create a task for this user</Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={COLORS.white + "aa"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionOutline,
          {
            borderColor: user.is_active ? COLORS.danger + "66" : "#22C55E66",
            backgroundColor: user.is_active
              ? COLORS.danger + "0e"
              : "#22C55E0e",
          },
        ]}
        onPress={handleToggleActive}
        disabled={toggling}
        activeOpacity={0.85}
      >
        <View style={styles.actionPrimaryLeft}>
          <View
            style={[
              styles.actionIcon,
              {
                backgroundColor: user.is_active
                  ? COLORS.danger + "22"
                  : "#22C55E22",
              },
            ]}
          >
            <Ionicons
              name={
                user.is_active ? "person-remove-outline" : "person-add-outline"
              }
              size={18}
              color={user.is_active ? COLORS.danger : "#22C55E"}
            />
          </View>
          <View>
            <Text
              style={[
                styles.actionTitle,
                { color: user.is_active ? COLORS.danger : "#22C55E" },
              ]}
            >
              {toggling
                ? "Updating..."
                : user.is_active
                  ? "Deactivate User"
                  : "Activate User"}
            </Text>
            <Text style={styles.actionSub}>
              {user.is_active
                ? "Revoke access to the app"
                : "Restore access to the app"}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.text_muted} />
      </TouchableOpacity>

      {/* ── Tasks ── */}
      <View style={styles.taskSectionHeader}>
        <Text style={styles.sectionLabel}>ASSIGNED TASKS</Text>
        {tasks.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{tasks.length}</Text>
          </View>
        )}
      </View>
      {tasksLoading ? (
        <ActivityIndicator
          color={COLORS.primary}
          style={{ marginVertical: SPACING.l }}
        />
      ) : tasks.length === 0 ? (
        <View style={styles.emptyTasks}>
          <View style={styles.emptyTasksIcon}>
            <Ionicons
              name="clipboard-outline"
              size={28}
              color={COLORS.text_muted}
            />
          </View>
          <Text style={styles.emptyTasksTitle}>No tasks yet</Text>
          <Text style={styles.emptyTasksSub}>
            Tasks assigned by this user will appear here
          </Text>
        </View>
      ) : (
        <View
          style={{
            marginHorizontal: SPACING.m,
            gap: SPACING.s,
            marginBottom: 60,
          }}
        >
          {tasks.map((task) => {
            const priorityColor =
              PRIORITY_COLOR[task.priority] ?? COLORS.text_muted;
            return (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() =>
                  navigation.navigate("TaskDetails", { taskId: task.id })
                }
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.taskAccent,
                    { backgroundColor: priorityColor },
                  ]}
                />
                <View style={styles.taskBody}>
                  <View style={styles.taskTopRow}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View
                      style={[
                        styles.taskPriorityBadge,
                        {
                          backgroundColor: priorityColor + "22",
                          borderColor: priorityColor + "55",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskPriorityText,
                          { color: priorityColor },
                        ]}
                      >
                        {task.priority}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.taskBottomRow}>
                    <View style={styles.taskStatusChip}>
                      <Text style={styles.taskStatusText}>
                        {task.status.replace(/_/g, " ")}
                      </Text>
                    </View>
                    <Text style={styles.taskType}>
                      {task.type?.replace(/_/g, " ") || "General"}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={COLORS.text_muted}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  /* Loading / Error */
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.m,
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  loadingText: { ...FONTS.body2, color: COLORS.text_muted },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: { ...FONTS.h4, color: COLORS.text_primary },
  errorSub: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    textAlign: "center",
    maxWidth: 220,
  },
  errorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  errorBtnText: { ...FONTS.body2, color: COLORS.text_secondary },

  /* Cover */
  cover: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 24,
    borderBottomWidth: 1,
    marginBottom: SPACING.m,
    position: "relative",
  },
  coverBack: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surface + "cc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coverAvatarWrap: { position: "relative", marginBottom: SPACING.m },
  coverAvatar: {
    width: 88,
    height: 88,
    borderRadius: RADII.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  coverAvatarText: { fontSize: 34, fontFamily: "Inter-Bold" },
  statusRing: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: RADII.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  coverName: { ...FONTS.h3, color: COLORS.text_primary, marginBottom: 2 },
  coverEmail: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    marginBottom: SPACING.s,
  },
  coverRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  coverRoleText: {
    ...FONTS.caption,
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
  },

  /* Stat Grid */
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    borderWidth: 1,
    padding: SPACING.m,
    gap: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: RADII.m,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: { ...FONTS.body2, fontFamily: "Inter-SemiBold" },
  statLabel: { ...FONTS.caption, color: COLORS.text_muted, fontSize: 11 },

  /* Section label */
  sectionLabel: {
    ...FONTS.caption,
    fontSize: 11,
    color: COLORS.text_muted,
    fontFamily: "Inter-SemiBold",
    letterSpacing: 1,
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
  },

  /* Detail Card */
  card: {
    marginHorizontal: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.l,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { ...FONTS.body2, color: COLORS.text_secondary },
  detailValue: {
    ...FONTS.body2,
    color: COLORS.text_primary,
    fontFamily: "Inter-Medium",
    maxWidth: "55%",
    textAlign: "right",
  },

  /* Action buttons */
  actionPrimary: {
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.s,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.xl,
    padding: SPACING.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionOutline: {
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.l,
    borderWidth: 1.5,
    borderRadius: RADII.xl,
    padding: SPACING.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionPrimaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.m,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADII.m,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    ...FONTS.body2,
    color: COLORS.white,
    fontFamily: "Inter-SemiBold",
  },
  actionSub: { ...FONTS.caption, color: COLORS.white + "99", marginTop: 2 },

  /* Tasks header */
  taskSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
  },
  countPill: {
    backgroundColor: COLORS.primary + "22",
    borderRadius: RADII.full,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
  },
  countPillText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontFamily: "Inter-SemiBold",
    fontSize: 11,
  },

  /* Empty tasks */
  emptyTasks: {
    alignItems: "center",
    gap: SPACING.s,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  emptyTasksIcon: {
    width: 60,
    height: 60,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  emptyTasksTitle: { ...FONTS.h4, color: COLORS.text_primary },
  emptyTasksSub: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    textAlign: "center",
  },

  /* Task cards */
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    paddingRight: SPACING.m,
    paddingVertical: 12,
  },
  taskAccent: { width: 4, alignSelf: "stretch", marginRight: SPACING.m },
  taskBody: { flex: 1 },
  taskTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  taskTitle: {
    ...FONTS.body2,
    color: COLORS.text_primary,
    fontFamily: "Inter-SemiBold",
    flex: 1,
    marginRight: SPACING.s,
  },
  taskPriorityBadge: {
    borderWidth: 1,
    borderRadius: RADII.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  taskPriorityText: {
    ...FONTS.caption,
    fontFamily: "Inter-SemiBold",
    fontSize: 10,
    textTransform: "capitalize",
  },
  taskBottomRow: { flexDirection: "row", alignItems: "center", gap: SPACING.s },
  taskStatusChip: {
    backgroundColor: COLORS.background,
    borderRadius: RADII.s,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskStatusText: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    fontSize: 10,
    textTransform: "capitalize",
  },
  taskType: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    fontSize: 11,
    textTransform: "capitalize",
  },
});

export default UserDetailsScreen;
