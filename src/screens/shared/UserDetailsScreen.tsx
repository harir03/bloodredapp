import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/ui/AppButton";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { profileService } from "../../services";
import { Profile } from "../../types/database";

const UserDetailsScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileService
      .getById(userId)
      .then(({ data }) => setUser(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1 }}
      />
    );
  if (!user)
    return (
      <View style={styles.container}>
        <Text>User not found</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <SectionHeader title="User Details" />
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{user.name}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>
        <Text style={styles.label}>Role:</Text>
        <Text style={styles.value}>{user.role}</Text>
        {user.phone ? (
          <>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{user.phone}</Text>
          </>
        ) : null}
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>
          {user.is_active ? "Active" : "Inactive"}
        </Text>
        <Text style={styles.label}>Joined:</Text>
        <Text style={styles.value}>
          {new Date(user.created_at).toLocaleDateString()}
        </Text>
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

export default UserDetailsScreen;
