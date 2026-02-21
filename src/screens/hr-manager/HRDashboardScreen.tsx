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
import { staffService } from "../../services";

const HRDashboardScreen = () => {
  const totalStaff = useCount(() => staffService.count());
  const onDuty = useCount(() => staffService.count({ status: "active" }));
  const onLeave = useCount(() => staffService.count({ status: "on_leave" }));
  const newApplicants = useCount(() =>
    staffService.count({ status: "inactive" }),
  );

  const loading =
    totalStaff.loading ||
    onDuty.loading ||
    onLeave.loading ||
    newApplicants.loading;
  const onRefresh = () => {
    totalStaff.refresh();
    onDuty.refresh();
    onLeave.refresh();
    newApplicants.refresh();
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
      <SectionHeader title="HR Dashboard" />
      <View style={styles.grid}>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Total Staff</Text>
          {totalStaff.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{totalStaff.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>On Duty</Text>
          {onDuty.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{onDuty.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>On Leave</Text>
          {onLeave.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{onLeave.count}</Text>
          )}
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>New Applicants</Text>
          {newApplicants.loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.cardValue}>{newApplicants.count}</Text>
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

export default HRDashboardScreen;
