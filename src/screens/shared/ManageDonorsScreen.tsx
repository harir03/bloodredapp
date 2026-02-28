import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { BloodGroupBadge } from "../../components/ui/BloodGroupBadge";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { donorService } from "../../services/donorService";
import { useAuth } from "../../stores/AuthProvider";
import { Donor, DonorRemark } from "../../types/database";
import { exportToCSV } from "../../utils/exportUtils";

const STATUS_COLOR: Record<string, string> = {
  available: COLORS.success,
  unavailable: COLORS.text_muted,
  deferred: COLORS.warning,
};

export default function ManageDonorsScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filtered, setFiltered] = useState<Donor[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [remarkType, setRemarkType] = useState<DonorRemark["type"]>("general");
  const [submittingRemark, setSubmittingRemark] = useState(false);

  const fetchDonors = useCallback(async () => {
    try {
      const { data } = await donorService.getAll();
      const list = data ?? [];
      setDonors(list);
      setFiltered(list);

      // Update selected donor if modal is open
      if (selectedDonor) {
        const updated = list.find(d => d.id === selectedDonor.id);
        if (updated) setSelectedDonor(updated);
      }
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDonor]);

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

  const handleAddRemark = async () => {
    if (!selectedDonor || !newRemark.trim()) return;

    setSubmittingRemark(true);
    try {
      await donorService.addRemark(selectedDonor.id, {
        date: new Date().toISOString(),
        authorId: profile?.id || "unknown",
        authorName: profile?.name || "Volunteer",
        text: newRemark.trim(),
        type: remarkType,
      });
      setNewRemark("");
      Alert.alert("Success", "Note added successfully.");
      fetchDonors();
    } catch (e) {
      Alert.alert("Error", "Could not add note.");
    } finally {
      setSubmittingRemark(false);
    }
  };

  const handleLogDonation = async (donor: Donor) => {
    Alert.alert(
      "Log Donation",
      `Did ${donor.name} donate blood recently?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Donation",
          onPress: async () => {
            try {
              await donorService.logDonation(donor.id, 1, "Direct Walk-in");
              Alert.alert("Success", "Donation logged.");
              fetchDonors();
            } catch (e) {
              Alert.alert("Error", "Could not log donation.");
            }
          }
        }
      ]
    );
  };

  const handleExport = async () => {
    try {
      if (filtered.length === 0) {
        Alert.alert("No Data", "There are no donors to export based on current filters.");
        return;
      }

      const payload = filtered.map(d => ({
        ID: d.id,
        Name: d.name,
        Phone: d.phone,
        Email: d.email || "",
        BloodGroup: d.bloodGroup || d.blood_group || "Unknown",
        City: d.city,
        Status: d.status || "available",
        TotalDonations: d.totalDonations || d.total_donations || 0,
        LastDonation: d.lastDonationDate || d.last_donation_date || "Never"
      }));

      await exportToCSV("donors_export", payload);
    } catch (e: any) {
      Alert.alert("Export Error", e.message || "Failed to export data.");
    }
  };

  const renderItem = ({ item }: { item: Donor }) => {
    const bg = item.bloodGroup ?? item.blood_group ?? "O+";
    const status = item.status ?? "available";
    const donations = item.totalDonations ?? item.total_donations ?? 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => {
          setSelectedDonor(item);
          setShowModal(true);
        }}
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: COLORS.surface2 }]}
            onPress={handleExport}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={20} color={COLORS.text_primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddDonor")}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
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

      {/* Donor Details & Notes Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Donor Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text_primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedDonor && (
                <>
                  <View style={styles.donorHero}>
                    <BloodGroupBadge group={(selectedDonor.bloodGroup || selectedDonor.blood_group || "O+") as any} size="lg" />
                    <View style={styles.donorHeroInfo}>
                      <Text style={styles.donorName}>{selectedDonor.name}</Text>
                      <Text style={styles.donorMeta}>{selectedDonor.phone}</Text>
                      <Text style={styles.donorMeta}>{selectedDonor.city}, {selectedDonor.area}</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statVal}>{selectedDonor.totalDonations || selectedDonor.total_donations || 0}</Text>
                      <Text style={styles.statLab}>Donations</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statVal}>{selectedDonor.lastDonationDate ? "3mo ago" : "Never"}</Text>
                      <Text style={styles.statLab}>Last Time</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.statBox, { backgroundColor: COLORS.primary + "11" }]}
                      onPress={() => handleLogDonation(selectedDonor)}
                    >
                      <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                      <Text style={[styles.statLab, { color: COLORS.primary }]}>Log New</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionTab}>NOTES & REMARKS</Text>

                  {/* Add Remark */}
                  <View style={styles.addRemarkBox}>
                    <TextInput
                      style={styles.remarkInput}
                      placeholder="Add a medical or behavioral note..."
                      placeholderTextColor={COLORS.text_muted}
                      value={newRemark}
                      onChangeText={setNewRemark}
                      multiline
                    />
                    <View style={styles.remarkActions}>
                      <View style={styles.typeRow}>
                        {(["general", "medical", "behavioral"] as const).map(t => (
                          <TouchableOpacity
                            key={t}
                            onPress={() => setRemarkType(t)}
                            style={[
                              styles.typeBtn,
                              remarkType === t && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                            ]}
                          >
                            <Text style={[styles.typeBtnText, remarkType === t && { color: COLORS.white }]}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={[styles.postBtn, (!newRemark.trim() || submittingRemark) && { opacity: 0.5 }]}
                        onPress={handleAddRemark}
                        disabled={!newRemark.trim() || submittingRemark}
                      >
                        <Ionicons name="send" size={16} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Remarks List */}
                  <View style={styles.remarksList}>
                    {(selectedDonor.remarks || []).slice().reverse().map((r) => (
                      <View key={r.id} style={styles.remarkItem}>
                        <View style={styles.remarkHeader}>
                          <Text style={styles.remarkAuthor}>{r.authorName}</Text>
                          <View style={[styles.typeTag, { backgroundColor: r.type === "medical" ? COLORS.danger + "11" : r.type === "behavioral" ? COLORS.warning + "11" : COLORS.info + "11" }]}>
                            <Text style={[styles.typeTagText, { color: r.type === "medical" ? COLORS.danger : r.type === "behavioral" ? COLORS.warning : COLORS.info }]}>
                              {r.type}
                            </Text>
                          </View>
                          <Text style={styles.remarkDate}>{new Date(r.date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.remarkText}>{r.text}</Text>
                      </View>
                    ))}
                    {(!selectedDonor.remarks || selectedDonor.remarks.length === 0) && (
                      <Text style={styles.noRemarks}>No notes recorded for this donor yet.</Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    height: "85%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { ...FONTS.h3, color: COLORS.text_primary },
  modalBody: { padding: SPACING.l },

  donorHero: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xl, gap: SPACING.m },
  donorHeroInfo: { flex: 1 },
  donorName: { ...FONTS.h2, color: COLORS.text_primary },
  donorMeta: { ...FONTS.body, color: COLORS.text_secondary, marginTop: 2 },

  statsRow: { flexDirection: "row", gap: SPACING.s, marginBottom: SPACING.xl },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.m,
    padding: SPACING.m,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: { ...FONTS.h4, color: COLORS.text_primary },
  statLab: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },

  sectionTab: { ...FONTS.caption, letterSpacing: 1, color: COLORS.text_muted, marginBottom: SPACING.m },

  addRemarkBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  remarkInput: {
    ...FONTS.body,
    color: COLORS.text_primary,
    minHeight: 60,
    textAlignVertical: "top",
  },
  remarkActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.m,
  },
  typeRow: { flexDirection: "row", gap: 6 },
  typeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnText: { fontSize: 10, color: COLORS.text_secondary, fontWeight: "600" },
  postBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  remarksList: { gap: SPACING.m },
  remarkItem: {
    padding: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  remarkHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  remarkAuthor: { ...FONTS.body, fontWeight: "600", color: COLORS.text_primary },
  remarkDate: { ...FONTS.caption, color: COLORS.text_muted, marginLeft: "auto" },
  remarkText: { ...FONTS.body, color: COLORS.text_secondary, lineHeight: 20 },
  typeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeTagText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  noRemarks: { ...FONTS.body, color: COLORS.text_muted, textAlign: "center", marginTop: 20 },
});
