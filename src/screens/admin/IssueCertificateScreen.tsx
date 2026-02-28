import { Ionicons } from "@expo/vector-icons";
import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../../config/firebase";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { certificateService, CertificateType } from "../../services/certificateService";
import { useAuth } from "../../stores/AuthProvider";
import { seedTestCertificates } from "../../utils/seedTestCerts";

interface UserResult {
    id: string;
    name: string;
    email: string;
    role: string;
    blood_group?: string;
}

export default function IssueCertificateScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();

    const [certType, setCertType] = useState<CertificateType>("donor");
    const [searchEmail, setSearchEmail] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);

    // Form fields
    const [eventName, setEventName] = useState("");
    const [campaignName, setCampaignName] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [units, setUnits] = useState("1");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [issuing, setIssuing] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!searchEmail.trim()) return;
        setSearching(true);
        setSearchResults([]);
        setSelectedUser(null);
        try {
            const q = query(
                collection(db, "profiles"),
                where("email", "==", searchEmail.trim().toLowerCase())
            );
            const snap = await getDocs(q);
            if (snap.empty) {
                Alert.alert("Not Found", `No user found with email "${searchEmail}".`);
            } else {
                const results = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as any),
                })) as UserResult[];
                setSearchResults(results);
                if (results.length === 1) setSelectedUser(results[0]);
            }
        } catch (e) {
            Alert.alert("Error", "Failed to search users.");
        } finally {
            setSearching(false);
        }
    }, [searchEmail]);

    const handleIssue = useCallback(async () => {
        if (!selectedUser) {
            Alert.alert("No User", "Please search and select a user first.");
            return;
        }
        if (!eventName.trim()) {
            Alert.alert("Missing Field", "Event name is required.");
            return;
        }

        setIssuing(true);
        try {
            if (certType === "donor") {
                await certificateService.issueDonorCertificate(
                    selectedUser.id,
                    selectedUser.name,
                    bloodGroup || selectedUser.blood_group || "—",
                    parseInt(units) || 1,
                    eventName.trim(),
                    date
                );
            } else {
                await certificateService.issueVolunteerCertificate(
                    selectedUser.id,
                    selectedUser.name,
                    campaignName.trim() || eventName.trim(),
                    eventName.trim(),
                    date
                );
            }

            Alert.alert(
                "✅ Certificate Issued!",
                `${certType === "donor" ? "Donor" : "Volunteer"} certificate issued to ${selectedUser.name} (${selectedUser.email}).`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (e) {
            console.error("Issue cert error:", e);
            Alert.alert("Error", "Failed to issue certificate. Please try again.");
        } finally {
            setIssuing(false);
        }
    }, [selectedUser, certType, eventName, campaignName, bloodGroup, units, date, navigation]);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Issue Certificate</Text>
                    <Text style={styles.headerSub}>Manually award certificates</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Certificate Type */}
                <Text style={styles.label}>Certificate Type</Text>
                <View style={styles.typeRow}>
                    <TouchableOpacity
                        style={[styles.typeBtn, certType === "donor" && styles.typeBtnActive]}
                        onPress={() => setCertType("donor")}
                    >
                        <Text style={{ fontSize: 20 }}>🩸</Text>
                        <Text style={[styles.typeText, certType === "donor" && styles.typeTextActive]}>
                            Donor
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeBtn, certType === "volunteer" && styles.typeBtnActiveBlue]}
                        onPress={() => setCertType("volunteer")}
                    >
                        <Text style={{ fontSize: 20 }}>🤝</Text>
                        <Text style={[styles.typeText, certType === "volunteer" && styles.typeTextActiveBlue]}>
                            Volunteer
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* User Search */}
                <Text style={styles.label}>Recipient (Search by Email)</Text>
                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Enter user email..."
                        placeholderTextColor={COLORS.text_disabled}
                        value={searchEmail}
                        onChangeText={setSearchEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={styles.searchBtn}
                        onPress={handleSearch}
                        disabled={searching}
                    >
                        {searching ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Ionicons name="search" size={18} color={COLORS.white} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Selected User */}
                {selectedUser && (
                    <View style={styles.userCard}>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userAvatarText}>
                                {selectedUser.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName}>{selectedUser.name}</Text>
                            <Text style={styles.userEmail}>{selectedUser.email}</Text>
                            <Text style={styles.userRole}>
                                {selectedUser.role} {selectedUser.blood_group ? `• ${selectedUser.blood_group}` : ""}
                            </Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                    </View>
                )}

                {/* Search Results (if multiple) */}
                {searchResults.length > 1 && !selectedUser && (
                    searchResults.map((u) => (
                        <TouchableOpacity
                            key={u.id}
                            style={styles.userCard}
                            onPress={() => {
                                setSelectedUser(u);
                                setBloodGroup(u.blood_group || "");
                            }}
                        >
                            <View style={styles.userAvatar}>
                                <Text style={styles.userAvatarText}>
                                    {u.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userName}>{u.name}</Text>
                                <Text style={styles.userEmail}>{u.email}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                {/* Event Name */}
                <Text style={styles.label}>Event Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. City Blood Donation Camp 2026"
                    placeholderTextColor={COLORS.text_disabled}
                    value={eventName}
                    onChangeText={setEventName}
                />

                {/* Donor-specific fields */}
                {certType === "donor" && (
                    <>
                        <Text style={styles.label}>Blood Group</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. O+, A-, B+"
                            placeholderTextColor={COLORS.text_disabled}
                            value={bloodGroup || selectedUser?.blood_group || ""}
                            onChangeText={setBloodGroup}
                        />
                        <Text style={styles.label}>Units Donated</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="1"
                            placeholderTextColor={COLORS.text_disabled}
                            value={units}
                            onChangeText={setUnits}
                            keyboardType="numeric"
                        />
                    </>
                )}

                {/* Volunteer-specific fields */}
                {certType === "volunteer" && (
                    <>
                        <Text style={styles.label}>Campaign Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Diwali Blood Drive 2026"
                            placeholderTextColor={COLORS.text_disabled}
                            value={campaignName}
                            onChangeText={setCampaignName}
                        />
                    </>
                )}

                {/* Date */}
                <Text style={styles.label}>Date</Text>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.text_disabled}
                    value={date}
                    onChangeText={setDate}
                />

                {/* Issue Button */}
                <TouchableOpacity
                    style={[styles.issueBtn, issuing && { opacity: 0.6 }]}
                    onPress={handleIssue}
                    disabled={issuing}
                >
                    {issuing ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Ionicons name="ribbon" size={20} color={COLORS.white} />
                    )}
                    <Text style={styles.issueBtnText}>
                        {issuing ? "Issuing..." : "Issue Certificate"}
                    </Text>
                </TouchableOpacity>

                {/* Dev: Seed test certs */}
                <TouchableOpacity
                    style={styles.seedBtn}
                    onPress={() => {
                        Alert.alert(
                            "Seed Test Certificates",
                            "Issue test certificates to avansh@test.com (donor) and volunteer_test@gmail.com (volunteer)?",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Seed",
                                    onPress: async () => {
                                        await seedTestCertificates();
                                        Alert.alert("Done", "Test certificates seeded! Check the users' profiles.");
                                    },
                                },
                            ]
                        );
                    }}
                >
                    <Ionicons name="flask-outline" size={16} color={COLORS.text_muted} />
                    <Text style={styles.seedBtnText}>Seed Test Certificates</Text>
                </TouchableOpacity>
            </ScrollView>
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
        gap: 14,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    headerTitle: { ...FONTS.h3, color: COLORS.text_primary },
    headerSub: { ...FONTS.caption, color: COLORS.text_muted },
    scroll: { paddingHorizontal: SPACING.xxl },

    label: {
        ...FONTS.label,
        color: COLORS.text_secondary,
        marginTop: SPACING.l,
        marginBottom: 6,
    },

    // Type selector
    typeRow: { flexDirection: "row", gap: 12 },
    typeBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: RADII.l,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    typeBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + "12",
    },
    typeBtnActiveBlue: {
        borderColor: "#2563EB",
        backgroundColor: "#2563EB" + "12",
    },
    typeText: { ...FONTS.label, color: COLORS.text_muted },
    typeTextActive: { color: COLORS.primary, fontWeight: "700" },
    typeTextActiveBlue: { color: "#2563EB", fontWeight: "700" },

    // Search
    searchRow: { flexDirection: "row", gap: 8 },
    searchInput: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        paddingHorizontal: SPACING.m,
        paddingVertical: 12,
        color: COLORS.text_primary,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...FONTS.body3,
    },
    searchBtn: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    // User card
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.m,
        marginTop: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.success + "44",
        gap: 12,
    },
    userAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary + "18",
        alignItems: "center",
        justifyContent: "center",
    },
    userAvatarText: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
    userName: { ...FONTS.label, color: COLORS.text_primary },
    userEmail: { ...FONTS.caption, color: COLORS.text_muted },
    userRole: { ...FONTS.caption, color: COLORS.text_secondary, marginTop: 1 },

    // Input
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        paddingHorizontal: SPACING.m,
        paddingVertical: 12,
        color: COLORS.text_primary,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...FONTS.body3,
    },

    // Issue button
    issueBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: SPACING.xxl,
    },
    issueBtnText: { ...FONTS.label, color: COLORS.white, fontWeight: "700", fontSize: 15 },

    seedBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: "dashed" as const,
    },
    seedBtnText: { ...FONTS.caption, color: COLORS.text_muted },
});
