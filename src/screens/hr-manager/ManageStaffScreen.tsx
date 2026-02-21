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
import { staffService } from "../../services";
import { Staff } from "../../types/database";

const ManageStaffScreen = ({ navigation }: any) => {
  const {
    data: staff,
    loading,
    refresh,
  } = useQuery<Staff>(() => staffService.getAll());

  const renderItem = useCallback(
    ({ item }: { item: Staff }) => (
      <ListItem
        title={item.name}
        subtitle={item.role}
        status={item.status}
        onPress={() =>
          navigation.navigate("StaffDetails", { staffId: item.id })
        }
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Manage Staff" />
      {loading && staff.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={<EmptyState message="No staff found" />}
        />
      )}
      <AppButton
        title="Add Staff"
        onPress={() => navigation.navigate("AddStaff")}
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

export default ManageStaffScreen;
