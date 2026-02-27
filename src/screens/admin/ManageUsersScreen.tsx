import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { useQuery } from "../../hooks/useQuery";
import { profileService } from "../../services";
import { Profile, UserRole } from "../../types/database";

const ROLE_META: Record<
  UserRole,
  { label: string; icon: string; color: string }
> = {
  admin: { label: "Admin", icon: "shield", color: COLORS.primary },
  city_manager: { label: "City Manager", icon: "business", color: "#3B82F6" },
  helpline: { label: "Helpline", icon: "call", color: "#22C55E" },
  hr_manager: { label: "HR Manager", icon: "briefcase", color: "#F59E0B" },
  volunteer: { label: "Volunteer", icon: "heart", color: "#EC4899" },
  donor: { label: "Donor", icon: "water", color: COLORS.accent },
};

const SORT_OPTIONS: {
  label: string;
  by: "name" | "created_at" | "role";
  dir: "asc" | "desc";
  icon: string;
}[] = [
    { label: "Name A to Z", by: "name", dir: "asc", icon: "arrow-up-outline" },
    { label: "Name Z to A", by: "name", dir: "desc", icon: "arrow-down-outline" },
    {
      label: "Newest first",
      by: "created_at",
      dir: "desc",
      icon: "time-outline",
    },
    { label: "Oldest first", by: "created_at", dir: "asc", icon: "time-outline" },
    { label: "By Role", by: "role", dir: "asc", icon: "people-outline" },
  ];

const STATUS_OPTIONS: {
  label: string;
  value: "all" | "active" | "inactive";
  icon: string;
  color: string;
}[] = [
    {
      label: "All",
      value: "all",
      icon: "apps-outline",
      color: COLORS.text_secondary,
    },
    {
      label: "Active",
      value: "active",
      icon: "checkmark-circle-outline",
      color: "#22C55E",
    },
    {
      label: "Inactive",
      value: "inactive",
      icon: "close-circle-outline",
      color: COLORS.text_muted,
    },
  ];

const getInitials = (name: string) =>
  name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const UserCard = ({
  item,
  onPress,
}: {
  item: Profile;
  onPress: () => void;
}) => {
  const meta = ROLE_META[item.role] ?? ROLE_META.volunteer;
  const initials = getInitials(item.name ?? "");
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: meta.color + "22",
            borderColor: meta.color + "55",
          },
        ]}
      >
        <Text style={[styles.avatarText, { color: meta.color }]}>
          {initials || "?"}
        </Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: item.is_active ? "#22C55E" : COLORS.text_muted,
              },
            ]}
          />
        </View>
        <Text style={styles.cardEmail} numberOfLines={1}>
          {item.email}
        </Text>
        <View style={styles.cardMeta}>
          {item.phone ? (
            <View style={styles.metaChip}>
              <Ionicons
                name="call-outline"
                size={10}
                color={COLORS.text_muted}
              />
              <Text style={styles.metaChipText}>{item.phone}</Text>
            </View>
          ) : null}
          {(item as any).city ? (
            <View style={styles.metaChip}>
              <Ionicons
                name="location-outline"
                size={10}
                color={COLORS.text_muted}
              />
              <Text style={styles.metaChipText}>{(item as any).city}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.cardRight}>
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: meta.color + "18",
              borderColor: meta.color + "44",
            },
          ]}
        >
          <Ionicons name={meta.icon as any} size={11} color={meta.color} />
          <Text style={[styles.roleBadgeText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={COLORS.text_muted}
          style={{ marginTop: 6 }}
        />
      </View>
    </TouchableOpacity>
  );
};

