import { FontAwesome5 } from "@expo/vector-icons";
import React, { useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import AppButton from "../../components/ui/AppButton";
import EmptyState from "../../components/ui/EmptyState";
import ListItem from "../../components/ui/ListItem";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, SPACING } from "../../constants/theme";
import { useQuery } from "../../hooks/useQuery";
import { taskService } from "../../services";
import { Task } from "../../types/database";

const PRIORITY_COLOR: Record<string, string> = {
  low: COLORS.text_muted,
  medium: COLORS.info,
  high: COLORS.warning,
  urgent: COLORS.danger,
};

const ManageTasksScreen = ({ navigation }: any) => {
  const {
    data: tasks,
    loading,
    refresh,
  } = useQuery<Task>(() => taskService.getAll({ limit: 100 }));

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <ListItem
        title={item.title}
        subtitle={`${item.type.replace(/_/g, " ")} · ${item.city || "No city"}`}
        rightText={item.priority.toUpperCase()}
        rightTextColor={PRIORITY_COLOR[item.priority] || COLORS.text_muted}
        onPress={() => navigation.navigate("TaskDetails", { taskId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="All Tasks" />
      {loading && tasks.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={
                <FontAwesome5
                  name="tasks"
                  size={32}
                  color={COLORS.text_muted}
                />
              }
              message="No tasks found"
            />
          }
        />
      )}
      <AppButton
        title="Add Task"
        onPress={() => navigation.navigate("AddTask")}
        style={styles.addBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
  },
  list: {
    gap: SPACING.s,
    paddingBottom: SPACING.xxxl,
  },
  addBtn: {
    marginTop: SPACING.s,
  },
});

export default ManageTasksScreen;
