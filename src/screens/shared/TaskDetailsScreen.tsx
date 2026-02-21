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
        <Text style={styles.label}>Title:</Text>
        <Text style={styles.value}>{task.title}</Text>
        <Text style={styles.label}>Description:</Text>
        <Text style={styles.value}>{task.description || "N/A"}</Text>
        <Text style={styles.label}>Type:</Text>
        <Text style={styles.value}>{task.type}</Text>
        <Text style={styles.label}>Priority:</Text>
        <Text style={styles.value}>{task.priority}</Text>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{task.status}</Text>
        {task.location ? (
          <>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{task.location}</Text>
          </>
        ) : null}
        {task.due_date ? (
          <>
            <Text style={styles.label}>Due:</Text>
            <Text style={styles.value}>
              {new Date(task.due_date).toLocaleDateString()}
            </Text>
          </>
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
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: SPACING.s,
    marginBottom: SPACING.m,
  },
  label: {
    ...FONTS.h4,
    color: COLORS.text_secondary,
    marginBottom: SPACING.xs,
  },
  value: {
    ...FONTS.body3,
    color: COLORS.text_primary,
    marginBottom: SPACING.m,
  },
});

export default TaskDetailsScreen;
