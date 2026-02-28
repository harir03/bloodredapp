import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../../config/firebase";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { bloodPouchService } from "../../services/bloodPouchService";
import { useAuth } from "../../stores/AuthProvider";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface DonorProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    blood_group?: string;
    city?: string;
    role: string;
}

export default function AddBloodPouchScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { profile, userId } = useAuth();

    // Donor search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DonorProfile[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedDonor, setSelectedDonor] = useState<DonorProfile | null>(null);

    // Pouch details
    const [units, setUnits] = useState("1");
    const [hospital, setHospital] = useState("");
    const [notes, setNotes] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const collectionDate = new Date().toISOString().split("T")[0];

    // Search donors by name, email, or phone
    const handleSearch = useCallback(async () => {
        const q = searchQuery.trim().toLowerCase();
        if (!q || q.length < 2) {
            Alert.alert("Search", "Please enter at least 2 characters to search.");
            return;
        }

        setSearching(true);
        setSearchResults([]);
        try {
            // Search by email (exact match)
            const emailSnap = await getDocs(
                query(collection(db, "profiles"), where("email", "==", q))
            );
            const emailResults = emailSnap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as any),
            })) as DonorProfile[];

            // Search by phone (exact match)
            const phoneSnap = await getDocs(
                query(collection(db, "profiles"), where("phone", "==", q))
            );
            const phoneResults = phoneSnap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as any),
            })) as DonorProfile[];

            // Merge results, removing duplicates
            const seen = new Set<string>();
            const merged: DonorProfile[] = [];
            for (const r of [...emailResults, ...phoneResults]) {
                if (!seen.has(r.id)) {
                    seen.add(r.id);
                    merged.push(r);
                }
            }

            // If no exact matches, try getting all profiles and filtering client-side by name
            if (merged.length === 0) {
                const allSnap = await getDocs(collection(db, "profiles"));
                for (const d of allSnap.docs) {
                    const data = d.data() as any;
                    const name = (data.name || "").toLowerCase();
                    const email = (data.email || "").toLowerCase();
                    const phone = (data.phone || "");
                    if (
                        (name.includes(q) || email.includes(q) || phone.includes(q)) &&
                        !seen.has(d.id)
                    ) {
                        seen.add(d.id);
                        merged.push({ id: d.id, ...data } as DonorProfile);
                    }
                }
            }

            if (merged.length === 0) {
                Alert.alert(
                    "No Donor Found",
                    "No registered user found. The donor must have an account in the app to register a blood pouch."
                );
            }

            setSearchResults(merged);
        } catch (e) {
            console.error("Donor search error:", e);
            Alert.alert("Error", "Failed to search donors.");
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    const pickImage = useCallback(async (source: "camera" | "gallery") => {
        const requestPermission = source === "camera"
            ? ImagePicker.requestCameraPermissionsAsync
            : ImagePicker.requestMediaLibraryPermissionsAsync;

        const { status } = await requestPermission();
        if (status !== "granted") {
            Alert.alert("Permission Required", `Please grant ${source} access.`);
            return;
        }

        const launchFn = source === "camera"
            ? ImagePicker.launchCameraAsync
            : ImagePicker.launchImageLibraryAsync;

        const result = await launchFn({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
            allowsEditing: true,
            aspect: [4, 3],
        });

        if (!result.canceled && result.assets?.[0]) {
            setImageUri(result.assets[0].uri);
        }
    }, []);

    const showImagePicker = useCallback(() => {
        Alert.alert("Add Pouch Photo", "Choose a source", [
            { text: "Camera", onPress: () => pickImage("camera") },
            { text: "Gallery", onPress: () => pickImage("gallery") },
            { text: "Cancel", style: "cancel" },
        ]);
    }, [pickImage]);

    const handleSave = useCallback(async () => {
        if (!selectedDonor) {
            Alert.alert("No Donor", "Please search and select a registered donor first.");
            return;
        }

        setSaving(true);
        try {
            const pouch = await bloodPouchService.create({
                donorName: selectedDonor.name,
                donorAge: 0, // Not manually entered; comes from profile if available
                donorGender: "other", // Default; can be extended
                donorPhone: selectedDonor.phone || "",
                bloodGroup: selectedDonor.blood_group || "Unknown",
                units: parseInt(units) || 1,
                collectionDate,
                notes: notes.trim(),
                imageUri: imageUri || undefined,
                collectedBy: userId || "",
                collectedByName: profile?.name || "Unknown",
                city: selectedDonor.city || (profile as any)?.city || "",
                hospital: hospital.trim() || undefined,
                donorUserId: selectedDonor.id, // Link to their profile for notifications
            });

            Alert.alert(
                "✅ Blood Pouch Registered",
                `Pouch ID: ${pouch.pouchId}\nDonor: ${pouch.donorName}\nBlood Group: ${pouch.bloodGroup}\nExpiry: ${pouch.expiryDate}\n\nThe donor will be notified when this blood is used.`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (e) {
            console.error("Save pouch error:", e);
            Alert.alert("Error", "Failed to save blood pouch. Please try again.");
        } finally {
            setSaving(false);
        }
    }, [selectedDonor, units, notes, imageUri, userId, profile, hospital, collectionDate, navigation]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Register Blood Pouch</Text>
                    <Text style={styles.headerSub}>Search donor → Add pouch details</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Auto-generated Pouch ID Preview */}
                <View style={styles.pouchIdCard}>
                    <Ionicons name="barcode-outline" size={20} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pouchIdLabel}>Pouch ID (Auto-generated on save)</Text>
                        <Text style={styles.pouchIdText}>BP-{collectionDate.replace(/-/g, "")}-XXXXX</Text>
                    </View>
                    <View style={styles.pouchIdBadge}>
                        <Text style={styles.pouchIdBadgeText}>Auto</Text>
                    </View>
                </View>

                {/* STEP 1: Search Donor */}
                <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step 1</Text>
                </View>
                <Text style={styles.sectionTitle}>Find Registered Donor</Text>
                <Text style={styles.sectionSub}>
                    Search by name, email, or phone. Donor must have an account.
                </Text>

                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Name, email, or phone..."
                        placeholderTextColor={COLORS.text_disabled}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
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

                {/* Selected Donor */}
                {selectedDonor && (
                    <View style={styles.selectedCard}>
                        <View style={styles.selectedAvatar}>
                            <Text style={styles.selectedAvatarText}>
                                {selectedDonor.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.selectedName}>{selectedDonor.name}</Text>
                            <Text style={styles.selectedEmail}>{selectedDonor.email}</Text>
                            <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                                {selectedDonor.blood_group && (
                                    <View style={styles.bgTag}>
                                        <Text style={styles.bgTagText}>{selectedDonor.blood_group}</Text>
                                    </View>
                                )}
                                {selectedDonor.city && (
                                    <Text style={styles.selectedCity}>📍 {selectedDonor.city}</Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => { setSelectedDonor(null); setSearchResults([]); }}>
                            <Ionicons name="close-circle" size={22} color={COLORS.text_muted} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Search Results */}
                {!selectedDonor && searchResults.length > 0 && (
                    <View style={styles.resultsList}>
                        {searchResults.map((donor) => (
                            <TouchableOpacity
                                key={donor.id}
                                style={styles.resultCard}
                                onPress={() => {
                                    setSelectedDonor(donor);
                                    setSearchResults([]);
                                }}
                            >
                                <View style={styles.resultAvatar}>
                                    <Text style={styles.resultAvatarText}>
                                        {donor.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.resultName}>{donor.name}</Text>
                                    <Text style={styles.resultSub}>{donor.email}</Text>
                                </View>
                                {donor.blood_group && (
                                    <View style={styles.bgTag}>
                                        <Text style={styles.bgTagText}>{donor.blood_group}</Text>
                                    </View>
                                )}
                                <Ionicons name="add-circle" size={22} color={COLORS.primary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* STEP 2: Pouch Details (only shown after donor selected) */}
                {selectedDonor && (
                    <>
                        <View style={[styles.stepBadge, { marginTop: SPACING.xl }]}>
                            <Text style={styles.stepBadgeText}>Step 2</Text>
                        </View>
                        <Text style={styles.sectionTitle}>Pouch Details</Text>

                        {/* Units & Hospital */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Units</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="1"
                                    placeholderTextColor={COLORS.text_disabled}
                                    value={units}
                                    onChangeText={setUnits}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.label}>Hospital / Camp</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Collection location"
                                    placeholderTextColor={COLORS.text_disabled}
                                    value={hospital}
                                    onChangeText={setHospital}
                                />
                            </View>
                        </View>

                        {/* Notes */}
                        <Text style={styles.label}>Notes / Observations</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
                            placeholder="Special notes about the pouch or donation..."
                            placeholderTextColor={COLORS.text_disabled}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Blood Pouch Image */}
                        <Text style={styles.label}>Blood Pouch Photo</Text>
                        <TouchableOpacity style={styles.imagePicker} onPress={showImagePicker}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.pouchImage} resizeMode="cover" />
                            ) : (
                                <View style={styles.imagePickerEmpty}>
                                    <Ionicons name="camera-outline" size={32} color={COLORS.text_muted} />
                                    <Text style={styles.imagePickerText}>Tap to add photo</Text>
                                    <Text style={styles.imagePickerSub}>Camera or Gallery</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        {imageUri && (
                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => setImageUri(null)}
                            >
                                <Ionicons name="close-circle" size={16} color={COLORS.critical} />
                                <Text style={styles.removeImageText}>Remove Photo</Text>
                            </TouchableOpacity>
                        )}

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                            )}
                            <Text style={styles.saveBtnText}>
                                {saving ? "Registering..." : "Register Blood Pouch"}
                            </Text>
                        </TouchableOpacity>

                        {/* Info Banner */}
                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
                            <Text style={styles.infoBannerText}>
                                When this blood is used, the donor will automatically receive a notification and a shareable "Lifesaver" message.
                            </Text>
                        </View>
                    </>
                )}
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

    // Pouch ID preview
    pouchIdCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary + "0A",
        borderRadius: 12,
        padding: SPACING.m,
        gap: 10,
        borderWidth: 1,
        borderColor: COLORS.primary + "22",
        marginBottom: SPACING.l,
    },
    pouchIdLabel: { ...FONTS.caption, color: COLORS.text_muted },
    pouchIdText: { ...FONTS.label, color: COLORS.primary, fontWeight: "700" },
    pouchIdBadge: {
        backgroundColor: COLORS.primary + "18",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pouchIdBadgeText: { ...FONTS.caption, color: COLORS.primary, fontWeight: "600" },

    // Steps
    stepBadge: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.primary + "15",
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 6,
    },
    stepBadgeText: { ...FONTS.caption, color: COLORS.primary, fontWeight: "700" },
    sectionTitle: { ...FONTS.h4, color: COLORS.text_primary, marginBottom: 2 },
    sectionSub: { ...FONTS.caption, color: COLORS.text_muted, marginBottom: SPACING.m },

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

    // Selected Donor
    selectedCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.success + "0A",
        borderRadius: 14,
        padding: SPACING.m,
        marginTop: SPACING.m,
        borderWidth: 1.5,
        borderColor: COLORS.success + "44",
        gap: 12,
    },
    selectedAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.success + "20",
        alignItems: "center",
        justifyContent: "center",
    },
    selectedAvatarText: { fontSize: 20, fontWeight: "700", color: COLORS.success },
    selectedName: { ...FONTS.label, color: COLORS.text_primary, fontWeight: "700" },
    selectedEmail: { ...FONTS.caption, color: COLORS.text_muted },
    selectedCity: { ...FONTS.caption, color: COLORS.text_muted },
    bgTag: {
        backgroundColor: COLORS.primary + "18",
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    bgTagText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },

    // Search results
    resultsList: { marginTop: SPACING.s },
    resultCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.m,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 10,
    },
    resultAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + "15",
        alignItems: "center",
        justifyContent: "center",
    },
    resultAvatarText: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
    resultName: { ...FONTS.label, color: COLORS.text_primary },
    resultSub: { ...FONTS.caption, color: COLORS.text_muted },

    // Form
    label: {
        ...FONTS.label,
        color: COLORS.text_secondary,
        marginTop: SPACING.l,
        marginBottom: 6,
    },
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
    row: { flexDirection: "row", gap: 10 },

    // Image picker
    imagePicker: {
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderStyle: "dashed" as const,
        backgroundColor: COLORS.surface,
    },
    imagePickerEmpty: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 36,
    },
    imagePickerText: { ...FONTS.label, color: COLORS.text_muted, marginTop: 8 },
    imagePickerSub: { ...FONTS.caption, color: COLORS.text_disabled, marginTop: 2 },
    pouchImage: { width: "100%", height: 200, borderRadius: 12 },
    removeImageBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 6,
        alignSelf: "flex-end",
    },
    removeImageText: { ...FONTS.caption, color: COLORS.critical },

    // Save
    saveBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: SPACING.xxl,
    },
    saveBtnText: { ...FONTS.label, color: COLORS.white, fontWeight: "700", fontSize: 15 },

    // Info banner
    infoBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: COLORS.info + "0A",
        padding: SPACING.m,
        borderRadius: 10,
        marginTop: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.info + "22",
    },
    infoBannerText: { ...FONTS.caption, color: COLORS.info, flex: 1, lineHeight: 16 },
});
