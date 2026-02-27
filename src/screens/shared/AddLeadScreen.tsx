import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { eventService } from "../../services/eventService";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

export default function AddLeadScreen({ route, navigation }: any) {
    const { eventId } = route.params ?? {};

    const [form, setForm] = useState({
        name: "",
        phone: "",
        bloodGroup: "",
        city: "",
        notes: "",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!form.name || !form.phone) {
            Alert.alert("Error", "Name and Phone are required.");
            return;
        }
        if (form.phone.length < 10) {
            Alert.alert("Error", "Please enter a valid phone number.");
            return;
        }

        setLoading(true);
        try {
            await eventService.addLead(eventId, form);
            Alert.alert("Success", "Lead safely recorded to the Event.", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to add lead.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.text_primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Register Lead</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChangeText={(t) => setForm({ ...form, name: t })}
                />

                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                    maxLength={15}
                    value={form.phone}
                    onChangeText={(t) => setForm({ ...form, phone: t })}
                />

                <Text style={styles.label}>City/Area</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. South Delhi"
                    value={form.city}
                    onChangeText={(t) => setForm({ ...form, city: t })}
                />

                <Text style={styles.label}>Blood Group</Text>
                <View style={styles.bgGrid}>
                    {BLOOD_GROUPS.map((bg) => {
                        const isSelected = form.bloodGroup === bg;
                        return (
                            <TouchableOpacity
                                key={bg}
                                style={[styles.bgPill, isSelected && styles.bgPillActive]}
                                onPress={() => setForm({ ...form, bloodGroup: bg })}
                            >
                                <Text
                                    style={[
                                        styles.bgText,
                                        isSelected && styles.bgTextActive,
                                    ]}
                                >
                                    {bg}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.label}>Internal Notes (Optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Willing to donate only on weekends, etc."
                    multiline
                    numberOfLines={3}
                    value={form.notes}
                    onChangeText={(t) => setForm({ ...form, notes: t })}
                />

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitBtnText}>Add to Prospects</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: SPACING.l,
        paddingTop: SPACING.xxl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface2,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        ...FONTS.h3,
        color: COLORS.text_primary,
        flex: 1,
        textAlign: "center",
    },
    scroll: { padding: SPACING.l, paddingBottom: 60 },
    label: { ...FONTS.body2, color: COLORS.text_secondary, marginBottom: 8 },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADII.m,
        padding: 14,
        ...FONTS.body1,
        color: COLORS.text_primary,
        marginBottom: SPACING.l,
    },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    bgGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: SPACING.l,
    },
    bgPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: RADII.full,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    bgPillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    bgText: { ...FONTS.body2, color: COLORS.text_primary },
    bgTextActive: { color: COLORS.white, fontWeight: "600" },
    submitBtn: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: RADII.m,
        alignItems: "center",
        marginTop: SPACING.m,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { ...FONTS.h4, color: COLORS.white },
});
