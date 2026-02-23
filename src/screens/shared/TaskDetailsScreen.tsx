import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/ui/AppButton";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { taskService } from "../../services";
import { Task } from "../../types/database";

const TaskDetailsScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskService
      .getById(taskId)
      .then(({ data }) => setTask(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1 }}
      />
    );
  if (!task)
    return (
      <View style={styles.container}>
        <Text>Task not found</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <SectionHeader title="Task Details" />
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>Title</Text>
          <Text style={styles.value}>{task.title}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{task.description || "N/A"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{task.type.replace(/_/g, " ")}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Priority</Text>
          <Text style={styles.value}>{task.priority}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{task.status.replace(/_/g, " ")}</Text>
        </View>
        {task.location ? (
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{task.location}</Text>
          </View>
        ) : null}
        {task.city ? (
          <View style={styles.row}>
            <Text style={styles.label}>City</Text>
            <Text style={styles.value}>{task.city}</Text>
          </View>
        ) : null}
        {task.due_date ? (
          <View style={styles.row}>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.value}>
              {new Date(task.due_date).toLocaleDateString()}
            </Text>
          </View>
        ) : null}
      </View>
      <AppButton title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
  },
  detailsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: SPACING.s,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    marginBottom: SPACING.m,
  },
  label: {
    ...FONTS.label,
    color: COLORS.text_muted,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    ...FONTS.body,
    color: COLORS.text_primary,
  },
});

export default TaskDetailsScreen;
