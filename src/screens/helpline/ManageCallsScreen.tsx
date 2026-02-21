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
import { helplineService } from "../../services";
import { HelplineCall } from "../../types/database";

const ManageCallsScreen = ({ navigation }: any) => {
  const {
    data: calls,
    loading,
    refresh,
  } = useQuery<HelplineCall>(() =>
    helplineService.getAll({ orderBy: "created_at", ascending: false }),
  );

  const renderItem = useCallback(
    ({ item }: { item: HelplineCall }) => (
      <ListItem
        title={item.caller_name}
        subtitle={new Date(item.created_at).toLocaleString()}
        status={item.status}
        onPress={() => navigation.navigate("CallDetails", { callId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Manage Calls" />
      {loading && calls.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={<EmptyState message="No calls found" />}
        />
      )}
      <AppButton
        title="Add Call"
        onPress={() => navigation.navigate("AddCall")}
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

export default ManageCallsScreen;
