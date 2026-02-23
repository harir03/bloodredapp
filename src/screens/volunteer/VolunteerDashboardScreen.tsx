import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AppCard from "../../components/ui/AppCard";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { useCount } from "../../hooks/useQuery";
import { taskService, volunteerService } from "../../services";
import { useAuth } from "../../stores/AuthProvider";

const VolunteerDashboardScreen = () => {
  const { userEmail } = useAuth();

  // tasks.assigned_to is a UUID from the volunteers table, not the profile id.
  const [volunteerUUID, setVolunteerUUID] = useState<string | null>(null);
  useEffect(() => {
    if (userEmail) {
      volunteerService
        .getByEmail(userEmail)
        .then(({ data }) => setVolunteerUUID(data?.id ?? null))
        .catch(() => {});
    }
  }, [userEmail]);

  const noUUID = !volunteerUUID;
  const noop = () => Promise.resolve({ count: 0, error: null });

  const assigned = useCount(
    () => (noUUID ? noop() : taskService.count({ assigned_to: volunteerUUID })),
    [volunteerUUID],
  );
  const completed = useCount(
    () =>
      noUUID
        ? noop()
        : taskService.count({
            assigned_to: volunteerUUID,
            status: "completed",
          }),
    [volunteerUUID],
  );
  const pending = useCount(
    () =>
      noUUID
        ? noop()
        : taskService.count({ assigned_to: volunteerUUID, status: "pending" }),
    [volunteerUUID],
  );
  const inProgress = useCount(
    () =>
      noUUID
        ? noop()
        : taskService.count({
            assigned_to: volunteerUUID,
            status: "in_progress",
          }),
    [volunteerUUID],
  );

  const loading =
    assigned.loading ||
    completed.loading ||
    pending.loading ||
    inProgress.loading;
  const onRefresh = () => {
    assigned.refresh();
    completed.refresh();
    pending.refresh();
    inProgress.refresh();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <SectionHeader title="Volunteer Dashboard" />
      <View style={styles.grid}>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Tasks</Text>
          {assigned.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{assigned.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Completed</Text>
          {completed.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{completed.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Pending</Text>
          {pending.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{pending.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>In Progress</Text>
          {inProgress.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{inProgress.count}</Text>
          )}
        </AppCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    marginBottom: SPACING.m,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.text_primary,
  },
  cardValue: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginTop: SPACING.s,
  },
});

export default VolunteerDashboardScreen;
