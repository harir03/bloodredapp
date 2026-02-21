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
import { profileService } from "../../services";
import { Profile } from "../../types/database";

const ManageUsersScreen = ({ navigation }: any) => {
  const {
    data: users,
    loading,
    refresh,
  } = useQuery<Profile>(() => profileService.getAll());

  const renderItem = useCallback(
    ({ item }: { item: Profile }) => (
      <ListItem
        title={item.name}
        subtitle={item.email}
        status={item.role}
        onPress={() => navigation.navigate("UserDetails", { userId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Manage Users" />
      {loading && users.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={<EmptyState message="No users found" />}
        />
      )}
      <AppButton
        title="Add User"
        onPress={() => navigation.navigate("AddUser")}
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

export default ManageUsersScreen;
