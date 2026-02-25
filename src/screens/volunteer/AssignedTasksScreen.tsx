import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import EmptyState from "../../components/ui/EmptyState";
import ListItem from "../../components/ui/ListItem";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, SPACING } from "../../constants/theme";
import { useQuery } from "../../hooks/useQuery";
import { taskService, volunteerService } from "../../services";
import { useAuth } from "../../stores/AuthProvider";
import { Task } from "../../types/database";

const AssignedTasksScreen = ({ navigation }: any) => {
  const { userEmail } = useAuth();
  const [volunteerUUID, setVolunteerUUID] = useState<string | null>(null);

  useEffect(() => {
    if (userEmail) {
      volunteerService
        .getByEmail(userEmail)
        .then(({ data }) => setVolunteerUUID(data?.id ?? null))
        .catch(() => {});
    }
  }, [userEmail]);

  const {
    data: tasks,
    loading,
    refresh,
  } = useQuery<Task>(
    () =>
      volunteerUUID
        ? taskService.getByVolunteer(volunteerUUID, { limit: 100 })
        : Promise.resolve({ data: [], count: 0, error: null }),
    [volunteerUUID],
  );

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <ListItem
        title={item.title}
        subtitle={item.description || "No description"}
        status={item.status}
        onPress={() => navigation.navigate("TaskDetails", { taskId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Assigned Tasks" />
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
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={<EmptyState message="No tasks assigned" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
  },
});

export default AssignedTasksScreen;
