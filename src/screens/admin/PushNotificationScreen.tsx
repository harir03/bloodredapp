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
import { aiService, NotificationTarget } from "../../services/aiService";
import { notificationService } from "../../services/notificationService";

type AudienceType = "all" | "donors" | "volunteers";

const CAMPAIGN_TEMPLATES = [
    { label: "Blood Donation Drive", icon: "water", festival: "" },
    { label: "World Blood Donor Day", icon: "earth", festival: "World Blood Donor Day" },
    { label: "Diwali Campaign", icon: "bonfire", festival: "Diwali" },
    { label: "Eid Campaign", icon: "moon", festival: "Eid" },
    { label: "Christmas Campaign", icon: "gift", festival: "Christmas" },
    { label: "Republic Day", icon: "flag", festival: "Republic Day" },
    { label: "Independence Day", icon: "flag", festival: "Independence Day" },
    { label: "Streak & Badge Reminder", icon: "trophy", festival: "" },
];

export default function PushNotificationScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [audience, setAudience] = useState<AudienceType>("all");
    const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
    const [customMessage, setCustomMessage] = useState("");
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [sentCount, setSentCount] = useState<number | null>(null);

    const handleGenerate = useCallback(async () => {
        setGenerating(true);
        setGeneratedMessage("");
        try {
            const festival = selectedCampaign !== null
                ? CAMPAIGN_TEMPLATES[selectedCampaign].festival
                : "";

            const role: NotificationTarget = audience === "volunteers" ? "volunteer" : "donor";

            const msg = await aiService.generateWittyNotification({
                userName: "Hero",
                role,
                festival: festival || undefined,
                city: "your city",
                bloodGroup: "all",
            });
            setGeneratedMessage(msg);
        } catch (e) {
            Alert.alert("Error", "Failed to generate message. Try again.");
        } finally {
            setGenerating(false);
        }
    }, [audience, selectedCampaign]);

    const handleSend = useCallback(async () => {
        const message = customMessage.trim() || generatedMessage.trim();
        if (!message) {
            Alert.alert("No Message", "Please generate or write a message first.");
            return;
        }

        const campaignLabel = selectedCampaign !== null
            ? CAMPAIGN_TEMPLATES[selectedCampaign].label
            : "General";

        Alert.alert(
            "Confirm Send",
            `Send "${message.substring(0, 60)}..." to ${audience === "all" ? "all users" : audience}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send",
                    onPress: async () => {
                        setSending(true);
                        setSentCount(null);
                        try {
                            // Fetch target users from profiles collection
                            let q;
                            if (audience === "donors") {
                                q = query(collection(db, "profiles"), where("role", "==", "donor"));
                            } else if (audience === "volunteers") {
                                q = query(collection(db, "profiles"), where("role", "==", "volunteer"));
                            } else {
                                q = query(collection(db, "profiles"));
                            }

                            const snap = await getDocs(q);
                            let count = 0;

                            for (const doc of snap.docs) {
                                const userId = doc.id;
                                await notificationService.send({
                                    userId,
                                    title: `🩸 ${campaignLabel}`,
                                    body: message,
                                    type: "general",
                                });
                                count++;
                            }

                            setSentCount(count);
                            Alert.alert(
                                "✅ Sent!",
                                `Notification delivered to ${count} user(s).`
                            );
                            setCustomMessage("");
                            setGeneratedMessage("");
                        } catch (e) {
                            console.error("Push notification error:", e);
                            Alert.alert("Error", "Failed to send notifications. Check logs.");
                        } finally {
                            setSending(false);
                        }
                    },
                },
            ]
        );
    }, [customMessage, generatedMessage, audience, selectedCampaign]);

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
                    <Text style={styles.headerTitle}>Push AI Notification</Text>
                    <Text style={styles.headerSub}>Send LLM-generated notifications</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Audience Selector */}
                <Text style={styles.sectionTitle}>Target Audience</Text>
                <View style={styles.audienceRow}>
                    {(["all", "donors", "volunteers"] as AudienceType[]).map((a) => (
                        <TouchableOpacity
                            key={a}
                            style={[styles.audienceBtn, audience === a && styles.audienceBtnActive]}
                            onPress={() => setAudience(a)}
                        >
                            <Ionicons
                                name={a === "all" ? "people" : a === "donors" ? "water" : "hand-left"}
                                size={16}
                                color={audience === a ? COLORS.white : COLORS.text_muted}
                            />
                            <Text style={[styles.audienceText, audience === a && styles.audienceTextActive]}>
                                {a === "all" ? "All Users" : a === "donors" ? "Donors" : "Volunteers"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Campaign Templates */}
                <Text style={styles.sectionTitle}>Campaign / Occasion</Text>
                <View style={styles.campaignGrid}>
                    {CAMPAIGN_TEMPLATES.map((c, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.campaignChip, selectedCampaign === i && styles.campaignChipActive]}
                            onPress={() => setSelectedCampaign(selectedCampaign === i ? null : i)}
                        >
                            <Ionicons
                                name={c.icon as any}
                                size={16}
                                color={selectedCampaign === i ? COLORS.primary : COLORS.text_muted}
                            />
                            <Text style={[styles.campaignText, selectedCampaign === i && styles.campaignTextActive]}>
                                {c.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={handleGenerate}
                    disabled={generating}
                >
                    {generating ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <Ionicons name="sparkles" size={18} color={COLORS.white} />
                    )}
                    <Text style={styles.generateBtnText}>
                        {generating ? "Generating..." : "Generate with AI"}
                    </Text>
                </TouchableOpacity>

                {/* Generated Message */}
                {generatedMessage.length > 0 && (
                    <View style={styles.previewCard}>
                        <View style={styles.previewHeader}>
                            <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.previewLabel}>AI Generated</Text>
                        </View>
                        <Text style={styles.previewText}>{generatedMessage}</Text>
                    </View>
                )}

                {/* Custom Message */}
                <Text style={styles.sectionTitle}>Or Write Custom Message</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Type your notification message..."
                    placeholderTextColor={COLORS.text_disabled}
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    multiline
                    numberOfLines={3}
                />

                {/* Send Button */}
                <TouchableOpacity
                    style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                    onPress={handleSend}
                    disabled={sending}
                >
                    {sending ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <Ionicons name="send" size={18} color={COLORS.white} />
                    )}
                    <Text style={styles.sendBtnText}>
                        {sending ? "Sending..." : "Send to All"}
                    </Text>
                </TouchableOpacity>

                {sentCount !== null && (
                    <View style={styles.sentBanner}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        <Text style={styles.sentText}>
                            Successfully sent to {sentCount} user(s)
                        </Text>
                    </View>
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
    sectionTitle: {
        ...FONTS.label,
        color: COLORS.text_secondary,
        letterSpacing: 0.5,
        marginTop: SPACING.l,
        marginBottom: SPACING.s,
    },
    audienceRow: { flexDirection: "row", gap: 8 },
    audienceBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: RADII.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    audienceBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    audienceText: { ...FONTS.caption, color: COLORS.text_muted, fontWeight: "600" },
    audienceTextActive: { color: COLORS.white },
    campaignGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    campaignChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    campaignChipActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + "12",
    },
    campaignText: { ...FONTS.caption, color: COLORS.text_muted },
    campaignTextActive: { color: COLORS.primary, fontWeight: "600" },
    generateBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#8B5CF6",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: SPACING.l,
    },
    generateBtnText: { ...FONTS.label, color: COLORS.white, fontWeight: "600" },
    previewCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.m,
        marginTop: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.primary + "33",
    },
    previewHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },
    previewLabel: { ...FONTS.caption, color: COLORS.primary, fontWeight: "600" },
    previewText: { ...FONTS.body3, color: COLORS.text_primary, lineHeight: 20 },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.m,
        color: COLORS.text_primary,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...FONTS.body3,
        minHeight: 80,
        textAlignVertical: "top",
    },
    sendBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: SPACING.xl,
    },
    sendBtnText: { ...FONTS.label, color: COLORS.white, fontWeight: "700", fontSize: 15 },
    sentBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: COLORS.success + "15",
        padding: SPACING.m,
        borderRadius: 10,
        marginTop: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.success + "33",
    },
    sentText: { ...FONTS.body3, color: COLORS.success, fontWeight: "600" },
});
