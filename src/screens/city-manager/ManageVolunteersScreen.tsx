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
import { volunteerService } from "../../services";
import { Volunteer } from "../../types/database";
import { exportToCSV } from "../../utils/exportUtils";
import { Alert } from "react-native";

const ManageVolunteersScreen = ({ navigation }: any) => {
  const {
    data: volunteers,
    loading,
    refresh,
  } = useQuery<Volunteer>(() => volunteerService.getAll());

  const renderItem = useCallback(
    ({ item }: { item: Volunteer }) => (
      <ListItem
        title={item.name}
        subtitle={item.city || "No city"}
        status={item.status}
        onPress={() =>
          navigation.navigate("VolunteerDetails", { volunteerId: item.id })
        }
      />
    ),
    [navigation],
  );

  const handleExport = async () => {
    try {
      if (volunteers.length === 0) {
        Alert.alert("No Data", "There are no volunteers to export.");
        return;
      }
      const payload = volunteers.map(v => ({
        ID: v.id,
        Name: v.name,
        Email: v.email,
        Phone: v.phone,
        BloodGroup: v.blood_group || "N/A",
        City: v.city,
        Status: v.status,
        TasksCompleted: v.tasks_completed || 0
      }));
      await exportToCSV("volunteers_export", payload);
    } catch (e: any) {
      Alert.alert("Export Error", e.message || "Failed to export data.");
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader title="Manage Volunteers" />
      {loading && volunteers.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={volunteers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={<EmptyState message="No volunteers found" />}
        />
      )}
        />
      )}
      <View style={{ flexDirection: "row", gap: SPACING.m, marginTop: SPACING.m }}>
        <View style={{ flex: 1 }}>
          <AppButton
            title="Export CSV"
            onPress={handleExport}
            variant="outline"
          />
        </View>
        <View style={{ flex: 2 }}>
          <AppButton
            title="Add Volunteer"
            onPress={() => navigation.navigate("AddVolunteer")}
          />
        </View>
      </View>
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

export default ManageVolunteersScreen;
