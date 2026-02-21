import React from "react";
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
import {
    helplineService,
    profileService,
    taskService,
    volunteerService,
} from "../../services";

const AdminDashboardScreen = () => {
  const users = useCount(() => profileService.count());
  const calls = useCount(() => helplineService.count());
  const volunteers = useCount(() =>
    volunteerService.count({ status: "active" }),
  );
  const activeTasks = useCount(() =>
    taskService.count({ status: "in_progress" }),
  );

  const loading =
    users.loading || calls.loading || volunteers.loading || activeTasks.loading;
  const onRefresh = () => {
    users.refresh();
    calls.refresh();
    volunteers.refresh();
    activeTasks.refresh();
  };

  const format = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

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
      <SectionHeader title="Admin Dashboard" />
      <View style={styles.grid}>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Users</Text>
          {users.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{format(users.count)}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Helpline Calls</Text>
          {calls.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{format(calls.count)}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Volunteers</Text>
          {volunteers.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{format(volunteers.count)}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Active Tasks</Text>
          {activeTasks.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{format(activeTasks.count)}</Text>
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

export default AdminDashboardScreen;
