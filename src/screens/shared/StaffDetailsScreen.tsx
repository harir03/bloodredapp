import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/ui/AppButton";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { staffService } from "../../services";
import { Staff } from "../../types/database";

const StaffDetailsScreen = ({ route, navigation }: any) => {
  const { staffId } = route.params;
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService
      .getById(staffId)
      .then(({ data }) => setStaff(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [staffId]);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1 }}
      />
    );
  if (!staff)
    return (
      <View style={styles.container}>
        <Text>Staff not found</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <SectionHeader title="Staff Details" />
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{staff.name}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{staff.email}</Text>
        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{staff.phone}</Text>
        <Text style={styles.label}>Role:</Text>
        <Text style={styles.value}>{staff.role}</Text>
        <Text style={styles.label}>Department:</Text>
        <Text style={styles.value}>{staff.department}</Text>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{staff.status}</Text>
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

export default StaffDetailsScreen;
