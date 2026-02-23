import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AppButton from "../../components/ui/AppButton";
import ListItem from "../../components/ui/ListItem";
import SectionHeader from "../../components/ui/SectionHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { profileService, taskService, volunteerService } from "../../services";
import { Profile, Task } from "../../types/database";

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
      .catch(() => {})
      .finally(() => setTasksLoading(false));
  };

  useEffect(() => {
    loadUser();
    loadTasks();
  }, [userId]);

  // Once the profile loads, look up any matching volunteer entry by email
  useEffect(() => {
    if (user?.email) {
      volunteerService
        .getByEmail(user.email)
        .then(({ data }) => setVolunteerUUID(data?.id ?? null))
        .catch(() => {});
    }
  }, [user?.email]);

  const handleToggleActive = async () => {
    if (!user) return;
    setToggling(true);
    try {
      const { error: err } = await profileService.update(userId, {
        is_active: !user.is_active,
      });
      if (err) Alert.alert("Error", err);
      else setUser({ ...user, is_active: !user.is_active });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update user");
    } finally {
      setToggling(false);
    }
  };

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1 }}
      />
    );

  if (error || !user)
    return (
      <View style={styles.container}>
        <SectionHeader title="User Details" />
        <Text style={styles.errorText}>{error || "User not found"}</Text>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );

  const roleLabel = user.role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="User Details" />

      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <StatusBadge status={user.role} />
          </View>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Role" value={roleLabel} />
        <DetailRow label="Phone" value={user.phone || "—"} />
        <DetailRow
          label="Blood Group"
          value={user.blood_group || "—"}
          valueColor={user.blood_group ? COLORS.primary : undefined}
        />
        <DetailRow
          label="Status"
          value={user.is_active ? "Active" : "Inactive"}
          valueColor={user.is_active ? COLORS.success : COLORS.danger}
        />
        <DetailRow
          label="Joined"
          value={new Date(user.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          last
        />
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <AppButton
          title="Assign Task"
          onPress={() =>
            navigation.navigate("AddTask", {
              assignedBy: user.id,
              assignedByName: user.name,
              assignedTo: volunteerUUID ?? undefined,
              assignedToName: user.name,
            })
          }
          style={styles.actionBtn}
        />
        <AppButton
          title={
            toggling
              ? "Updating..."
              : user.is_active
                ? "Deactivate User"
                : "Activate User"
          }
          onPress={handleToggleActive}
          disabled={toggling}
          style={[
            styles.actionBtn,
            {
              backgroundColor: user.is_active ? COLORS.danger : COLORS.success,
            },
          ]}
        />
        <AppButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={[styles.actionBtn, styles.backBtn]}
        />
      </View>

      {/* Assigned Tasks */}
      <View style={styles.tasksSection}>
        <Text style={styles.tasksSectionTitle}>
          Tasks Assigned by This User ({tasks.length})
        </Text>
        {tasksLoading ? (
          <ActivityIndicator
            color={COLORS.primary}
            style={{ marginTop: SPACING.m }}
          />
        ) : tasks.length === 0 ? (
          <Text style={styles.noTasksText}>No tasks assigned yet</Text>
        ) : (
          tasks.map((task) => (
            <ListItem
              key={task.id}
              title={task.title}
              subtitle={`${task.status} · ${task.priority} priority`}
              rightText={task.type.replace(/_/g, " ")}
              onPress={() =>
                navigation.navigate("TaskDetails", { taskId: task.id })
              }
              style={styles.taskItem}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const DetailRow = ({
  label,
  value,
  valueColor,
  last,
}: {
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) => (
  <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.s,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionsCard: {
    gap: SPACING.s,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.m,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...FONTS.h2,
    color: COLORS.white,
  },
  headerInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  name: {
    ...FONTS.h3,
    color: COLORS.text_primary,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.s,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    ...FONTS.body3,
    color: COLORS.text_muted,
  },
  value: {
    ...FONTS.body3,
    color: COLORS.text_primary,
    textAlign: "right",
    flex: 1,
    marginLeft: SPACING.m,
  },
  actionBtn: {
    marginBottom: 0,
  },
  backBtn: {
    backgroundColor: COLORS.surface2,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.danger,
    textAlign: "center",
    marginVertical: SPACING.xl,
  },
  tasksSection: {
    marginTop: SPACING.l,
    paddingBottom: SPACING.xxxl,
  },
  tasksSectionTitle: {
    ...FONTS.h4,
    color: COLORS.text_primary,
    marginBottom: SPACING.s,
  },
  noTasksText: {
    ...FONTS.body3,
    color: COLORS.text_muted,
    textAlign: "center",
    paddingVertical: SPACING.l,
  },
  taskItem: {
    marginBottom: SPACING.s,
  },
});

export default UserDetailsScreen;
