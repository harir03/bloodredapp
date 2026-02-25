import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
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
};

const FILTER_ROLES: (UserRole | "all")[] = [
  "all",
  "admin",
  "city_manager",
  "hr_manager",
  "helpline",
  "volunteer",
];

const getInitials = (name: string) =>
  name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// ─── Role Summary Card ───────────────────────────────────────────────────────
const RoleSummaryCard = ({
  role,
  count,
  active,
  onPress,
}: {
  role: UserRole;
  count: number;
  active: boolean;
  onPress: () => void;
}) => {
  const meta = ROLE_META[role];
  return (
    <TouchableOpacity
      style={[
        styles.summaryCard,
        active && {
          borderColor: meta.color,
          backgroundColor: meta.color + "14",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[styles.summaryIcon, { backgroundColor: meta.color + "22" }]}
      >
        <Ionicons name={meta.icon as any} size={18} color={meta.color} />
      </View>
      <Text style={[styles.summaryCount, active && { color: meta.color }]}>
        {count}
      </Text>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {meta.label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── User Card ───────────────────────────────────────────────────────────────
const UserCard = ({
  item,
  onPress,
}: {
  item: Profile;
  onPress: () => void;
}) => {
  const meta = ROLE_META[item.role] ?? ROLE_META.volunteer;
  const initials = getInitials(item.name);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Colored left accent */}
      <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />

      {/* Avatar */}
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

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.is_active ? (
            <View style={styles.activeDot} />
          ) : (
            <View style={styles.inactiveDot} />
          )}
        </View>
        <Text style={styles.cardEmail} numberOfLines={1}>
          {item.email}
        </Text>
        {item.phone ? (
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={11} color={COLORS.text_muted} />
            <Text style={styles.cardPhone}>{item.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* Role badge + chevron */}
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
          size={16}
          color={COLORS.text_muted}
          style={{ marginTop: 4 }}
        />
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const ManageUsersScreen = ({ navigation }: any) => {
  const {
    data: users,
    loading,
    refresh,
  } = useQuery<Profile>(() => profileService.getAll());
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

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

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => {
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchRole && matchQ;
    });
  }, [users, query, roleFilter]);

  const activeCount = useMemo(
    () => users.filter((u) => u.is_active).length,
    [users],
  );
  const inactiveCount = users.length - activeCount;

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
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Users</Text>
          <Text style={styles.headerSub}>
            {loading && !users.length
              ? "Loading…"
              : `${users.length} total · ${activeCount} active`}
          </Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <View
              style={[
                styles.headerStatDot,
                { backgroundColor: COLORS.success },
              ]}
            />
            <Text style={styles.headerStatText}>{activeCount}</Text>
          </View>
          <View style={styles.headerStatItem}>
            <View
              style={[
                styles.headerStatDot,
                { backgroundColor: COLORS.text_muted },
              ]}
            />
            <Text style={styles.headerStatText}>{inactiveCount}</Text>
          </View>
        </View>
      </View>

      {/* ── Role Summary Row ── */}
      {!loading && users.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}
        >
          {(Object.keys(ROLE_META) as UserRole[]).map((r) => (
            <RoleSummaryCard
              key={r}
              role={r}
              count={roleCounts[r]}
              active={roleFilter === r}
              onPress={() => setRoleFilter(roleFilter === r ? "all" : r)}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Search ── */}
      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={17}
          color={COLORS.text_muted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or email…"
          placeholderTextColor={COLORS.text_muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {(query.length > 0 || roleFilter !== "all") && (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setRoleFilter("all");
            }}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.text_muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTER_ROLES.map((r) => {
          const active = r === roleFilter;
          const meta = r === "all" ? null : ROLE_META[r as UserRole];
          const color = meta?.color ?? COLORS.primary;
          return (
            <TouchableOpacity
              key={r}
              style={[
                styles.chip,
                active && { backgroundColor: color + "1A", borderColor: color },
              ]}
              onPress={() => setRoleFilter(r)}
              activeOpacity={0.7}
            >
              {meta && (
                <Ionicons
                  name={meta.icon as any}
                  size={12}
                  color={active ? color : COLORS.text_muted}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[
                  styles.chipText,
                  active && { color, fontFamily: "Inter-SemiBold" },
                ]}
              >
                {r === "all" ? "All" : meta!.label}
              </Text>
              {r !== "all" && (
                <Text style={[styles.chipCount, active && { color }]}>
                  {" "}
                  {roleCounts[r as UserRole]}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Result count ── */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {roleFilter !== "all"
            ? ` · ${ROLE_META[roleFilter as UserRole]?.label}`
            : ""}
        </Text>
      </View>

      {/* ── List ── */}
      {loading && users.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching users…</Text>
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
                {query
                  ? "Try a different search term"
                  : "Add your first user to get started"}
              </Text>
            </View>
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddUser")}
        activeOpacity={0.85}
      >
        <Ionicons name="person-add" size={22} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.text_primary },
  headerSub: { ...FONTS.caption, color: COLORS.text_secondary, marginTop: 2 },
  headerStats: { flexDirection: "row", gap: SPACING.m },
  headerStatItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerStatDot: { width: 8, height: 8, borderRadius: RADII.full },
  headerStatText: { ...FONTS.caption, color: COLORS.text_secondary },

  // Summary cards
  summaryRow: {
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
    gap: SPACING.s,
  },
  summaryCard: {
    width: 88,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.m,
    alignItems: "center",
    gap: 4,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: RADII.m,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  summaryCount: { ...FONTS.h3, color: COLORS.text_primary },
  summaryLabel: {
    ...FONTS.caption,
    color: COLORS.text_secondary,
    textAlign: "center",
  },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.m,
    borderRadius: RADII.l,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 46,
    marginBottom: 2,
  },
  searchIcon: { marginRight: SPACING.s },
  searchInput: { flex: 1, color: COLORS.text_primary, ...FONTS.body },
  clearBtn: { padding: 4 },

  // Chips
  chips: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    gap: SPACING.s,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipText: { ...FONTS.caption, color: COLORS.text_secondary },
  chipCount: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    fontFamily: "Inter-Medium",
  },

  // Count
  countRow: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xs },
  countText: { ...FONTS.caption, color: COLORS.text_muted },

  // List
  list: { paddingHorizontal: SPACING.m, paddingBottom: 100 },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    gap: SPACING.m,
    paddingRight: SPACING.m,
    paddingVertical: SPACING.m,
  },
  cardAccent: { width: 4, alignSelf: "stretch", borderRadius: 0 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: RADII.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    flexShrink: 0,
  },
  avatarText: { ...FONTS.h4 },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { ...FONTS.h4, color: COLORS.text_primary, flex: 1 },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: RADII.full,
    backgroundColor: COLORS.success,
  },
  inactiveDot: {
    width: 7,
    height: 7,
    borderRadius: RADII.full,
    backgroundColor: COLORS.text_muted,
  },
  cardEmail: { ...FONTS.caption, color: COLORS.text_secondary, marginTop: 2 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  cardPhone: { ...FONTS.caption, color: COLORS.text_muted },
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
  roleBadgeText: { ...FONTS.caption, fontFamily: "Inter-Medium" },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.m,
  },
  loadingText: { ...FONTS.body, color: COLORS.text_muted },

  // Empty
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

  // FAB
  fab: {
    position: "absolute",
    bottom: SPACING.xxxl,
    right: SPACING.l,
    width: 56,
    height: 56,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});

export default ManageUsersScreen;
