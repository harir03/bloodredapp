import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationBell } from "../../components/ui/NotificationBell";
import { COLORS, FONTS, RADII, SPACING } from "../../constants/theme";
import { bloodRequestService } from "../../services/bloodRequestService";
import { Certificate, certificateService } from "../../services/certificateService";
import { donorService } from "../../services/donorService";
import { BADGES, computeBadges } from "../../services/leaderboardService";
import { useAuth } from "../../stores/AuthProvider";
import type { BloodRequest, DonationHistoryEntry, Donor, DonorRemark } from "../../types/database";

const DonorDashboardScreen = ({ navigation }: any) => {
    const { profile, userId } = useAuth();
    const insets = useSafeAreaInsets();
    const [donor, setDonor] = useState<Donor | null>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        if (!userId) return;
        try {
            const [donorRes, certs, requests] = await Promise.all([
                donorService.getById(userId),
                certificateService.getCertificatesForUser(userId),
                bloodRequestService.getAll({ status: "pending" }),
            ]);
            if (donorRes.data) setDonor(donorRes.data);
            setCertificates(certs);
            // Also include in_progress requests
            const inProgress = await bloodRequestService.getAll({ status: "in_progress" }).catch(() => []);
            setBloodRequests([...requests, ...inProgress].slice(0, 10));
        } catch (e) {
            console.log("DonorDashboard load error:", e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    // Data
    const points = (profile as any)?.points || 0;
    const badges = (profile as any)?.badges || computeBadges(points);
    const streak = profile?.currentStreak ?? 0;
    const longestStreak = profile?.longestStreak ?? streak;
    const donationHistory: DonationHistoryEntry[] = donor?.donationHistory || [];
    const remarks: DonorRemark[] = donor?.remarks || profile?.remarks || [];
    const totalDonations = donor?.totalDonations ?? donationHistory.length;
    const bloodGroup = donor?.bloodGroup || donor?.blood_group || (profile as any)?.blood_group || "—";

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: insets.bottom + 100 }
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={COLORS.primary}
                    colors={[COLORS.primary]}
                />
            }
        >
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }} />
                <NotificationBell onPress={() => navigation.navigate("Notifications")} />
            </View>

            {/* Hero Section */}
            <View style={styles.hero}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(profile?.name ?? "D").charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.welcome}>Welcome, {profile?.name}!</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.roleBadge}>
                        <Ionicons name="water" size={14} color={COLORS.accent} />
                        <Text style={styles.roleText}>
                            {bloodGroup} Donor
                        </Text>
                    </View>
                    {streak > 0 && (
                        <View style={[styles.roleBadge, styles.streakBadge]}>
                            <Ionicons name="flame" size={14} color={COLORS.warning} />
                            <Text style={[styles.roleText, styles.streakText]}>
                                {streak} Day Streak
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{totalDonations}</Text>
                    <Text style={styles.statLabel}>Donations</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{points}</Text>
                    <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{badges.length}</Text>
                    <Text style={styles.statLabel}>Badges</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{longestStreak}</Text>
                    <Text style={styles.statLabel}>Best Streak</Text>
                </View>
            </View>

            {/* Blood Needed — Active Requests */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>🩸 BLOOD NEEDED</Text>
            </View>
            {bloodRequests.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.l }}>
                    {bloodRequests.map((req) => {
                        const isMatch = bloodGroup !== "—" && req.bloodGroup === bloodGroup;
                        const urgencyColors: Record<string, string> = {
                            critical: COLORS.critical,
                            medium: COLORS.warning,
                            low: COLORS.info,
                        };
                        const uc = urgencyColors[req.urgency] || COLORS.info;
                        return (
                            <TouchableOpacity
                                key={req.id}
                                style={[styles.requestCard, isMatch && styles.requestCardMatch]}
                                onPress={() => navigation.navigate("BloodRequestDetails", { requestId: req.id })}
                                activeOpacity={0.8}
                            >
                                {isMatch && (
                                    <View style={styles.matchTag}>
                                        <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                                        <Text style={styles.matchTagText}>Your Match!</Text>
                                    </View>
                                )}
                                <View style={styles.requestGroupWrap}>
                                    <Text style={styles.requestGroupText}>{req.bloodGroup}</Text>
                                </View>
                                <Text style={styles.requestPatient} numberOfLines={1}>{req.patientName}</Text>
                                <Text style={styles.requestDetail} numberOfLines={1}>
                                    {req.units} unit(s) • {req.hospital}
                                </Text>
                                <Text style={styles.requestCity} numberOfLines={1}>
                                    📍 {req.city}
                                </Text>
                                <View style={[styles.urgencyPill, { backgroundColor: uc + "22" }]}>
                                    <View style={[styles.urgencyDot, { backgroundColor: uc }]} />
                                    <Text style={[styles.urgencyText, { color: uc }]}>
                                        {req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            ) : (
                <View style={styles.emptySection}>
                    <Ionicons name="checkmark-done-circle-outline" size={28} color={COLORS.success + "77"} />
                    <Text style={styles.emptySectionText}>No active blood requests right now 🎉</Text>
                </View>
            )}

            {/* Quick Access */}
            <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
            <View style={styles.grid}>
                {[
                    { icon: "person-outline", label: "Profile", color: COLORS.info, screen: "Profile" },
                    { icon: "trophy-outline", label: "Leaderboard", color: COLORS.warning, screen: "Leaderboard" },
                    { icon: "calendar-outline", label: "Events", color: COLORS.success, screen: "Events" },
                    { icon: "ribbon-outline", label: "Certificates", color: "#8B5CF6", screen: "Certificates" },
                ].map((item) => (
                    <TouchableOpacity
                        key={item.screen}
                        style={styles.gridItem}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: item.color + "22" }]}>
                            <Ionicons name={item.icon as any} size={24} color={item.color} />
                        </View>
                        <Text style={styles.gridLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Badges Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>BADGES EARNED</Text>
                <TouchableOpacity onPress={() => navigation.navigate("AllBadges")}>
                    <Text style={styles.viewAllText}>View All →</Text>
                </TouchableOpacity>
            </View>
            {badges.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.l }}>
                    {badges.map((b: string) => {
                        const info = BADGES[b];
                        if (!info) return null;
                        return (
                            <View key={b} style={styles.badgeChip}>
                                <Text style={styles.badgeEmoji}>{info.emoji}</Text>
                                <Text style={styles.badgeChipLabel}>{info.label}</Text>
                            </View>
                        );
                    })}
                </ScrollView>
            ) : (
                <View style={styles.emptySection}>
                    <Ionicons name="ribbon-outline" size={28} color={COLORS.text_muted + "55"} />
                    <Text style={styles.emptySectionText}>No badges yet. Keep contributing!</Text>
                </View>
            )}

            {/* Certificates Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>CERTIFICATES</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Certificates")}>
                    <Text style={styles.viewAllText}>View All →</Text>
                </TouchableOpacity>
            </View>
            {certificates.length > 0 ? (
                certificates.slice(0, 3).map((cert) => (
                    <TouchableOpacity
                        key={cert.id}
                        style={styles.certCard}
                        onPress={() => navigation.navigate("Certificates")}
                    >
                        <View style={[styles.certIcon, {
                            backgroundColor: cert.type === "donor" ? COLORS.primary + "18" : "#2563EB18"
                        }]}>
                            <Text style={{ fontSize: 18 }}>{cert.type === "donor" ? "🩸" : "🤝"}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.certTitle}>
                                {cert.type === "donor" ? "Donation Certificate" : "Service Certificate"}
                            </Text>
                            <Text style={styles.certSub}>
                                {cert.eventName} • {new Date(cert.date).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric"
                                })}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.text_muted} />
                    </TouchableOpacity>
                ))
            ) : (
                <View style={styles.emptySection}>
                    <Ionicons name="document-outline" size={28} color={COLORS.text_muted + "55"} />
                    <Text style={styles.emptySectionText}>No certificates earned yet.</Text>
                </View>
            )}

            {/* Past Donations */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>PAST DONATIONS</Text>
            </View>
            {donationHistory.length > 0 ? (
                donationHistory.slice().reverse().slice(0, 5).map((entry, idx) => (
                    <View key={idx} style={styles.donationRow}>
                        <View style={styles.donationIconWrap}>
                            <Ionicons name="water" size={16} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.donationText}>
                                Donated <Text style={{ fontWeight: "700", color: COLORS.primary }}>{entry.units} unit(s)</Text>
                            </Text>
                            {entry.camp && (
                                <Text style={styles.donationSub}>at {entry.camp}</Text>
                            )}
                        </View>
                        <Text style={styles.donationDate}>
                            {new Date(entry.date).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short"
                            })}
                        </Text>
                    </View>
                ))
            ) : (
                <View style={styles.emptySection}>
                    <Ionicons name="water-outline" size={28} color={COLORS.text_muted + "55"} />
                    <Text style={styles.emptySectionText}>No donation history yet.</Text>
                </View>
            )}

            {/* Notes & Volunteer Reviews */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>NOTES & VOLUNTEER REVIEWS</Text>
                <TouchableOpacity onPress={() => navigation.navigate("AddDonorNote")}>
                    <Text style={styles.viewAllText}>+ Add Note</Text>
                </TouchableOpacity>
            </View>
            {remarks.length > 0 ? (
                remarks.slice().reverse().slice(0, 5).map((remark: any, idx: number) => (
                    <View key={remark.id || idx} style={styles.remarkCard}>
                        <View style={styles.remarkHeader}>
                            <View style={[styles.remarkType, { backgroundColor: getRemarkColor(remark.type) + "22" }]}>
                                <Text style={[styles.remarkTypeText, { color: getRemarkColor(remark.type) }]}>
                                    {(remark.type || "general").toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.remarkDate}>
                                {new Date(remark.date).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric"
                                })}
                            </Text>
                        </View>
                        <Text style={styles.remarkText}>{remark.text}</Text>
                        <Text style={styles.remarkAuthor}>— By {remark.authorName}</Text>
                    </View>
                ))
            ) : (
                <View style={styles.emptySection}>
                    <Ionicons name="chatbox-ellipses-outline" size={28} color={COLORS.text_muted + "55"} />
                    <Text style={styles.emptySectionText}>No notes or medical remarks yet.</Text>
                </View>
            )}
        </ScrollView>
    );
};

