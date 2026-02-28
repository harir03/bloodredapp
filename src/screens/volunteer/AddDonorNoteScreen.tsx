import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../../components/ui/AppButton";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { donorService } from "../../services/donorService";
import { useAuth } from "../../stores/AuthProvider";

const AddDonorNoteScreen = ({ navigation }: any) => {
    const { profile, userId } = useAuth();
    const insets = useSafeAreaInsets();
    const [note, setNote] = useState("");
    const [type, setType] = useState<"medical" | "behavioral" | "general">("general");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!note.trim()) {
            Alert.alert("Error", "Please enter a note.");
            return;
        }

        setLoading(true);
        try {
            // In this app, donor notes for the logged-in user are stored in their profile/donor record.
            // We'll use the donorID if they are a donor, or their profile ID.
            const remark = {
                date: new Date().toISOString(),
                authorId: userId || "unknown",
                authorName: profile?.name || "Donor",
                text: note,
                type: type,
            };

            await donorService.addRemark(userId || "", remark);
            Alert.alert("Success", "Your note has been saved.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to save note.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + SPACING.m }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text_primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Note</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.label}>Note Type</Text>
                <View style={styles.typeContainer}>
                    {(["general", "medical", "behavioral"] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.typeBtn,
                                type === t && { backgroundColor: getThemeColor(t), borderColor: getThemeColor(t) }
                            ]}
                            onPress={() => setType(t)}
                        >
                            <Text style={[styles.typeText, type === t && { color: "#fff" }]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Your Note</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Write details about your health, requirements or any specific interaction details..."
                    placeholderTextColor={COLORS.text_muted}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    value={note}
                    onChangeText={setNote}
                />

                <View style={styles.footer}>
                    <AppButton
                        title="Save Note"
                        onPress={handleSubmit}
                        loading={loading}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const getThemeColor = (type: string) => {
    switch (type) {
        case "medical": return COLORS.critical;
        case "behavioral": return COLORS.warning;
        default: return COLORS.primary;
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: SPACING.l,
        paddingBottom: SPACING.m,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: { ...FONTS.h3, color: COLORS.text_primary },
    content: { padding: SPACING.l },
    label: { ...FONTS.body3, color: COLORS.text_secondary, marginBottom: SPACING.s, fontWeight: "600" as const },
    typeContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: SPACING.l,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        backgroundColor: COLORS.surface,
    },
    typeText: { fontSize: 13, color: COLORS.text_secondary, fontWeight: "500" as const },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.m,
        color: COLORS.text_primary,
        fontSize: 16,
        minHeight: 150,
        marginBottom: SPACING.xl,
    },
    footer: { marginTop: SPACING.m },
});

export default AddDonorNoteScreen;
