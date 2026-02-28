import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RequestCard } from "../../components/ui/RequestCard";
import { CardSkeleton } from "../../components/ui/SkeletonLoader";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { bloodRequestService } from "../../services/bloodRequestService";
import { useAuth } from "../../stores/AuthProvider";
import { BloodRequest } from "../../types/database";

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "Active" },
  { key: "escalated", label: "Escalated" },
  { key: "completed", label: "Resolved" },
] as const;

const URGENCY_FILTERS = ["all", "critical", "medium", "low"] as const;

export default function ManageBloodRequestsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (urgencyFilter !== "all") filters.urgency = urgencyFilter;
      const data = await bloodRequestService.getAll(filters);
      setRequests(data);
    } catch (e) {
      console.log("Load requests error:", e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgencyFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.patientName.toLowerCase().includes(q) ||
      r.hospital.toLowerCase().includes(q) ||
      r.bloodGroup.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Blood Requests</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddBloodRequest")}
        >
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.text_muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient, hospital, blood group..."
          placeholderTextColor={COLORS.text_muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.text_muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        data={FILTER_TABS}
        keyExtractor={(i) => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, statusFilter === item.key && styles.tabActive]}
            onPress={() => setStatusFilter(item.key)}
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

      {/* Urgency Filter */}
      <View style={styles.urgencyRow}>
        {URGENCY_FILTERS.map((u) => (
          <TouchableOpacity
            key={u}
            style={[
              styles.urgencyChip,
              urgencyFilter === u && styles.urgencyChipActive,
            ]}
            onPress={() => setUrgencyFilter(u)}
          >
            <Text
              style={[
                styles.urgencyText,
                urgencyFilter === u && styles.urgencyTextActive,
              ]}
            >
              {u === "all"
                ? "All Urgency"
                : u.charAt(0).toUpperCase() + u.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View>
              {[0, 1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="water-outline"
                size={48}
                color={COLORS.text_muted}
              />
              <Text style={styles.emptyText}>No requests found</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onPress={() =>
              navigation.navigate("BloodRequestDetails", { requestId: item.id })
            }
            showActions={
              profile?.role === "admin" || profile?.role === "helpline"
            }
            onAssign={() =>
              navigation.navigate("AssignVolunteer", { requestId: item.id })
            }
            onEscalate={async () => {
              await bloodRequestService.escalate(item.id, profile?.id ?? "");
              load();
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.l,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...FONTS.h3, color: COLORS.text_primary, flex: 1 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: SPACING.xxl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  searchInput: {
    flex: 1,
    ...FONTS.body3,
    color: COLORS.text_primary,
    padding: 0,
  },
  tabsRow: {
    paddingHorizontal: SPACING.xxl,
    gap: 8,
    marginBottom: SPACING.m,
  },
  tab: {
    paddingHorizontal: 14,
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
  tabText: { ...FONTS.caption, color: COLORS.text_muted },
  tabTextActive: { color: COLORS.white, fontFamily: "Inter-SemiBold" },
  urgencyRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xxl,
    gap: 8,
    marginBottom: SPACING.m,
  },
  urgencyChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surface2,
  },
  urgencyChipActive: {
    backgroundColor: COLORS.primary_subtle,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  urgencyText: { ...FONTS.caption, color: COLORS.text_muted },
  urgencyTextActive: { color: COLORS.primary, fontFamily: "Inter-SemiBold" },
  list: { padding: SPACING.xxl, paddingTop: 0 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { ...FONTS.body3, color: COLORS.text_muted },
});