const getRemarkColor = (type: string) => {
    switch (type) {
        case "medical": return COLORS.critical;
        case "behavioral": return COLORS.warning;
        default: return COLORS.primary;
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SPACING.l, paddingTop: 60 },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginBottom: SPACING.s,
    },
    hero: { alignItems: "center", marginBottom: SPACING.l },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.accent + "22",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.accent,
        marginBottom: SPACING.m,
    },
    avatarText: { fontSize: 32, fontWeight: "bold" as const, color: COLORS.accent },
    welcome: { ...FONTS.h2, color: COLORS.text_primary, marginBottom: 4 },
    badgeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: RADII.full,
        backgroundColor: COLORS.accent + "18",
        borderWidth: 1,
        borderColor: COLORS.accent + "44",
    },
    roleText: { ...FONTS.caption, color: COLORS.accent, fontWeight: "600" as const },
    streakBadge: {
        backgroundColor: COLORS.warning + "18",
        borderColor: COLORS.warning + "44",
    },
    streakText: { color: COLORS.warning },

    // Stats
    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: SPACING.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statValue: {
        ...FONTS.h3,
        color: COLORS.primary,
        fontWeight: "700" as const,
    },
    statLabel: {
        ...FONTS.caption,
        color: COLORS.text_muted,
        marginTop: 2,
    },

    // Quick Access
    sectionLabel: {
        ...FONTS.caption,
        letterSpacing: 1,
        color: COLORS.text_muted,
        marginBottom: SPACING.m,
        paddingLeft: 4,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.m, marginBottom: SPACING.l },
    gridItem: {
        width: "47%",
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.m,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    gridIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    gridLabel: { ...FONTS.body3, color: COLORS.text_primary, fontWeight: "500" as const },

    // Section Header
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: SPACING.l,
        marginBottom: SPACING.m,
        paddingHorizontal: 4,
    },
    viewAllText: { ...FONTS.caption, color: COLORS.primary, fontWeight: "600" as const },

    // Badges
    badgeChip: {
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: 72,
    },
    badgeEmoji: { fontSize: 26, marginBottom: 4 },
    badgeChipLabel: { ...FONTS.caption, color: COLORS.text_primary, fontWeight: "500" as const },

    // Certificates
    certCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.m,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 12,
    },
    certIcon: {
        width: 42,
        height: 42,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    certTitle: { ...FONTS.label, color: COLORS.text_primary },
    certSub: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 2 },

    // Blood Request Cards
    requestCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: SPACING.m,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        width: 170,
    },
    requestCardMatch: {
        borderColor: COLORS.success + "66",
        backgroundColor: COLORS.success + "08",
    },
    matchTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        marginBottom: 6,
    },
    matchTagText: { fontSize: 10, fontWeight: "700" as const, color: COLORS.success },
    requestGroupWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + "15",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    requestGroupText: { ...FONTS.h4, color: COLORS.primary, fontWeight: "800" as const },
    requestPatient: { ...FONTS.label, color: COLORS.text_primary, marginBottom: 2 },
    requestDetail: { ...FONTS.caption, color: COLORS.text_muted, marginBottom: 2 },
    requestCity: { ...FONTS.caption, color: COLORS.text_muted, marginBottom: 6 },
    urgencyPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    urgencyDot: { width: 6, height: 6, borderRadius: 3 },
    urgencyText: { fontSize: 10, fontWeight: "700" as const },

    // Donations
    donationRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        padding: SPACING.m,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 10,
    },
    donationIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.primary + "15",
        alignItems: "center",
        justifyContent: "center",
    },
    donationText: { ...FONTS.body3, color: COLORS.text_primary },
    donationSub: { ...FONTS.caption, color: COLORS.text_muted, marginTop: 1 },
    donationDate: { ...FONTS.caption, color: COLORS.text_muted, fontWeight: "500" as const },

    // Remarks
    remarkCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    remarkHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    remarkType: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    remarkTypeText: { fontSize: 10, fontWeight: "bold" as const },
    remarkDate: { fontSize: 11, color: COLORS.text_muted },
    remarkText: { ...FONTS.body3, color: COLORS.text_primary, marginBottom: 8, lineHeight: 20 },
    remarkAuthor: { fontSize: 11, color: COLORS.text_muted, fontStyle: "italic" as const },

    // Empty States
    emptySection: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.surface + "88",
        borderRadius: 12,
        borderStyle: "dashed" as const,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.m,
    },
    emptySectionText: { ...FONTS.body3, color: COLORS.text_muted, marginTop: 8 },
});

export default DonorDashboardScreen;
