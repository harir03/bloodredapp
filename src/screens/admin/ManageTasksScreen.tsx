import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppButton from "../../components/ui/AppButton";
import EmptyState from "../../components/ui/EmptyState";
import ListItem from "../../components/ui/ListItem";
import SectionHeader from "../../components/ui/SectionHeader";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { taskService } from "../../services";
import { Task } from "../../types/database";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "Active" },
  { key: "completed", label: "Done" },
  { key: "overdue", label: "Overdue" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const PRIORITY_FILTERS = ["all", "high", "medium", "low"] as const;

const PRIORITY_COLOR: Record<string, string> = {
  low: COLORS.text_muted,
  medium: COLORS.info,
  high: COLORS.warning,
  urgent: COLORS.danger,
};

const ManageTasksScreen = ({ navigation }: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">("newest");

  useEffect(() => {
    setLoading(true);
    const unsub = taskService.subscribeToTasks((data) => {
      setTasks(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    // Real-time listener handles the actual data refresh
    setTimeout(() => setLoading(false), 500);
  }, []);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      // Priority filter
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      // Search
      if (search) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assignedToName?.toLowerCase().includes(q) ||
          t.city?.toLowerCase().includes(q) ||
          t.requestId?.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "priority") {
        const weight: any = { high: 0, medium: 1, low: 2 };
        return (weight[a.priority] ?? 9) - (weight[b.priority] ?? 9);
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, sortBy]);

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <ListItem
        title={item.title}
        subtitle={`${item.type?.replace(/_/g, " ") || 'Task'} · ${item.city || "No city"}\nRID: ${item.requestId || '—'} | LEG: ${item.request_id || '—'}`}
        rightText={item.priority.toUpperCase()}
        rightTextColor={PRIORITY_COLOR[item.priority] || COLORS.text_muted}
        onPress={() => navigation.navigate("TaskDetails", { taskId: item.id })}
      />
    ),
    [navigation],
  );

  const handleGlobalSync = async () => {
    Alert.alert(
      "Global Sync",
      "This will scan all tasks and update their status to match their linked blood requests. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sync Now",
          onPress: async () => {
            setLoading(true);
            const { updated, error } = await taskService.syncAllTasks();
            setLoading(false);
            if (error) {
              Alert.alert("Sync Error", error);
            } else {
              Alert.alert("Sync Complete", `Successfully updated ${updated} tasks.`);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 }}>
        <SectionHeader title="Manage Tasks" />
        <TouchableOpacity style={{ padding: 10 }} onPress={handleGlobalSync}>
          <Ionicons name="refresh-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={COLORS.text_muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks, city, volunteer..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.text_muted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.text_muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          keyExtractor={(i) => i.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setStatusFilter(item.key)}
              style={[
                styles.tab,
                statusFilter === item.key && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  statusFilter === item.key && styles.tabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.filtersRow}>
        {/* Priority Filter */}
        <View style={styles.chipRow}>
          {PRIORITY_FILTERS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPriorityFilter(p)}
              style={[
                styles.priorityChip,
                priorityFilter === p && styles.priorityChipActive,
              ]}
            >
              <Text
                style={[
                  styles.priorityChipText,
                  priorityFilter === p && styles.priorityChipTextActive,
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort Trigger */}
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => {
            const sequence: any = { newest: "oldest", oldest: "priority", priority: "newest" };
            setSortBy(sequence[sortBy]);
          }}
        >
          <Ionicons name="filter" size={14} color={COLORS.primary} />
          <Text style={styles.sortText}>
            {sortBy === "newest" ? "Latest" : sortBy === "priority" ? "Priority" : "Oldest"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && tasks.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={
                <FontAwesome5
                  name="tasks"
                  size={32}
                  color={COLORS.text_muted}
                />
              }
              message={search || statusFilter !== "all" || priorityFilter !== "all" ? "No matches found" : "No tasks found"}
            />
          }
        />
      )}
      <AppButton
        title="Add Emergency Task"
        onPress={() => navigation.navigate("AddTask")}
        style={styles.addBtn}
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.m,
    paddingHorizontal: 12,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    ...FONTS.body2,
    color: COLORS.text_primary,
    paddingVertical: 10,
    marginLeft: 8,
  },
  tabsRow: {
    gap: 8,
    paddingBottom: SPACING.s,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.caption,
    color: COLORS.text_muted,
  },
  tabTextActive: {
    color: COLORS.white,
    fontFamily: "Inter-SemiBold",
  },
  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  chipRow: {
    flexDirection: "row",
    gap: 6,
  },
  priorityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surface2,
  },
  priorityChipActive: {
    backgroundColor: COLORS.primary_subtle,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  priorityChipText: {
    ...FONTS.caption,
    fontSize: 10,
    color: COLORS.text_muted,
  },
  priorityChipTextActive: {
    color: COLORS.primary,
    fontFamily: "Inter-Bold",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sortText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontFamily: "Inter-SemiBold",
  },
  list: {
    gap: SPACING.s,
    paddingBottom: SPACING.xxxl,
  },
  addBtn: {
    marginTop: SPACING.s,
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    ...FONTS.body2,
    color: COLORS.text_muted,
    marginTop: 12,
  },
});

export default ManageTasksScreen;
