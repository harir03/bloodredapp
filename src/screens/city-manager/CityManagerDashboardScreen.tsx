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
import { helplineService, taskService, volunteerService } from "../../services";

const CityManagerDashboardScreen = () => {
  const volunteers = useCount(() =>
    volunteerService.count({ status: "active" }),
  );
  const activeCases = useCount(() =>
    helplineService.count({ status: "in_progress" }),
  );
  const resolvedCases = useCount(() =>
    helplineService.count({ status: "resolved" }),
  );
  const pendingTasks = useCount(() => taskService.count({ status: "pending" }));

  const loading =
    volunteers.loading ||
    activeCases.loading ||
    resolvedCases.loading ||
    pendingTasks.loading;
  const onRefresh = () => {
    volunteers.refresh();
    activeCases.refresh();
    resolvedCases.refresh();
    pendingTasks.refresh();
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
      <SectionHeader title="City Dashboard" />
      <View style={styles.grid}>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Volunteers</Text>
          {volunteers.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{volunteers.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Active Cases</Text>
          {activeCases.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{activeCases.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Resolved Cases</Text>
          {resolvedCases.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{resolvedCases.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Pending Tasks</Text>
          {pendingTasks.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{pendingTasks.count}</Text>
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

export default CityManagerDashboardScreen;
