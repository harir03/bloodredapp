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
import { taskService, volunteerService } from "../../services";
import { useAuth } from "../../stores/AuthProvider";
import { Task } from "../../types/database";

const PRIORITY_COLOR: Record<string, string> = {
  high: COLORS.danger,
  medium: "#F59E0B",
  low: "#3B82F6",
};

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  pending: { label: "Pending", color: "#F59E0B", icon: "time-outline" },
  in_progress: { label: "In Progress", color: "#3B82F6", icon: "sync-outline" },
  completed: {
    label: "Completed",
    color: "#22C55E",
    icon: "checkmark-circle-outline",
  },
  overdue: {
    label: "Overdue",
    color: COLORS.danger,
    icon: "alert-circle-outline",
  },
  assigned: { label: "Assigned", color: "#8B5CF6", icon: "person-outline" },
};

const TYPE_COLOR: Record<string, string> = {
  blood_donation: COLORS.primary,
  food_delivery: "#F59E0B",
  medical: "#EC4899",
  logistics: "#3B82F6",
  other: COLORS.text_muted,
};

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

const TaskDetailsScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [volunteerName, setVolunteerName] = useState<string | null>(null);
  const [assignerName, setAssignerName] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { userRole, profile } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsub = taskService.subscribeToTaskById(taskId, (data) => {
      setTask(data);
      if (data) {
        // Resolve names only once or when data changes
        const toName = data.assignedToName;
        const toId = data.assignedTo || data.assigned_to;
        if (toName) {
          setVolunteerName(toName);
        } else if (toId) {
          volunteerService
            .getById(toId)
            .then(({ data: v }) => setVolunteerName(v?.name ?? null))
            .catch(() => { });
        }
        if (data.assignedByName) setAssignerName(data.assignedByName);
      }
      setLoading(false);
    });
    return unsub;
  }, [taskId]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const { error } = await taskService.acceptTask(taskId);
      if (error) {
        Alert.alert("Error", error);
      } else {
        Alert.alert("Success", "You have accepted the task.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!task) return;
    const vId = task.assignedTo || task.assigned_to;
    if (!vId) {
      Alert.alert("Error", "No volunteer assigned to this task.");
      return;
    }

    Alert.alert(
      "Confirm Completion",
      "Are you sure you want to mark this task as completed? The volunteer will be rewarded points.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await taskService.completeTask(
                taskId,
                vId,
                task.city || "",
                task.points_reward || 20, // Default points if not specified
                volunteerName || "Volunteer"
              );
              if (error) {
                Alert.alert("Error", error);
              } else {
                Alert.alert("Success", "Task marked as completed and points awarded.");
              }
            } finally {
              setActionLoading(false);
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
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    );

  if (!task)
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons
            name="clipboard-outline"
            size={32}
            color={COLORS.text_muted}
          />
        </View>
        <Text style={styles.errorTitle}>Task not found</Text>
        <TouchableOpacity
          style={styles.errorBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={16} color={COLORS.text_secondary} />
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  const priorityColor = PRIORITY_COLOR[task.priority] ?? COLORS.text_muted;
  const statusMeta = STATUS_META[task.status] ?? STATUS_META.pending;
  const typeColor = TYPE_COLOR[task.type ?? "other"] ?? COLORS.text_muted;
  const dueDate =
    (task.dueDate ?? task.due_date)
      ? new Date(task.dueDate ?? task.due_date!).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : null;
  const createdAt =
    (task.createdAt ?? task.created_at)
      ? new Date(task.createdAt ?? task.created_at!).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      )
      : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Back nav */}
      <TouchableOpacity
        style={styles.backNav}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={COLORS.text_primary} />
        <Text style={styles.backNavText}>Back</Text>
      </TouchableOpacity>

      {/* Header card */}
      <View style={[styles.headerCard, { borderColor: priorityColor + "44" }]}>
        <View
          style={[styles.headerBg, { backgroundColor: priorityColor + "10" }]}
        />
        <View style={styles.headerTop}>
          <View
            style={[
              styles.typeIcon,
              {
                backgroundColor: typeColor + "22",
                borderColor: typeColor + "44",
              },
            ]}
          >
            <Ionicons name="clipboard-outline" size={22} color={typeColor} />
          </View>
          <View style={styles.headerBadges}>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor: priorityColor + "22",
                  borderColor: priorityColor + "55",
                },
              ]}
            >
              <View
                style={[styles.priorityDot, { backgroundColor: priorityColor }]}
              />
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {task.priority}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusMeta.color + "22",
                  borderColor: statusMeta.color + "55",
                },
              ]}
            >
              <Ionicons
                name={statusMeta.icon as any}
                size={12}
                color={statusMeta.color}
              />
              <Text style={[styles.statusText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerTitle}>{task.title}</Text>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: typeColor + "18",
              borderColor: typeColor + "44",
            },
          ]}
        >
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
            {(task.type ?? "other").replace(/_/g, " ")}
          </Text>
        </View>
      </View>

      {/* Assigned to / by */}
      <View style={styles.assignRow}>
        <View
          style={[
            styles.assignCard,
            {
              borderColor: "#EC4899" + "33",
              backgroundColor: "#EC4899" + "08",
            },
          ]}
        >
          <View
            style={[styles.assignIcon, { backgroundColor: "#EC4899" + "22" }]}
          >
            <Ionicons name="person" size={15} color="#EC4899" />
          </View>
          <View>
            <Text style={styles.assignLabel}>Assigned to</Text>
            <Text style={styles.assignName} numberOfLines={1}>
              {volunteerName ?? "—"}
            </Text>
          </View>
        </View>
        {assignerName ? (
          <View
            style={[
              styles.assignCard,
              {
                borderColor: "#3B82F6" + "33",
                backgroundColor: "#3B82F6" + "08",
              },
            ]}
          >
            <View
              style={[styles.assignIcon, { backgroundColor: "#3B82F6" + "22" }]}
            >
              <Ionicons name="person-add" size={15} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.assignLabel}>Assigned by</Text>
              <Text style={styles.assignName} numberOfLines={1}>
                {assignerName}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Description */}
      {task.description ? (
        <>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{task.description}</Text>
          </View>
        </>
      ) : null}

      {/* Details */}
      <Text style={styles.sectionLabel}>DETAILS</Text>
      <View style={styles.card}>
        <DetailRow
          icon="flag-outline"
          label="Priority"
          value={task.priority}
          valueColor={priorityColor}
        />
        <DetailRow
          icon="checkmark-circle-outline"
          label="Status"
          value={statusMeta.label}
          valueColor={statusMeta.color}
        />
        <DetailRow
          icon="pricetag-outline"
          label="Type"
          value={(task.type ?? "other").replace(/_/g, " ")}
          valueColor={typeColor}
        />
        {task.location ? (
          <DetailRow
            icon="location-outline"
            label="Location"
            value={task.location}
          />
        ) : null}
        {task.city ? (
          <DetailRow icon="business-outline" label="City" value={task.city} />
        ) : null}
        {dueDate ? (
          <DetailRow icon="calendar-outline" label="Due Date" value={dueDate} />
        ) : null}
        {createdAt ? (
          <DetailRow
            icon="time-outline"
            label="Created"
            value={createdAt}
            last
          />
        ) : (
          <DetailRow icon="time-outline" label="Created" value="—" last />
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {userRole === "volunteer" && task.status === "pending" && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAccept}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkbox-outline" size={20} color="#FFF" />
                <Text style={styles.primaryBtnText}>Accept Task</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {(userRole === "admin" || userRole === "city_manager") && task.status === "in_progress" && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.success }]}
            onPress={handleComplete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
                <Text style={styles.primaryBtnText}>Confirm Completion</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 60 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.m,
    padding: SPACING.xl,
  },
  loadingText: { ...FONTS.body2, color: COLORS.text_muted },
  errorIcon: {
    width: 68,
    height: 68,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: { ...FONTS.h4, color: COLORS.text_primary },
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

  backNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  backNavText: { ...FONTS.body2, color: COLORS.text_secondary },

  headerCard: {
    marginHorizontal: SPACING.m,
    borderRadius: RADII.xl,
    borderWidth: 1.5,
    overflow: "hidden",
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  headerBg: { ...StyleSheet.absoluteFillObject },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.m,
  },
  typeIcon: {
    width: 46,
    height: 46,
    borderRadius: RADII.l,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerBadges: {
    flexDirection: "row",
    gap: SPACING.s,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: {
    ...FONTS.caption,
    fontFamily: "Inter-SemiBold",
    fontSize: 11,
    textTransform: "capitalize",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  statusText: { ...FONTS.caption, fontFamily: "Inter-SemiBold", fontSize: 11 },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.text_primary,
    marginBottom: SPACING.s,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  typeBadgeText: {
    ...FONTS.caption,
    fontFamily: "Inter-Medium",
    fontSize: 11,
    textTransform: "capitalize",
  },

  assignRow: {
    flexDirection: "row",
    gap: SPACING.s,
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.m,
  },
  assignCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    padding: SPACING.m,
    borderRadius: RADII.l,
    borderWidth: 1,
  },
  assignIcon: {
    width: 34,
    height: 34,
    borderRadius: RADII.m,
    alignItems: "center",
    justifyContent: "center",
  },
  assignLabel: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    fontSize: 11,
    marginBottom: 2,
  },
  assignName: {
    ...FONTS.body2,
    color: COLORS.text_primary,
    fontFamily: "Inter-SemiBold",
  },

  sectionLabel: {
    ...FONTS.caption,
    fontSize: 11,
    color: COLORS.text_muted,
    fontFamily: "Inter-SemiBold",
    letterSpacing: 1,
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
  },
  descCard: {
    marginHorizontal: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    marginBottom: SPACING.l,
  },
  descText: { ...FONTS.body2, color: COLORS.text_secondary, lineHeight: 22 },

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
    textTransform: "capitalize",
  },
  actionSection: {
    padding: SPACING.m,
    paddingTop: 0,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: RADII.l,
    gap: 10,
    height: 54,
  },
  primaryBtnText: {
    ...FONTS.h4,
    color: "#FFF",
    fontFamily: "Inter-Bold",
  },
});

export default TaskDetailsScreen;
