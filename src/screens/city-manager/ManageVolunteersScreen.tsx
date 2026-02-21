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
      <AppButton
        title="Add Volunteer"
        onPress={() => navigation.navigate("AddVolunteer")}
      />
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
