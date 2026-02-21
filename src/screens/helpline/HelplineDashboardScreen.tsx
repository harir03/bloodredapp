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
import { helplineService } from "../../services";

const HelplineDashboardScreen = () => {
  const totalCalls = useCount(() => helplineService.count());
  const answered = useCount(() =>
    helplineService.count({ status: "resolved" }),
  );
  const pending = useCount(() => helplineService.count({ status: "pending" }));
  const inProgress = useCount(() =>
    helplineService.count({ status: "in_progress" }),
  );

  const loading =
    totalCalls.loading ||
    answered.loading ||
    pending.loading ||
    inProgress.loading;
  const onRefresh = () => {
    totalCalls.refresh();
    answered.refresh();
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
      <SectionHeader title="Helpline Dashboard" />
      <View style={styles.grid}>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Total Calls</Text>
          {totalCalls.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{totalCalls.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Resolved</Text>
          {answered.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{answered.count}</Text>
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

export default HelplineDashboardScreen;
