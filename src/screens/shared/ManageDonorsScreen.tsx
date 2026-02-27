import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { BloodGroupBadge } from "../../components/ui/BloodGroupBadge";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { donorService } from "../../services/donorService";
import { Donor } from "../../types/database";

const STATUS_COLOR: Record<string, string> = {
  available: COLORS.success,
  unavailable: COLORS.text_muted,
  deferred: COLORS.warning,
};

export default function ManageDonorsScreen({ navigation }: any) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filtered, setFiltered] = useState<Donor[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDonors = useCallback(async () => {
    try {
      const { data } = await donorService.getAll();
      const list = data ?? [];
      setDonors(list);
      setFiltered(list);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      q
        ? donors.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.phone.includes(q) ||
            d.city?.toLowerCase().includes(q) ||
            (d.bloodGroup ?? d.blood_group ?? "")
              .toString()
              .toLowerCase()
              .includes(q)
        )
        : donors
    );
  }, [query, donors]);

  const handleLogDonation = (donor: Donor) => {
    Alert.alert(
      "Log Donation",
      `Did ${donor.name} donate blood recently?\nLogging this will record 1 unit and mark them as deferred.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Donation",
          onPress: async () => {
            try {
              await donorService.logDonation(donor.id, 1, "Direct Walk-in");
              Alert.alert("Success", "Donation logged. Donor is now deferred.");
              fetchDonors(); // refresh the list
            } catch (e) {
              Alert.alert("Error", "Could not log donation.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Donor }) => {
    const bg = item.bloodGroup ?? item.blood_group ?? "O+";
    const status = item.status ?? "available";
    const donations = item.totalDonations ?? item.total_donations ?? 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => handleLogDonation(item)}
      >
        {/* Left: blood group badge */}
        <View style={styles.badgeCol}>
          <BloodGroupBadge group={bg as any} size="md" />
        </View>

        {/* Center: info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.meta}>
            {item.city}
            {item.area ? ` · ${item.area}` : ""}
          </Text>
          <Text style={styles.meta}>{item.phone}</Text>
        </View>

        {/* Right: status + donations */}
        <View style={styles.right}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: STATUS_COLOR[status] + "22" },
            ]}
          >
            <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
          <Text style={styles.donationCount}>
            <Text style={styles.donationNum}>{donations}</Text> donations
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Donors</Text>
          {!loading && (
            <Text style={styles.headerSub}>{filtered.length} registered</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddDonor")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={17}
          color={COLORS.text_muted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, city, blood group…"
          placeholderTextColor={COLORS.text_muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.text_muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDonors();
            }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="heart-dislike-outline"
              size={48}
              color={COLORS.text_muted}
            />
            <Text style={styles.emptyText}>
              {loading ? "Loading donors…" : "No donors found"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.xl + 4,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.m,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { ...FONTS.h3, color: COLORS.text_primary },
  headerSub: { ...FONTS.caption, color: COLORS.text_secondary, marginTop: 1 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.m,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    margin: SPACING.m,
    borderRadius: RADII.l,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  searchIcon: { marginRight: SPACING.s },
  searchInput: { flex: 1, color: COLORS.text_primary, ...FONTS.body },

  list: { paddingHorizontal: SPACING.m, paddingBottom: SPACING.xxxl },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.l,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.m,
  },
  badgeCol: { alignItems: "center", justifyContent: "center", width: 48 },
  info: { flex: 1 },
  name: { ...FONTS.h4, color: COLORS.text_primary },
  meta: { ...FONTS.caption, color: COLORS.text_secondary, marginTop: 2 },

  right: { alignItems: "flex-end", gap: 4 },
  statusPill: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 3,
    borderRadius: RADII.full,
  },
  statusText: { ...FONTS.caption, fontFamily: "Inter-Medium" },
  donationCount: { ...FONTS.caption, color: COLORS.text_muted },
  donationNum: {
    ...FONTS.caption,
    color: COLORS.text_primary,
    fontFamily: "Inter-SemiBold",
  },

  empty: { alignItems: "center", paddingTop: SPACING.xxxl * 2, gap: SPACING.m },
  emptyText: { ...FONTS.body, color: COLORS.text_muted },
});