const ManageUsersScreen = ({ navigation }: any) => {
  const {
    data: users,
    loading,
    refresh,
  } = useQuery<Profile>(() => profileService.getAll());
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "role">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const roleCounts = useMemo(() => {
    const counts = {} as Record<UserRole, number>;
    (Object.keys(ROLE_META) as UserRole[]).forEach((r) => {
      counts[r] = 0;
    });
    users.forEach((u) => {
      if (counts[u.role] !== undefined) counts[u.role]++;
    });
    return counts;
  }, [users]);

  const activeCount = useMemo(
    () => users.filter((u) => u.is_active).length,
    [users],
  );
  const inactiveCount = users.length - activeCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = users.filter((u) => {
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? u.is_active : !u.is_active);
      const matchQ =
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q) ||
        ((u as any).city ?? "").toLowerCase().includes(q);
      return matchRole && matchStatus && matchQ;
    });
    return [...result].sort((a, b) => {
      let aVal = "",
        bVal = "";
      if (sortBy === "name") {
        aVal = (a.name ?? "").toLowerCase();
        bVal = (b.name ?? "").toLowerCase();
      } else if (sortBy === "created_at") {
        aVal = a.created_at ?? "";
        bVal = b.created_at ?? "";
      } else if (sortBy === "role") {
        aVal = a.role;
        bVal = b.role;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [users, query, roleFilter, statusFilter, sortBy, sortDir]);

  const hasActiveFilters =
    statusFilter !== "all" || sortBy !== "name" || sortDir !== "asc";
  const hasAnyFilter = hasActiveFilters || roleFilter !== "all";
  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.by === sortBy && s.dir === sortDir)?.label ?? "";

  const resetAll = () => {
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortBy("name");
    setSortDir("asc");
  };

  const renderItem = useCallback(
    ({ item }: { item: Profile }) => (
      <UserCard
        item={item}
        onPress={() => navigation.navigate("UserDetails", { userId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Users</Text>
          <Text style={styles.headerSub}>
            {loading && !users.length ? "Loading..." : `${users.length} total`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: "#22C55E" }]} />
            <Text style={styles.statPillText}>{activeCount} active</Text>
          </View>
          <View style={styles.statPill}>
            <View
              style={[styles.statDot, { backgroundColor: COLORS.text_muted }]}
            />
            <Text style={styles.statPillText}>{inactiveCount} inactive</Text>
          </View>
        </View>
      </View>

      {!loading && users.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.roleRow}
        >
          {(Object.keys(ROLE_META) as UserRole[]).map((r) => {
            const meta = ROLE_META[r];
            const active = roleFilter === r;
            return (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleCard,
                  active && {
                    borderColor: meta.color,
                    backgroundColor: meta.color + "14",
                  },
                ]}
                onPress={() => setRoleFilter(active ? "all" : r)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.roleCardIcon,
                    { backgroundColor: meta.color + (active ? "30" : "18") },
                  ]}
                >
                  <Ionicons
                    name={meta.icon as any}
                    size={16}
                    color={meta.color}
                  />
                </View>
                <Text
                  style={[
                    styles.roleCardCount,
                    active && { color: meta.color },
                  ]}
                >
                  {roleCounts[r]}
                </Text>
                <Text
                  style={[
                    styles.roleCardLabel,
                    active && { color: meta.color },
                  ]}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={16}
            color={COLORS.text_muted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, email, phone..."
            placeholderTextColor={COLORS.text_muted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={COLORS.text_muted}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterIconBtn,
            hasActiveFilters && styles.filterIconBtnActive,
          ]}
          onPress={() => setShowFilterSheet(true)}
          activeOpacity={0.75}
        >
          <Ionicons
            name="options"
            size={19}
            color={hasActiveFilters ? COLORS.primary : COLORS.text_secondary}
          />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {hasAnyFilter && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.activePills}
        >
          {roleFilter !== "all" && (
            <View
              style={[
                styles.activePill,
                {
                  borderColor: ROLE_META[roleFilter].color + "66",
                  backgroundColor: ROLE_META[roleFilter].color + "18",
                },
              ]}
            >
              <Ionicons
                name={ROLE_META[roleFilter].icon as any}
                size={11}
                color={ROLE_META[roleFilter].color}
              />
              <Text
                style={[
                  styles.activePillText,
                  { color: ROLE_META[roleFilter].color },
                ]}
              >
                {ROLE_META[roleFilter].label}
              </Text>
              <TouchableOpacity
                onPress={() => setRoleFilter("all")}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name="close"
                  size={11}
                  color={ROLE_META[roleFilter].color}
                />
              </TouchableOpacity>
            </View>
          )}
          {statusFilter !== "all" && (
            <View
              style={[
                styles.activePill,
                {
                  borderColor:
                    statusFilter === "active" ? "#22C55E66" : COLORS.border,
                  backgroundColor:
                    statusFilter === "active" ? "#22C55E18" : COLORS.surface,
                },
              ]}
            >
              <Ionicons
                name={
                  statusFilter === "active"
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={11}
                color={
                  statusFilter === "active" ? "#22C55E" : COLORS.text_muted
                }
              />
              <Text
                style={[
                  styles.activePillText,
                  {
                    color:
                      statusFilter === "active"
                        ? "#22C55E"
                        : COLORS.text_secondary,
                  },
                ]}
              >
                {statusFilter === "active" ? "Active" : "Inactive"}
              </Text>
              <TouchableOpacity
                onPress={() => setStatusFilter("all")}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close" size={11} color={COLORS.text_muted} />
              </TouchableOpacity>
            </View>
          )}
          {(sortBy !== "name" || sortDir !== "asc") && (
            <View
              style={[
                styles.activePill,
                {
                  borderColor: COLORS.primary + "55",
                  backgroundColor: COLORS.primary + "12",
                },
              ]}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={11}
                color={COLORS.primary}
              />
              <Text style={[styles.activePillText, { color: COLORS.primary }]}>
                {activeSortLabel}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSortBy("name");
                  setSortDir("asc");
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close" size={11} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.resetPill} onPress={resetAll}>
            <Ionicons
              name="refresh-outline"
              size={11}
              color={COLORS.text_muted}
            />
            <Text style={styles.resetPillText}>Reset all</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} of {users.length} user
          {users.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching users...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="people-outline"
                  size={36}
                  color={COLORS.text_muted}
                />
              </View>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>
                {query || hasAnyFilter
                  ? "Try adjusting your search or filters"
                  : "Add your first user to get started"}
              </Text>
              {(query || hasAnyFilter) && (
                <TouchableOpacity style={styles.emptyReset} onPress={resetAll}>
                  <Text style={styles.emptyResetText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <Modal
        visible={showFilterSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setShowFilterSheet(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Sort & Filter</Text>
            <TouchableOpacity onPress={resetAll} style={styles.sheetResetBtn}>
              <Text style={styles.sheetResetText}>Reset all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sheetSection}>SORT BY</Text>
            <View style={styles.optionGrid}>
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt.by && sortDir === opt.dir;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.optionChip,
                      active && styles.optionChipActive,
                    ]}
                    onPress={() => {
                      setSortBy(opt.by);
                      setSortDir(opt.dir);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={13}
                      color={active ? COLORS.primary : COLORS.text_muted}
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        active && {
                          color: COLORS.primary,
                          fontFamily: "Inter-SemiBold",
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {active && <View style={styles.optionChipDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.sheetSection}>STATUS</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => {
                const active = statusFilter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.statusChip,
                      active && {
                        borderColor: opt.color + "88",
                        backgroundColor: opt.color + "18",
                      },
                    ]}
                    onPress={() => setStatusFilter(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={14}
                      color={active ? opt.color : COLORS.text_muted}
                    />
                    <Text
                      style={[
                        styles.statusChipText,
                        active && {
                          color: opt.color,
                          fontFamily: "Inter-SemiBold",
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.sheetSection}>ROLE</Text>
            <View style={styles.optionGrid}>
              {(["all", ...Object.keys(ROLE_META)] as (UserRole | "all")[]).map(
                (r) => {
                  const active = roleFilter === r;
                  const meta = r === "all" ? null : ROLE_META[r as UserRole];
                  const color = meta?.color ?? COLORS.text_secondary;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.optionChip,
                        active && {
                          borderColor: color + "55",
                          backgroundColor: color + "14",
                        },
                      ]}
                      onPress={() => setRoleFilter(r)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={(meta ? meta.icon : "apps-outline") as any}
                        size={13}
                        color={active ? color : COLORS.text_muted}
                      />
                      <Text
                        style={[
                          styles.optionChipText,
                          active && { color, fontFamily: "Inter-SemiBold" },
                        ]}
                      >
                        {r === "all" ? "All roles" : meta!.label}
                      </Text>
                      {active && (
                        <View
                          style={[
                            styles.optionChipDot,
                            { backgroundColor: color },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                },
              )}
            </View>
          </ScrollView>
          <TouchableOpacity
            style={styles.sheetDone}
            onPress={() => setShowFilterSheet(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.sheetDoneText}>
              Apply {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddUser")}
        activeOpacity={0.85}
      >
        <Ionicons name="person-add" size={21} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.text_primary },
  headerSub: { ...FONTS.caption, color: COLORS.text_secondary, marginTop: 2 },
  headerRight: { flexDirection: "row", gap: SPACING.s },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statPillText: {
    ...FONTS.caption,
    color: COLORS.text_secondary,
    fontSize: 11,
  },
  roleRow: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    gap: SPACING.s,
  },
  roleCard: {
    width: 74,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 2,
  },
  roleCardIcon: {
    width: 30,
    height: 30,
    borderRadius: RADII.m,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  roleCardCount: {
    ...FONTS.body2,
    color: COLORS.text_primary,
    fontFamily: "Inter-Bold",
  },
  roleCardLabel: {
    ...FONTS.caption,
    color: COLORS.text_secondary,
    textAlign: "center",
    fontSize: 10,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.m,
    marginTop: SPACING.xs,
    gap: SPACING.s,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  searchInput: { flex: 1, color: COLORS.text_primary, ...FONTS.body },
  filterIconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.l,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  filterIconBtnActive: {
    borderColor: COLORS.primary + "88",
    backgroundColor: COLORS.primary + "14",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  activePills: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
    paddingBottom: 2,
    gap: SPACING.s,
    flexDirection: "row",
    alignItems: "center",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.full,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
  },
  activePillText: {
    ...FONTS.caption,
    fontSize: 11,
    fontFamily: "Inter-Medium",
  },
  resetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  resetPillText: { ...FONTS.caption, fontSize: 11, color: COLORS.text_muted },
  countRow: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.xs,
  },
  countText: { ...FONTS.caption, color: COLORS.text_muted },
  list: { paddingHorizontal: SPACING.m, paddingBottom: 110 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    paddingRight: SPACING.m,
    paddingVertical: 12,
    gap: SPACING.m,
  },
  cardAccent: { width: 3.5, alignSelf: "stretch" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADII.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    flexShrink: 0,
  },
  avatarText: { ...FONTS.h4 },
  cardInfo: { flex: 1 },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  cardName: {
    ...FONTS.body2,
    color: COLORS.text_primary,
    flex: 1,
    fontFamily: "Inter-SemiBold",
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  cardEmail: { ...FONTS.caption, color: COLORS.text_secondary, fontSize: 12 },
  cardMeta: { flexDirection: "row", gap: 8, marginTop: 3, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaChipText: { ...FONTS.caption, color: COLORS.text_muted, fontSize: 11 },
  cardRight: { alignItems: "flex-end", flexShrink: 0 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  roleBadgeText: { ...FONTS.caption, fontFamily: "Inter-Medium", fontSize: 11 },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: SPACING.l,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: SPACING.m,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.m,
  },
  sheetTitle: { ...FONTS.h3, color: COLORS.text_primary },
  sheetResetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetResetText: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    fontFamily: "Inter-Medium",
  },
  sheetSection: {
    ...FONTS.caption,
    fontSize: 10,
    color: COLORS.text_muted,
    fontFamily: "Inter-SemiBold",
    letterSpacing: 1,
    marginBottom: SPACING.s,
    marginTop: SPACING.m,
  },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.s },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  optionChipActive: {
    borderColor: COLORS.primary + "55",
    backgroundColor: COLORS.primary + "14",
  },
  optionChipText: {
    ...FONTS.caption,
    color: COLORS.text_secondary,
    fontSize: 12,
  },
  optionChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginLeft: 2,
  },
  statusRow: { flexDirection: "row", gap: SPACING.s },
  statusChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADII.m,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  statusChipText: {
    ...FONTS.caption,
    color: COLORS.text_secondary,
    fontFamily: "Inter-Medium",
  },
  sheetDone: {
    marginTop: SPACING.l,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.l,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetDoneText: { ...FONTS.h4, color: COLORS.white },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.m,
  },
  loadingText: { ...FONTS.body, color: COLORS.text_muted },
  empty: { alignItems: "center", paddingTop: 80, gap: SPACING.s },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.s,
  },
  emptyTitle: { ...FONTS.h4, color: COLORS.text_primary },
  emptySubtitle: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    textAlign: "center",
    maxWidth: 220,
  },
  emptyReset: {
    marginTop: SPACING.s,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    backgroundColor: COLORS.primary + "12",
  },
  emptyResetText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontFamily: "Inter-SemiBold",
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: SPACING.l,
    width: 54,
    height: 54,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});

export default ManageUsersScreen;
