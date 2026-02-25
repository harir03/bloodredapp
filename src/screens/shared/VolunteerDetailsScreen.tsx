import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/ui/AppButton";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { volunteerService } from "../../services";
import { Volunteer } from "../../types/database";

const VolunteerDetailsScreen = ({ route, navigation }: any) => {
  const { volunteerId } = route.params;
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    volunteerService
      .getById(volunteerId)
      .then(({ data }) => setVolunteer(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [volunteerId]);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1 }}
      />
    );
  if (!volunteer)
    return (
      <View style={styles.container}>
        <Text>Volunteer not found</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <SectionHeader title="Volunteer Details" />
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{volunteer.name}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{volunteer.email}</Text>
        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{volunteer.phone}</Text>
        <Text style={styles.label}>Blood Group:</Text>
        <Text style={styles.value}>{volunteer.blood_group}</Text>
        <Text style={styles.label}>City:</Text>
        <Text style={styles.value}>{volunteer.city}</Text>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{volunteer.status}</Text>
        <Text style={styles.label}>Tasks Completed:</Text>
        <Text style={styles.value}>{volunteer.tasks_completed}</Text>
        <Text style={styles.label}>Points:</Text>
        <Text style={styles.value}>{volunteer.points}</Text>
      </View>
      <AppButton
        title="Assign Task"
        onPress={() =>
          navigation.navigate("AddTask", {
            assignedTo: volunteer.id,
            assignedByName: volunteer.name,
          })
        }
      />
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

export default VolunteerDetailsScreen;
